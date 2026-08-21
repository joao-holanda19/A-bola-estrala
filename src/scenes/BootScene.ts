// ============================================================
// A Bola Estrala — Boot Scene
// Asset preloading and loading screen
// ============================================================
import Phaser from 'phaser';
import { COLORS, GAME } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // --- Loading bar UI ---
    const centerX = GAME.WIDTH / 2;
    const centerY = GAME.HEIGHT / 2;

    // Title text
    const titleText = this.add.text(centerX, centerY - 80, 'A BOLA ESTRALA', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#d4a574',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const subtitleText = this.add.text(centerX, centerY - 40, 'Steam & Spurs', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#b87333',
    }).setOrigin(0.5);

    // Loading bar background
    const barBg = this.add.rectangle(centerX, centerY + 20, 320, 24, 0x333333);
    barBg.setStrokeStyle(2, COLORS.RUST);

    // Loading bar fill
    const barFill = this.add.rectangle(
      centerX - 156, centerY + 20, 0, 18, COLORS.COPPER,
    );
    barFill.setOrigin(0, 0.5);

    // Loading text
    const loadingText = this.add.text(centerX, centerY + 56, 'Carregando...', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#c9b896',
    }).setOrigin(0.5);

    // Update loading bar on progress
    this.load.on('progress', (value: number) => {
      barFill.width = 312 * value;
    });

    this.load.on('complete', () => {
      loadingText.setText('Pronto!');
      titleText.destroy();
      subtitleText.destroy();
    });

    // --- For Sprint 1, we don't have real assets yet ---
    // Create procedural textures used by entities
    this.createProceduralTextures();
  }

  create(): void {
    // Small delay then transition to game
    this.time.delayedCall(300, () => {
      this.scene.start('GameScene');
    });
  }

  /**
   * Generate placeholder textures programmatically
   * These will be replaced with real sprites in Sprint 3
   */
  private createProceduralTextures(): void {
    // Dust particle
    const dustGfx = this.add.graphics();
    dustGfx.fillStyle(COLORS.DUST, 0.5);
    dustGfx.fillCircle(3, 3, 3);
    dustGfx.generateTexture('dust-particle', 6, 6);
    dustGfx.destroy();

    // Smoke particle
    const smokeGfx = this.add.graphics();
    smokeGfx.fillStyle(COLORS.SMOKE, 0.6);
    smokeGfx.fillCircle(4, 4, 4);
    smokeGfx.generateTexture('smoke-particle', 8, 8);
    smokeGfx.destroy();
  }
}
