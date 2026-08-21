// ============================================================
// A Bola Estrala — Ball Entity
// Heavy TNT barrel / gold nugget with physics
// ============================================================
import Phaser from 'phaser';
import { PHYSICS, CATEGORIES, COLORS, ARENA } from '../config';
import { getSpeed } from '../utils/MathHelpers';

export class Ball {
  public body: MatterJS.BodyType;
  public sprite: Phaser.GameObjects.Arc;

  private scene: Phaser.Scene;
  private sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Visual: circle placeholder (will be TNT barrel sprite later)
    this.sprite = scene.add.circle(x, y, PHYSICS.BALL_RADIUS, COLORS.TNT_RED);
    this.sprite.setStrokeStyle(3, COLORS.DARK_WOOD);
    this.sprite.setDepth(10);

    // Inner detail — gold ring to indicate value
    const innerRing = scene.add.circle(x, y, PHYSICS.BALL_RADIUS - 6, COLORS.GOLD);
    innerRing.setAlpha(0.4);
    innerRing.setDepth(9);

    // Matter.js circle body
    this.body = scene.matter.add.gameObject(this.sprite, {
      shape: { type: 'circle', radius: PHYSICS.BALL_RADIUS },
      mass: PHYSICS.BALL_MASS,
      friction: PHYSICS.BALL_FRICTION,
      frictionAir: PHYSICS.BALL_FRICTION_AIR,
      restitution: PHYSICS.BALL_RESTITUTION,
      collisionFilter: {
        category: CATEGORIES.BALL,
        mask: CATEGORIES.WALL | CATEGORIES.VEHICLE | CATEGORIES.GOAL_SENSOR,
      },
      label: 'ball',
    }).body as MatterJS.BodyType;

    // Setup spark particles for high-speed impacts
    this.setupSparkParticles();
  }

  private setupSparkParticles(): void {
    // Create a tiny texture for particles
    const gfx = this.scene.add.graphics();
    gfx.fillStyle(COLORS.GOLD, 1);
    gfx.fillCircle(2, 2, 2);
    gfx.generateTexture('spark', 4, 4);
    gfx.destroy();

    this.sparkEmitter = this.scene.add.particles(0, 0, 'spark', {
      speed: { min: 50, max: 150 },
      lifespan: 300,
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      emitting: false,
      quantity: 5,
    });
    this.sparkEmitter.setDepth(15);
  }

  update(): void {
    const speed = getSpeed(this.body.velocity.x, this.body.velocity.y);

    // Emit sparks when moving fast
    if (speed > PHYSICS.BALL_SPARK_SPEED_THRESHOLD && this.sparkEmitter) {
      this.sparkEmitter.emitParticleAt(this.body.position.x, this.body.position.y, 3);
    }

    // Rotate the sprite based on velocity for visual rolling effect
    if (speed > 0.5) {
      this.sprite.rotation += speed * 0.02;
    }
  }

  /**
   * Reset ball to center after a goal
   */
  reset(): void {
    this.scene.matter.body.setPosition(this.body, {
      x: ARENA.BALL_SPAWN.x,
      y: ARENA.BALL_SPAWN.y,
    });
    this.scene.matter.body.setVelocity(this.body, { x: 0, y: 0 });
    this.scene.matter.body.setAngularVelocity(this.body, 0);
  }
}
