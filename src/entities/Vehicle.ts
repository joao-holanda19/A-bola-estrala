// ============================================================
// A Bola Estrala — Vehicle Entity
// Steam-powered carriage with boost, jump, drift, and exhaust particles
// ============================================================
import Phaser from 'phaser';
import { PHYSICS, CATEGORIES, COLORS } from '../config';
import { PlayerInput } from '../systems/InputManager';
import { clamp, getSpeed, angleToVector, dot } from '../utils/MathHelpers';

export class Vehicle {
  public body: MatterJS.BodyType;
  public sprite: Phaser.Physics.Matter.Sprite;
  public boostPressure: number = PHYSICS.BOOST_MAX;
  public playerId: number;

  private scene: Phaser.Scene;
  private isJumping: boolean = false;
  private jumpCooldownTimer: number = 0;
  private isDrifting: boolean = false;
  private boostBarBg: Phaser.GameObjects.Rectangle;
  private boostBarFill: Phaser.GameObjects.Rectangle;
  private boostEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  // Vehicle dimensions
  public static readonly WIDTH = 56;
  public static readonly HEIGHT = 32;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    playerId: number,
    angle: number = 0,
  ) {
    this.scene = scene;
    this.playerId = playerId;

    const textureKey = playerId === 0 ? 'vehicle-p1' : 'vehicle-p2';

    // Create Matter.js physics sprite with custom texture
    this.sprite = scene.matter.add.sprite(x, y, textureKey, undefined, {
      shape: { type: 'rectangle', width: Vehicle.WIDTH, height: Vehicle.HEIGHT },
      mass: PHYSICS.VEHICLE_MASS,
      friction: PHYSICS.VEHICLE_FRICTION,
      frictionAir: PHYSICS.VEHICLE_FRICTION_AIR,
      frictionStatic: PHYSICS.VEHICLE_FRICTION_STATIC,
      restitution: PHYSICS.VEHICLE_RESTITUTION,
      angle: angle,
      collisionFilter: {
        category: CATEGORIES.VEHICLE,
        mask: CATEGORIES.WALL | CATEGORIES.VEHICLE | CATEGORIES.BALL | CATEGORIES.GEYSER,
      },
      label: `vehicle-p${playerId}`,
    });

    this.sprite.setDepth(10);
    this.body = this.sprite.body as MatterJS.BodyType;

    // Steam boost exhaust particle emitter
    this.boostEmitter = scene.add.particles(0, 0, 'smoke-particle', {
      speed: { min: 40, max: 120 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 350,
      emitting: false,
      quantity: 3,
    });
    this.boostEmitter.setDepth(9);

    // Boost pressure bar UI
    const barWidth = 60;
    const barHeight = 8;
    const barY = 16;
    const barX = playerId === 0 ? 90 : scene.scale.width - 90;

    this.boostBarBg = scene.add.rectangle(barX, barY, barWidth, barHeight, 0x1f140e);
    this.boostBarBg.setStrokeStyle(1, COLORS.DARK_WOOD);
    this.boostBarBg.setDepth(100);
    this.boostBarBg.setScrollFactor(0);

    this.boostBarFill = scene.add.rectangle(
      barX - barWidth / 2, barY, barWidth, barHeight - 2, COLORS.BOOST_FULL,
    );
    this.boostBarFill.setOrigin(0, 0.5);
    this.boostBarFill.setDepth(101);
    this.boostBarFill.setScrollFactor(0);
  }

  update(input: PlayerInput, _delta: number): void {
    const body = this.body;
    const angle = body.angle;
    const forward = angleToVector(angle);

    // --- Drift mechanic ---
    if (input.drift) {
      this.isDrifting = true;
      (body as any).frictionAir = PHYSICS.DRIFT_FRICTION_AIR;
    } else {
      if (this.isDrifting) {
        this.isDrifting = false;
        (body as any).frictionAir = PHYSICS.VEHICLE_FRICTION_AIR;
      }
    }

    // --- Acceleration ---
    if (input.accelerate) {
      const forceMag = PHYSICS.VEHICLE_ACCELERATION;
      this.scene.matter.body.applyForce(body, body.position, {
        x: forward.x * forceMag,
        y: forward.y * forceMag,
      });
    }

    // --- Reverse ---
    if (input.reverse) {
      const forceMag = PHYSICS.VEHICLE_ACCELERATION * PHYSICS.VEHICLE_REVERSE_FACTOR;
      this.scene.matter.body.applyForce(body, body.position, {
        x: -forward.x * forceMag,
        y: -forward.y * forceMag,
      });
    }

    // --- Steering ---
    const speed = getSpeed(body.velocity.x, body.velocity.y);
    if (speed > 0.3) {
      const moveDot = dot(
        body.velocity.x, body.velocity.y,
        forward.x, forward.y,
      );
      const steerDirection = moveDot >= 0 ? 1 : -1;

      let turnRate = PHYSICS.VEHICLE_TURN_SPEED;
      turnRate *= clamp(speed / 3, 0.3, 1.0);

      if (input.turnLeft) {
        this.scene.matter.body.setAngularVelocity(body, -turnRate * steerDirection);
      } else if (input.turnRight) {
        this.scene.matter.body.setAngularVelocity(body, turnRate * steerDirection);
      } else {
        this.scene.matter.body.setAngularVelocity(
          body,
          body.angularVelocity * (1 - PHYSICS.VEHICLE_ANGULAR_FRICTION),
        );
      }
    } else {
      // Rotate in place slowly
      const turnRate = PHYSICS.VEHICLE_TURN_SPEED * 0.5;
      if (input.turnLeft) {
        this.scene.matter.body.setAngularVelocity(body, -turnRate);
      } else if (input.turnRight) {
        this.scene.matter.body.setAngularVelocity(body, turnRate);
      }
    }

    // --- Boost of Steam ---
    if (input.boost && this.boostPressure > 0) {
      const boostForce = PHYSICS.BOOST_FORCE;
      this.scene.matter.body.applyForce(body, body.position, {
        x: forward.x * boostForce,
        y: forward.y * boostForce,
      });
      this.boostPressure = Math.max(0, this.boostPressure - PHYSICS.BOOST_DRAIN_RATE);

      // Emit exhaust steam behind the vehicle
      const backOffset = 24;
      const emitX = body.position.x - forward.x * backOffset;
      const emitY = body.position.y - forward.y * backOffset;
      this.boostEmitter.emitParticleAt(emitX, emitY, 2);
    } else {
      this.boostPressure = Math.min(
        PHYSICS.BOOST_MAX,
        this.boostPressure + PHYSICS.BOOST_REGEN_RATE,
      );
    }

    // --- Piston Jump ---
    if (input.jump && !this.isJumping && this.jumpCooldownTimer <= 0) {
      this.performJump();
    }
    if (this.jumpCooldownTimer > 0) {
      this.jumpCooldownTimer -= _delta;
    }

    // --- Speed cap ---
    if (speed > PHYSICS.VEHICLE_MAX_SPEED) {
      const factor = PHYSICS.VEHICLE_MAX_SPEED / speed;
      this.scene.matter.body.setVelocity(body, {
        x: body.velocity.x * factor,
        y: body.velocity.y * factor,
      });
    }

    // --- Update UI bar ---
    this.updateBoostBar();
  }

  private performJump(): void {
    this.isJumping = true;
    this.jumpCooldownTimer = PHYSICS.JUMP_COOLDOWN;

    // Visual jump tween
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: PHYSICS.JUMP_SCALE,
      scaleY: PHYSICS.JUMP_SCALE,
      duration: PHYSICS.JUMP_DURATION / 2,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.isJumping = false;
        this.sprite.setScale(1, 1);
      },
    });

    const origFriction = PHYSICS.VEHICLE_FRICTION_AIR;
    (this.body as any).frictionAir = 0.005;
    this.scene.time.delayedCall(PHYSICS.JUMP_DURATION, () => {
      if (!this.isDrifting) {
        (this.body as any).frictionAir = origFriction;
      }
    });
  }

  private updateBoostBar(): void {
    const ratio = this.boostPressure / PHYSICS.BOOST_MAX;
    const fullWidth = 60;
    this.boostBarFill.width = fullWidth * ratio;

    if (ratio > 0.5) {
      this.boostBarFill.fillColor = COLORS.BOOST_FULL;
    } else if (ratio > 0.2) {
      this.boostBarFill.fillColor = COLORS.COPPER;
    } else {
      this.boostBarFill.fillColor = COLORS.BOOST_EMPTY;
    }
  }

  rechargeBoost(amount: number): void {
    this.boostPressure = Math.min(PHYSICS.BOOST_MAX, this.boostPressure + amount);
  }

  resetTo(x: number, y: number, angle: number): void {
    this.scene.matter.body.setPosition(this.body, { x, y });
    this.scene.matter.body.setVelocity(this.body, { x: 0, y: 0 });
    this.scene.matter.body.setAngularVelocity(this.body, 0);
    this.scene.matter.body.setAngle(this.body, angle);
    this.boostPressure = PHYSICS.BOOST_MAX;
  }
}
