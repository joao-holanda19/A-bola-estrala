// ============================================================
// A Bola Estrala — Game Scene
// Main gameplay: arena, vehicles, TNT ball, goals, steam geysers, HUD
// ============================================================
import Phaser from 'phaser';
import { GAME, PHYSICS, ARENA, COLORS, CATEGORIES } from '../config';
import { Vehicle } from '../entities/Vehicle';
import { Ball } from '../entities/Ball';
import { Goal } from '../entities/Goal';
import { SteamGeyser } from '../entities/SteamGeyser';
import { InputManager } from '../systems/InputManager';

export class GameScene extends Phaser.Scene {
  private vehicle1!: Vehicle;
  private vehicle2!: Vehicle;
  private ball!: Ball;
  public goalLeft!: Goal;
  public goalRight!: Goal;
  private geysers: SteamGeyser[] = [];
  private inputManager!: InputManager;

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private score: [number, number] = [0, 0];
  private matchTimer: number = 0;
  private matchPaused: boolean = false;

  // Dust particles
  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.score = [0, 0];
    this.matchTimer = 0;
    this.matchPaused = false;
    this.geysers = [];

    // --- Build the arena ---
    this.createArena();

    // --- Create steam geysers ---
    this.createGeysers();

    // --- Create goals ---
    this.goalLeft = new Goal(this, 0);
    this.goalRight = new Goal(this, 1);

    // --- Create the ball ---
    this.ball = new Ball(this, ARENA.BALL_SPAWN.x, ARENA.BALL_SPAWN.y);

    // --- Create vehicles ---
    this.vehicle1 = new Vehicle(
      this,
      ARENA.VEHICLE_P1_SPAWN.x, ARENA.VEHICLE_P1_SPAWN.y,
      0, 0, // facing right
    );

    this.vehicle2 = new Vehicle(
      this,
      ARENA.VEHICLE_P2_SPAWN.x, ARENA.VEHICLE_P2_SPAWN.y,
      1, Math.PI, // facing left
    );

    // --- Input manager ---
    this.inputManager = new InputManager(this);

    // --- HUD ---
    this.createHUD();

    // --- Collision & Event detection ---
    this.setupCollisionHandling();

    // --- Arena dust particles ---
    this.setupDustParticles();

    // --- Arena decorations ---
    this.createArenaDecorations();
  }

  update(_time: number, delta: number): void {
    if (this.matchPaused) return;

    // Update timer
    this.matchTimer += delta / 1000;
    this.updateTimerDisplay();

    // Process inputs and update vehicles
    const input1 = this.inputManager.getInput(0);
    const input2 = this.inputManager.getInput(1);

    this.vehicle1.update(input1, delta);
    this.vehicle2.update(input2, delta);

    // Update ball
    this.ball.update();

    // Update geysers cooldown
    for (const geyser of this.geysers) {
      geyser.update(delta);
    }

    // Dust trail from vehicles
    this.emitVehicleDust(this.vehicle1);
    this.emitVehicleDust(this.vehicle2);
  }

  // ========================
  // Arena Construction
  // ========================

  private createArena(): void {
    const w = GAME.WIDTH;
    const h = GAME.HEIGHT;
    const t = PHYSICS.WALL_THICKNESS;
    const goalH = ARENA.GOAL_HEIGHT;
    const goalY = ARENA.GOAL_Y;

    // Floor base
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.SAND).setDepth(0);

    // Dust field grid/lines for western arena look
    const gfx = this.add.graphics();
    gfx.lineStyle(1, COLORS.BURNT_WOOD, 0.15);
    for (let x = 60; x < w; x += 60) {
      gfx.moveTo(x, 0);
      gfx.lineTo(x, h);
    }
    for (let y = 60; y < h; y += 60) {
      gfx.moveTo(0, y);
      gfx.lineTo(w, y);
    }
    gfx.strokePath();
    gfx.setDepth(1);

    // Midfield line
    this.add.rectangle(w / 2, h / 2, 4, h - t * 2, COLORS.DUST).setAlpha(0.4).setDepth(1);

    // Center circle
    const centerCircle = this.add.circle(w / 2, h / 2, 80);
    centerCircle.setStrokeStyle(3, COLORS.DUST);
    centerCircle.setAlpha(0.3);
    centerCircle.setDepth(1);

    // Center gold star/spur
    const star = this.add.text(w / 2, h / 2, '★', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffd700',
    }).setOrigin(0.5).setAlpha(0.3).setDepth(1);
    star.rotation = 0.2;

    // --- Walls with gaps for goals ---
    // Top wall
    this.createWall(w / 2, t / 2, w, t);
    // Bottom wall
    this.createWall(w / 2, h - t / 2, w, t);

    // Left side walls (with goal gap)
    const sideHeight = (h - goalH) / 2 - t;
    this.createWall(t / 2, t + sideHeight / 2, t, sideHeight);
    this.createWall(t / 2, h - t - sideHeight / 2, t, sideHeight);

    // Right side walls (with goal gap)
    this.createWall(w - t / 2, t + sideHeight / 2, t, sideHeight);
    this.createWall(w - t / 2, h - t - sideHeight / 2, t, sideHeight);

    // Back walls behind goals
    this.createWall(-5, goalY, 10, goalH);
    this.createWall(w + 5, goalY, 10, goalH);
  }

  private createWall(x: number, y: number, width: number, height: number): void {
    const wallRect = this.add.rectangle(x, y, width, height, COLORS.DARK_WOOD);
    wallRect.setStrokeStyle(2, COLORS.BURNT_WOOD);
    wallRect.setDepth(8);

    this.matter.add.rectangle(x, y, width, height, {
      isStatic: true,
      restitution: 0.6,
      friction: 0.2,
      collisionFilter: {
        category: CATEGORIES.WALL,
        mask: CATEGORIES.VEHICLE | CATEGORIES.BALL,
      },
      label: 'wall',
    });
  }

  private createGeysers(): void {
    ARENA.GEYSER_POSITIONS.forEach((pos, index) => {
      const geyser = new SteamGeyser(this, pos.x, pos.y, index);
      this.geysers.push(geyser);
    });
  }

  // ========================
  // HUD
  // ========================

  private createHUD(): void {
    // Score display
    this.scoreText = this.add.text(
      GAME.WIDTH / 2, 18,
      'P1  0 — 0  P2',
      {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#f5e6c8',
        fontStyle: 'bold',
        stroke: '#3e2723',
        strokeThickness: 5,
      },
    ).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);

    // Timer display
    this.timerText = this.add.text(
      GAME.WIDTH / 2, 54,
      '3:00',
      {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#d4a574',
        fontStyle: 'bold',
        stroke: '#3e2723',
        strokeThickness: 3,
      },
    ).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);

    // Controls hint
    this.add.text(
      GAME.WIDTH / 2, GAME.HEIGHT - 16,
      'P1: WASD + Shift(Boost) J(Salto) K(Drift)   |   P2: Setas + Num0(Boost) Num1(Salto) Num2(Drift)',
      {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#b87333',
      },
    ).setOrigin(0.5, 1).setDepth(100).setScrollFactor(0).setAlpha(0.85);

    // Player labels near boost bars
    this.add.text(20, 8, 'P1 VAPOR', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#e85d3a',
      fontStyle: 'bold',
    }).setDepth(100).setScrollFactor(0);

    this.add.text(GAME.WIDTH - 90, 8, 'P2 VAPOR', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setDepth(100).setScrollFactor(0);
  }

  private updateTimerDisplay(): void {
    const remaining = Math.max(0, 180 - this.matchTimer);
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

    // Flash when low time
    if (remaining <= 30) {
      this.timerText.setColor(remaining % 1 < 0.5 ? '#cc2200' : '#d4a574');
    }

    // Match end
    if (remaining <= 0 && !this.matchPaused) {
      this.endMatch();
    }
  }

  private updateScoreDisplay(): void {
    this.scoreText.setText(`P1  ${this.score[0]} — ${this.score[1]}  P2`);
  }

  // ========================
  // Collision Handling
  // ========================

  private setupCollisionHandling(): void {
    this.matter.world.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      for (const pair of event.pairs) {
        const labelA = pair.bodyA.label || '';
        const labelB = pair.bodyB.label || '';
        const labels = [labelA, labelB];

        // 1. Goal Detection
        if (labels.includes('ball') && labels.some(l => l.startsWith('goal-'))) {
          const goalLabel = labels.find(l => l.startsWith('goal-'))!;
          const goalTeamId = parseInt(goalLabel.split('-')[1], 10);
          this.onGoalScored(goalTeamId);
        }

        // 2. Geyser Boost Recharge Detection
        if (labels.some(l => l.startsWith('geyser-')) && labels.some(l => l.startsWith('vehicle-p'))) {
          const geyserLabel = labels.find(l => l.startsWith('geyser-'))!;
          const vehicleLabel = labels.find(l => l.startsWith('vehicle-p'))!;

          const geyserId = parseInt(geyserLabel.split('-')[1], 10);
          const vehicleId = parseInt(vehicleLabel.split('-p')[1], 10);

          const targetGeyser = this.geysers[geyserId];
          const targetVehicle = vehicleId === 0 ? this.vehicle1 : this.vehicle2;

          if (targetGeyser && targetVehicle) {
            targetGeyser.trigger(targetVehicle);
          }
        }
      }
    });
  }

  private onGoalScored(goalTeamId: number): void {
    if (this.matchPaused) return;

    if (goalTeamId === 0) {
      this.score[1]++;
    } else {
      this.score[0]++;
    }

    this.updateScoreDisplay();
    this.matchPaused = true;

    // Goal celebration
    this.cameras.main.shake(350, 0.015);
    this.cameras.main.flash(250, 255, 215, 0);

    const goalBanner = this.add.rectangle(
      GAME.WIDTH / 2, GAME.HEIGHT / 2,
      GAME.WIDTH, 120,
      0x1a0e07, 0.75,
    ).setDepth(199);

    const goalText = this.add.text(
      GAME.WIDTH / 2, GAME.HEIGHT / 2,
      '★ GOOOL! ★',
      {
        fontFamily: 'monospace',
        fontSize: '60px',
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#8b4513',
        strokeThickness: 7,
      },
    ).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: [goalText, goalBanner],
      scaleX: { from: 0.6, to: 1.1 },
      scaleY: { from: 0.6, to: 1.1 },
      alpha: { from: 1, to: 0 },
      duration: 1800,
      ease: 'Back.easeOut',
      onComplete: () => {
        goalText.destroy();
        goalBanner.destroy();
      },
    });

    this.time.delayedCall(2000, () => {
      this.resetPositions();
      this.matchPaused = false;
    });
  }

  private resetPositions(): void {
    this.ball.reset();
    this.vehicle1.resetTo(
      ARENA.VEHICLE_P1_SPAWN.x,
      ARENA.VEHICLE_P1_SPAWN.y,
      0,
    );
    this.vehicle2.resetTo(
      ARENA.VEHICLE_P2_SPAWN.x,
      ARENA.VEHICLE_P2_SPAWN.y,
      Math.PI,
    );
  }

  // ========================
  // Match End
  // ========================

  private endMatch(): void {
    this.matchPaused = true;

    const winner =
      this.score[0] > this.score[1] ? 'JOGADOR 1 VENCEU!'
        : this.score[1] > this.score[0] ? 'JOGADOR 2 VENCEU!'
          : 'EMPATE NO FAROESTE!';

    const overlay = this.add.rectangle(
      GAME.WIDTH / 2, GAME.HEIGHT / 2,
      GAME.WIDTH, GAME.HEIGHT,
      0x000000,
    ).setAlpha(0).setDepth(300);

    this.tweens.add({
      targets: overlay,
      alpha: 0.7,
      duration: 700,
    });

    const resultText = this.add.text(
      GAME.WIDTH / 2, GAME.HEIGHT / 2 - 50,
      'FIM DE JOGO',
      {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#3e2723',
        strokeThickness: 6,
      },
    ).setOrigin(0.5).setDepth(301).setAlpha(0);

    const winnerText = this.add.text(
      GAME.WIDTH / 2, GAME.HEIGHT / 2 + 15,
      winner,
      {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#f5e6c8',
        fontStyle: 'bold',
        stroke: '#3e2723',
        strokeThickness: 4,
      },
    ).setOrigin(0.5).setDepth(301).setAlpha(0);

    const scoreResult = this.add.text(
      GAME.WIDTH / 2, GAME.HEIGHT / 2 + 65,
      `${this.score[0]} — ${this.score[1]}`,
      {
        fontFamily: 'monospace',
        fontSize: '42px',
        color: '#d4a574',
        fontStyle: 'bold',
        stroke: '#3e2723',
        strokeThickness: 4,
      },
    ).setOrigin(0.5).setDepth(301).setAlpha(0);

    const restartText = this.add.text(
      GAME.WIDTH / 2, GAME.HEIGHT / 2 + 130,
      'Pressione ENTER para jogar novamente',
      {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#b87333',
        backgroundColor: '#1f140e',
        padding: { x: 12, y: 6 },
      },
    ).setOrigin(0.5).setDepth(301).setAlpha(0);

    this.tweens.add({
      targets: [resultText, winnerText, scoreResult, restartText],
      alpha: 1,
      duration: 600,
      delay: 400,
    });

    this.input.keyboard!.once('keydown-ENTER', () => {
      this.scene.restart();
    });
  }

  // ========================
  // Visual Effects & Details
  // ========================

  private setupDustParticles(): void {
    this.dustEmitter = this.add.particles(0, 0, 'dust-particle', {
      speed: { min: 10, max: 35 },
      lifespan: 400,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.35, end: 0 },
      emitting: false,
      quantity: 1,
    });
    this.dustEmitter.setDepth(3);
  }

  private emitVehicleDust(vehicle: Vehicle): void {
    const body = vehicle.body;
    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
    if (speed > 2.5 && this.dustEmitter) {
      this.dustEmitter.emitParticleAt(body.position.x, body.position.y, 1);
    }
  }

  private createArenaDecorations(): void {
    // Saguaro Cacti outside corners
    const cactiPositions = [
      { x: 50, y: 55 },
      { x: GAME.WIDTH - 50, y: 55 },
      { x: 50, y: GAME.HEIGHT - 55 },
      { x: GAME.WIDTH - 50, y: GAME.HEIGHT - 55 },
    ];

    for (const pos of cactiPositions) {
      this.add.image(pos.x, pos.y, 'cactus').setDepth(2).setAlpha(0.85);
    }

    // Railroad track sleepers on top and bottom walls
    for (let x = 60; x < GAME.WIDTH - 60; x += 36) {
      const tie1 = this.add.rectangle(x, 6, 10, 4, COLORS.DARK_WOOD);
      tie1.setAlpha(0.4).setDepth(2);

      const tie2 = this.add.rectangle(x, GAME.HEIGHT - 6, 10, 4, COLORS.DARK_WOOD);
      tie2.setAlpha(0.4).setDepth(2);
    }
  }
}
