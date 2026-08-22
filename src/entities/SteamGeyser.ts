// ============================================================
// A Bola Estrala — Steam Geyser Entity
// Interactive map elements that recharge vehicle steam boilers
// ============================================================
import Phaser from 'phaser';
import { CATEGORIES, PHYSICS } from '../config';
import { Vehicle } from './Vehicle';

export class SteamGeyser {
  public sensor: MatterJS.BodyType;
  public sprite: Phaser.GameObjects.Sprite;
  public isActive: boolean = true;

  private scene: Phaser.Scene;
  private cooldownTimer: number = 0;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private cooldownDuration: number = 5000; // 5s recharge

  constructor(scene: Phaser.Scene, x: number, y: number, id: number) {
    this.scene = scene;

    // Sprite visual
    this.sprite = scene.add.sprite(x, y, 'steam-geyser');
    this.sprite.setDepth(4);

    // Matter sensor
    const sensorBody = scene.matter.add.circle(x, y, 26, {
      isSensor: true,
      isStatic: true,
      collisionFilter: {
        category: CATEGORIES.GEYSER,
        mask: CATEGORIES.VEHICLE,
      },
      label: `geyser-${id}`,
    });

    this.sensor = sensorBody as unknown as MatterJS.BodyType;

    // Steam particle emitter
    this.emitter = scene.add.particles(x, y, 'smoke-particle', {
      speed: { min: 15, max: 45 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 600,
      frequency: 120,
    });
    this.emitter.setDepth(5);
  }

  update(delta: number): void {
    if (!this.isActive) {
      this.cooldownTimer -= delta;
      if (this.cooldownTimer <= 0) {
        this.activate();
      }
    }
  }

  trigger(vehicle: Vehicle): void {
    if (!this.isActive) return;

    // Recharge vehicle boiler
    vehicle.rechargeBoost(PHYSICS.BOOST_GEYSER_REGEN);

    // Deactivate and show cooldown
    this.isActive = false;
    this.cooldownTimer = this.cooldownDuration;
    this.sprite.setAlpha(0.3);
    this.emitter.stop();

    // Burst of steam
    this.emitter.explode(15, this.sprite.x, this.sprite.y);

    // Float text "+VAPOR"
    const floatText = this.scene.add.text(
      this.sprite.x, this.sprite.y - 10,
      '+VAPOR',
      {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#44cc44',
        fontStyle: 'bold',
        stroke: '#1a0e07',
        strokeThickness: 3,
      },
    ).setOrigin(0.5).setDepth(200);

    this.scene.tweens.add({
      targets: floatText,
      y: this.sprite.y - 35,
      alpha: 0,
      duration: 900,
      ease: 'Quad.easeOut',
      onComplete: () => floatText.destroy(),
    });
  }

  private activate(): void {
    this.isActive = true;
    this.sprite.setAlpha(1);
    this.emitter.start();
  }
}
