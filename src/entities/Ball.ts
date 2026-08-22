// ============================================================
// A Bola Estrala — Ball Entity
// Heavy TNT barrel with physics, rotation, and high-speed sparks
// ============================================================
import Phaser from 'phaser';
import { PHYSICS, CATEGORIES, ARENA } from '../config';
import { getSpeed } from '../utils/MathHelpers';

export class Ball {
  public body: MatterJS.BodyType;
  public sprite: Phaser.Physics.Matter.Sprite;

  private scene: Phaser.Scene;
  private sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Matter.js physics sprite with TNT barrel texture
    this.sprite = scene.matter.add.sprite(x, y, 'ball-tnt', undefined, {
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
    });

    this.sprite.setDepth(10);
    this.body = this.sprite.body as MatterJS.BodyType;

    // High speed spark particle emitter
    this.sparkEmitter = scene.add.particles(0, 0, 'spark', {
      speed: { min: 60, max: 180 },
      lifespan: 250,
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      emitting: false,
      quantity: 4,
    });
    this.sparkEmitter.setDepth(15);
  }

  update(): void {
    const speed = getSpeed(this.body.velocity.x, this.body.velocity.y);

    // Emit sparks when hit hard
    if (speed > PHYSICS.BALL_SPARK_SPEED_THRESHOLD) {
      this.sparkEmitter.emitParticleAt(this.body.position.x, this.body.position.y, 3);
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
