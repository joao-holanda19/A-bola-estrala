// ============================================================
// A Bola Estrala — Boot Scene
// Procedural asset generation for 16-bit Steampunk Western visuals
// ============================================================
import Phaser from 'phaser';
import { COLORS, GAME } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const centerX = GAME.WIDTH / 2;
    const centerY = GAME.HEIGHT / 2;

    // Title
    this.add.text(centerX, centerY - 80, 'A BOLA ESTRALA', {
      fontFamily: 'monospace',
      fontSize: '38px',
      color: '#d4a574',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 38, 'Steam & Spurs — 1888', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#b87333',
    }).setOrigin(0.5);

    // Loading bar background
    const barBg = this.add.rectangle(centerX, centerY + 20, 320, 24, 0x1f140e);
    barBg.setStrokeStyle(2, COLORS.RUST);

    // Loading bar fill
    const barFill = this.add.rectangle(
      centerX - 156, centerY + 20, 0, 18, COLORS.COPPER,
    );
    barFill.setOrigin(0, 0.5);

    const loadingText = this.add.text(centerX, centerY + 56, 'Aquecendo caldeiras...', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#c9b896',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      barFill.width = 312 * value;
    });

    this.load.on('complete', () => {
      loadingText.setText('Pronto!');
    });

    // Generate all game textures procedurally
    this.createProceduralTextures();
  }

  create(): void {
    this.time.delayedCall(400, () => {
      this.scene.start('GameScene');
    });
  }

  private createProceduralTextures(): void {
    // 1. Vehicle P1 Texture (Facing Right, 56x32)
    this.drawVehicleTexture('vehicle-p1', COLORS.PLAYER1, COLORS.COPPER);

    // 2. Vehicle P2 Texture (Facing Right, 56x32)
    this.drawVehicleTexture('vehicle-p2', COLORS.PLAYER2, COLORS.GOLD);

    // 3. TNT Barrel Ball (36x36 circle)
    this.drawBallTexture('ball-tnt');

    // 4. Steam Geyser Vent (52x52)
    this.drawGeyserTexture('steam-geyser');

    // 5. Particles
    this.drawParticles();

    // 6. Cactus decoration (32x48)
    this.drawCactusTexture('cactus');
  }

  private drawVehicleTexture(key: string, mainColor: number, trimColor: number): void {
    const w = 56;
    const h = 32;
    const canvas = this.textures.createCanvas(key, w, h);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Main armored carriage body
    ctx.fillStyle = '#2b1b11'; // Dark chassis base
    ctx.fillRect(2, 2, w - 4, h - 4);

    ctx.fillStyle = `#${mainColor.toString(16).padStart(6, '0')}`;
    ctx.fillRect(6, 4, w - 12, h - 8);

    // Metallic boiler in the middle/front
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(18, 7, 24, 18);

    // Brass bands/rivets trim
    ctx.fillStyle = `#${trimColor.toString(16).padStart(6, '0')}`;
    ctx.fillRect(14, 4, 3, h - 8);
    ctx.fillRect(40, 4, 3, h - 8);

    // Steam exhaust chimney (back)
    ctx.fillStyle = '#1c120c';
    ctx.fillRect(6, 11, 8, 10);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(4, 9, 4, 14);

    // Headlights / cowcatcher (front)
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(w - 6, 6, 4, 6);
    ctx.fillRect(w - 6, h - 12, 4, 6);

    // Wheels (4 iron wheels on corners)
    ctx.fillStyle = '#111111';
    ctx.fillRect(8, 0, 14, 3);
    ctx.fillRect(w - 22, 0, 14, 3);
    ctx.fillRect(8, h - 3, 14, 3);
    ctx.fillRect(w - 22, h - 3, 14, 3);

    // Outline
    ctx.strokeStyle = '#180d07';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    canvas.refresh();
  }

  private drawBallTexture(key: string): void {
    const size = 40;
    const canvas = this.textures.createCanvas(key, size, size);
    if (!canvas) return;
    const ctx = canvas.getContext();
    const radius = size / 2 - 2;
    const center = size / 2;

    // Barrel background circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Wood planks background
    ctx.fillStyle = '#c73a1d'; // Vibrant TNT Red
    ctx.fillRect(0, 0, size, size);

    // Wood plank grain lines
    ctx.strokeStyle = '#8a200b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(8, 0); ctx.lineTo(8, size);
    ctx.moveTo(16, 0); ctx.lineTo(16, size);
    ctx.moveTo(24, 0); ctx.lineTo(24, size);
    ctx.moveTo(32, 0); ctx.lineTo(32, size);
    ctx.stroke();

    // Steel bands
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 7, size, 5);
    ctx.fillRect(0, size - 12, size, 5);

    // Golden rivets
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(6, 8, 3, 3);
    ctx.fillRect(18, 8, 3, 3);
    ctx.fillRect(30, 8, 3, 3);
    ctx.fillRect(6, size - 11, 3, 3);
    ctx.fillRect(18, size - 11, 3, 3);
    ctx.fillRect(30, size - 11, 3, 3);

    // Center "TNT" text stencil
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TNT', center, center);

    ctx.restore();

    // Outer border
    ctx.strokeStyle = '#1a0802';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.stroke();

    canvas.refresh();
  }

  private drawGeyserTexture(key: string): void {
    const size = 52;
    const canvas = this.textures.createCanvas(key, size, size);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Outer stone ring
    ctx.fillStyle = '#4a3728';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 24, 0, Math.PI * 2);
    ctx.fill();

    // Inner bronze grate
    ctx.fillStyle = '#b87333';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 18, 0, Math.PI * 2);
    ctx.fill();

    // Grate vent lines
    ctx.strokeStyle = '#22150c';
    ctx.lineWidth = 2;
    for (let i = 12; i <= 40; i += 7) {
      ctx.beginPath();
      ctx.moveTo(i, 16);
      ctx.lineTo(i, 36);
      ctx.stroke();
    }

    // Glowing steam vent center
    ctx.fillStyle = '#88ddff';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 6, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  private drawCactusTexture(key: string): void {
    const w = 32;
    const h = 48;
    const canvas = this.textures.createCanvas(key, w, h);
    if (!canvas) return;
    const ctx = canvas.getContext();

    ctx.fillStyle = '#2d5a27';
    ctx.strokeStyle = '#183814';
    ctx.lineWidth = 2;

    // Main stem
    ctx.fillRect(11, 4, 10, 42);
    ctx.strokeRect(11, 4, 10, 42);

    // Left arm
    ctx.fillRect(4, 16, 7, 6);
    ctx.fillRect(4, 10, 6, 12);
    ctx.strokeRect(4, 10, 6, 12);

    // Right arm
    ctx.fillRect(21, 22, 7, 6);
    ctx.fillRect(22, 16, 6, 12);
    ctx.strokeRect(22, 16, 6, 12);

    canvas.refresh();
  }

  private drawParticles(): void {
    // Spark particle
    const sparkGfx = this.add.graphics();
    sparkGfx.fillStyle(COLORS.GOLD, 1);
    sparkGfx.fillCircle(3, 3, 3);
    sparkGfx.generateTexture('spark', 6, 6);
    sparkGfx.destroy();

    // Dust particle
    const dustGfx = this.add.graphics();
    dustGfx.fillStyle(COLORS.DUST, 0.6);
    dustGfx.fillCircle(4, 4, 4);
    dustGfx.generateTexture('dust-particle', 8, 8);
    dustGfx.destroy();

    // Smoke particle
    const smokeGfx = this.add.graphics();
    smokeGfx.fillStyle(0xcccccc, 0.5);
    smokeGfx.fillCircle(6, 6, 6);
    smokeGfx.generateTexture('smoke-particle', 12, 12);
    smokeGfx.destroy();
  }
}
