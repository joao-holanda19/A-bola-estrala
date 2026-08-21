// ============================================================
// A Bola Estrala — Game Scene
// Main gameplay: arena, vehicles, ball, goals, HUD
// ============================================================
import Phaser from 'phaser';
import { GAME, PHYSICS, ARENA, COLORS, CATEGORIES } from '../config';
import { Vehicle } from '../entities/Vehicle';
import { Ball } from '../entities/Ball';
import { Goal } from '../entities/Goal';
import { InputManager } from '../systems/InputManager';

export class GameScene extends Phaser.Scene {
  private vehicle1!: Vehicle;
  private vehicle2!: Vehicle;
  private ball!: Ball;
  public goalLeft!: Goal;
  public goalRight!: Goal;
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

    // --- Build the arena ---
    this.createArena();

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

    // --- Goal detection ---
    this.setupGoalDetection();

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

    // Floor (visual only — sandy desert color)
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.SAND).setDepth(0);

    // Midfield line
    this.add.rectangle(w / 2, h / 2, 3, h - t * 2, COLORS.DUST).setAlpha(0.4).setDepth(1);

    // Center circle
    const centerCircle = this.add.circle(w / 2, h / 2, 70);
    centerCircle.setStrokeStyle(3, COLORS.DUST);
    centerCircle.setAlpha(0.3);
    centerCircle.setDepth(1);

    // --- Walls with gaps for goals ---

    // Top wall (full width)
    this.createWall(w / 2, t / 2, w, t);

    // Bottom wall (full width)
    this.createWall(w / 2, h - t / 2, w, t);

    // Left side walls (with goal gap in the middle)
    const sideHeight = (h - goalH) / 2 - t;
    // Top-left segment
    this.createWall(t / 2, t + sideHeight / 2, t, sideHeight);
    // Bottom-left segment
    this.createWall(t / 2, h - t - sideHeight / 2, t, sideHeight);

    // Right side walls (with goal gap in the middle)
    // Top-right segment
    this.createWall(w - t / 2, t + sideHeight / 2, t, sideHeight);
    // Bottom-right segment
    this.createWall(w - t / 2, h - t - sideHeight / 2, t, sideHeight);

    // Back walls behind goals (to stop the ball from going off-screen)
    // Left goal back wall — not needed because goal sensor is there
    // We add thin bouncers behind goals to push the ball back
    this.createWall(-5, goalY, 10, goalH); // left back
    this.createWall(w + 5, goalY, 10, goalH); // right back
  }

  private createWall(x: number, y: number, width: number, height: number): void {
    // Visual
    const wallRect = this.add.rectangle(x, y, width, height, COLORS.DARK_WOOD);
    wallRect.setStrokeStyle(1, COLORS.BURNT_WOOD);
    wallRect.setDepth(8);

    // Physics — static body
    this.matter.add.rectangle(x, y, width, height, {
      isStatic: true,
      restitution: 0.5,
      friction: 0.3,
      collisionFilter: {
        category: CATEGORIES.WALL,
        mask: CATEGORIES.VEHICLE | CATEGORIES.BALL,
      },
      label: 'wall',
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
        fontSize: '28px',
        color: '#f5e6c8',
        fontStyle: 'bold',
        stroke: '#3e2723',
        strokeThickness: 4,
      },
    ).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);

    // Timer display
    this.timerText = this.add.text(
      GAME.WIDTH / 2, 50,
      '3:00',
      {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#d4a574',
        stroke: '#3e2723',
        strokeThickness: 3,
      },
    ).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);

    // Controls hint
    this.add.text(
      GAME.WIDTH / 2, GAME.HEIGHT - 20,
      'P1: WASD + Shift(boost) J(salto) K(drift)   |   P2: Setas + Num0(boost) Num1(salto) Num2(drift)',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#b87333',
      },
    ).setOrigin(0.5, 1).setDepth(100).setScrollFactor(0).setAlpha(0.7);

    // Player labels near boost bars
    this.add.text(16, 8, 'P1', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#e85d3a',
      fontStyle: 'bold',
    }).setDepth(100).setScrollFactor(0);

    this.add.text(GAME.WIDTH - 30, 8, 'P2', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#3a7ec8',
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
  // Goal Detection
  // ========================

  private setupGoalDetection(): void {
    this.matter.world.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      for (const pair of event.pairs) {
        const labels = [pair.bodyA.label, pair.bodyB.label];

        // Check if ball collided with a goal sensor
        if (labels.includes('ball') && labels.some(l => l.startsWith('goal-'))) {
          const goalLabel = labels.find(l => l.startsWith('goal-'))!;
          const goalTeamId = parseInt(goalLabel.split('-')[1], 10);

          this.onGoalScored(goalTeamId);
        }
      }
    });
  }

  private onGoalScored(goalTeamId: number): void {
    if (this.matchPaused) return;

    // goalTeamId 0 = left goal → Player 2 scores (P2 attacked left)
    // goalTeamId 1 = right goal → Player 1 scores (P1 attacked right)
    // Wait — actually: P1 starts on the left, P2 on the right.
    // P1 wants to score in the RIGHT goal (goal-1), P2 wants to score in the LEFT goal (goal-0).
    // So: ball entering goal-0 → P2 scores; ball entering goal-1 → P1 scores.
    // But that means P1's "own" goal is goal-0 (left) and P2's own goal is goal-1 (right).
    // Actually the convention: each team DEFENDS a goal.
    // P1 defends LEFT (goal-0), P2 defends RIGHT (goal-1).
    // If ball enters goal-0 (left), P2 scored! If ball enters goal-1 (right), P1 scored!

    if (goalTeamId === 0) {
      // Ball entered left goal → P2 scored
      this.score[1]++;
    } else {
      // Ball entered right goal → P1 scored
      this.score[0]++;
    }

    this.updateScoreDisplay();
    this.matchPaused = true;

    // Goal celebration: camera shake + flash
    this.cameras.main.shake(300, 0.01);
    this.cameras.main.flash(200, 255, 215, 0);

    // GOOOL text
    const goalText = this.add.text(
      GAME.WIDTH / 2, GAME.HEIGHT / 2,
      'GOOOL!',
      {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#3e2723',
        strokeThickness: 6,
      },
    ).setOrigin(0.5).setDepth(200);

    // Animate goal text
    this.tweens.add({
      targets: goalText,
      scale: { from: 0.5, to: 1.5 },
      alpha: { from: 1, to: 0 },
      duration: 1500,
      ease: 'Back.easeOut',
      onComplete: () => goalText.destroy(),
    });

    // Reset positions after pause
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
      this.score[0] > this.score[1] ? 'JOGADOR 1 VENCE!'
        : this.score[1] > this.score[0] ? 'JOGADOR 2 VENCE!'
          : 'EMPATE!';

    // Overlay
    const overlay = this.add.rectangle(
      GAME.WIDTH / 2, GAME.HEIGHT / 2,
      GAME.WIDTH, GAME.HEIGHT,
      0x000000,
    ).setAlpha(0).setDepth(300);

    this.tweens.add({
      targets: overlay,
      alpha: 0.6,
      duration: 800,
    });

    // Result text
    const resultText = this.add.text(
      GAME.WIDTH / 2, GAME.HEIGHT / 2 - 40,
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
      GAME.WIDTH / 2, GAME.HEIGHT / 2 + 20,
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
        fontSize: '40px',
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
      },
    ).setOrigin(0.5).setDepth(301).setAlpha(0);

    // Animate in
    this.tweens.add({
      targets: [resultText, winnerText, scoreResult, restartText],
      alpha: 1,
      duration: 600,
      delay: 500,
    });

    // Restart on ENTER
    this.input.keyboard!.once('keydown-ENTER', () => {
      this.scene.restart();
    });
  }

  // ========================
  // Visual Effects
  // ========================

  private setupDustParticles(): void {
    // Create dust particle texture if not already created
    if (!this.textures.exists('dust-particle')) {
      const gfx = this.add.graphics();
      gfx.fillStyle(COLORS.DUST, 0.5);
      gfx.fillCircle(3, 3, 3);
      gfx.generateTexture('dust-particle', 6, 6);
      gfx.destroy();
    }

    this.dustEmitter = this.add.particles(0, 0, 'dust-particle', {
      speed: { min: 10, max: 40 },
      lifespan: 500,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.4, end: 0 },
      emitting: false,
      quantity: 2,
    });
    this.dustEmitter.setDepth(3);
  }

  private emitVehicleDust(vehicle: Vehicle): void {
    const body = vehicle.body;
    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
    if (speed > 2 && this.dustEmitter) {
      this.dustEmitter.emitParticleAt(body.position.x, body.position.y, 1);
    }
  }

  // ========================
  // Arena Decorations
  // ========================

  private createArenaDecorations(): void {
    // Simple cactus-like decorations outside the play area

    // Corner decorations — small circles to represent cacti/rocks
    const corners = [
      { x: 50, y: 50 },
      { x: GAME.WIDTH - 50, y: 50 },
      { x: 50, y: GAME.HEIGHT - 50 },
      { x: GAME.WIDTH - 50, y: GAME.HEIGHT - 50 },
    ];

    for (const pos of corners) {
      // Small cactus-like shape
      const cactus = this.add.circle(pos.x, pos.y, 8, 0x2d5a27);
      cactus.setStrokeStyle(1, 0x1a3d18);
      cactus.setAlpha(0.6);
      cactus.setDepth(2);
    }

    // Railroad track lines near top and bottom
    for (let x = 60; x < GAME.WIDTH - 60; x += 40) {
      const tie = this.add.rectangle(x, 5, 12, 4, COLORS.DARK_WOOD);
      tie.setAlpha(0.3).setDepth(1);

      const tie2 = this.add.rectangle(x, GAME.HEIGHT - 5, 12, 4, COLORS.DARK_WOOD);
      tie2.setAlpha(0.3).setDepth(1);
    }
  }
}
