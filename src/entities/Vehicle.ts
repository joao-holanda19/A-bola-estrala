// ============================================================
// A Bola Estrala — Vehicle Entity
// Steam-powered carriage with boost, jump, and drift mechanics
// ============================================================
import Phaser from 'phaser';
import { PHYSICS, CATEGORIES, COLORS } from '../config';
import { PlayerInput } from '../systems/InputManager';
import { clamp, getSpeed, angleToVector, dot } from '../utils/MathHelpers';

export class Vehicle {
  public body: MatterJS.BodyType;
  public sprite: Phaser.GameObjects.Rectangle;
  public boostPressure: number = PHYSICS.BOOST_MAX;
  public playerId: number;

  private scene: Phaser.Scene;
  private isJumping: boolean = false;
  private jumpCooldownTimer: number = 0;
  private isDrifting: boolean = false;
  private boostBarBg: Phaser.GameObjects.Rectangle;
  private boostBarFill: Phaser.GameObjects.Rectangle;

  // Vehicle dimensions
  private static readonly WIDTH = 52;
  private static readonly HEIGHT = 30;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    playerId: number,
    angle: number = 0,
  ) {
    this.scene = scene;
    this.playerId = playerId;

    const color = playerId === 0 ? COLORS.PLAYER1 : COLORS.PLAYER2;

    // Visual representation — rectangle placeholder
    this.sprite = scene.add.rectangle(x, y, Vehicle.WIDTH, Vehicle.HEIGHT, color);
    this.sprite.setStrokeStyle(2, COLORS.DARK_WOOD);
    this.sprite.setDepth(10);

    // Direction indicator (front of vehicle)
    const indicator = scene.add.rectangle(
      Vehicle.WIDTH / 2 - 4, 0, 10, 8,
      COLORS.COPPER,
    );
    indicator.setStrokeStyle(1, COLORS.DARK_WOOD);

    // Matter.js physics body
    this.body = scene.matter.add.gameObject(this.sprite, {
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
    }).body as MatterJS.BodyType;

    // Boost pressure bar
    const barWidth = 50;
    const barHeight = 6;
    const barY = playerId === 0 ? 16 : 16;
    const barX = playerId === 0 ? 80 : scene.scale.width - 80;

    this.boostBarBg = scene.add.rectangle(barX, barY, barWidth, barHeight, 0x333333);
    this.boostBarBg.setStrokeStyle(1, COLORS.DARK_WOOD);
    this.boostBarBg.setDepth(100);
    this.boostBarBg.setScrollFactor(0);

    this.boostBarFill = scene.add.rectangle(
      barX, barY, barWidth, barHeight, COLORS.BOOST_FULL,
    );
    this.boostBarFill.setDepth(101);
    this.boostBarFill.setScrollFactor(0);
  }

  update(input: PlayerInput, _delta: number): void {
    const body = this.body;
    const angle = body.angle;
    const forward = angleToVector(angle);

    // --- Drift mechanic ---
    if (input.drift) {
      if (!this.isDrifting) {
        this.isDrifting = true;
      }
      // Reduce air friction for slidey feel
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
    // Only steer when the vehicle is moving
    const speed = getSpeed(body.velocity.x, body.velocity.y);
    if (speed > 0.3) {
      // Determine if moving forward or backward relative to facing
      const moveDot = dot(
        body.velocity.x, body.velocity.y,
        forward.x, forward.y,
      );
      const steerDirection = moveDot >= 0 ? 1 : -1;

      let turnRate = PHYSICS.VEHICLE_TURN_SPEED;
      // Scale turn rate with speed (slower at low speed)
      turnRate *= clamp(speed / 3, 0.3, 1.0);

      if (input.turnLeft) {
        this.scene.matter.body.setAngularVelocity(body, -turnRate * steerDirection);
      } else if (input.turnRight) {
        this.scene.matter.body.setAngularVelocity(body, turnRate * steerDirection);
      } else {
        // Dampen angular velocity when not steering
        this.scene.matter.body.setAngularVelocity(
          body,
          body.angularVelocity * (1 - PHYSICS.VEHICLE_ANGULAR_FRICTION),
        );
      }
    } else {
      // Allow rotation in place at reduced speed
      const turnRate = PHYSICS.VEHICLE_TURN_SPEED * 0.5;
      if (input.turnLeft) {
        this.scene.matter.body.setAngularVelocity(body, -turnRate);
      } else if (input.turnRight) {
        this.scene.matter.body.setAngularVelocity(body, turnRate);
      }
    }

    // --- Boost ---
    if (input.boost && this.boostPressure > 0) {
      const boostForce = PHYSICS.BOOST_FORCE;
      this.scene.matter.body.applyForce(body, body.position, {
        x: forward.x * boostForce,
        y: forward.y * boostForce,
      });
      this.boostPressure = Math.max(0, this.boostPressure - PHYSICS.BOOST_DRAIN_RATE);
    } else {
      // Passive regen
      this.boostPressure = Math.min(
        PHYSICS.BOOST_MAX,
        this.boostPressure + PHYSICS.BOOST_REGEN_RATE,
      );
    }

    // --- Jump ---
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

    // --- Update boost bar ---
    this.updateBoostBar();
  }

  private performJump(): void {
    this.isJumping = true;
    this.jumpCooldownTimer = PHYSICS.JUMP_COOLDOWN;

    // Visual jump: scale up then back down
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

    // Brief air friction reduction (floaty jump feel)
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
    const fullWidth = 50;
    this.boostBarFill.width = fullWidth * ratio;

    // Color: green when full, red when low
    if (ratio > 0.5) {
      this.boostBarFill.fillColor = COLORS.BOOST_FULL;
    } else if (ratio > 0.2) {
      this.boostBarFill.fillColor = COLORS.COPPER;
    } else {
      this.boostBarFill.fillColor = COLORS.BOOST_EMPTY;
    }
  }

  /**
   * Recharge boost (e.g., from a steam geyser)
   */
  rechargeBoost(amount: number): void {
    this.boostPressure = Math.min(PHYSICS.BOOST_MAX, this.boostPressure + amount);
  }

  /**
   * Reset vehicle to a position (after goal)
   */
  resetTo(x: number, y: number, angle: number): void {
    this.scene.matter.body.setPosition(this.body, { x, y });
    this.scene.matter.body.setVelocity(this.body, { x: 0, y: 0 });
    this.scene.matter.body.setAngularVelocity(this.body, 0);
    this.scene.matter.body.setAngle(this.body, angle);
    this.boostPressure = PHYSICS.BOOST_MAX;
  }
}
