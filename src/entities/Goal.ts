// ============================================================
// A Bola Estrala — Goal Entity
// Sensor zone for detecting when the ball crosses the goal line
// ============================================================
import Phaser from 'phaser';
import { ARENA, CATEGORIES, COLORS, GAME } from '../config';

export class Goal {
  public sensor: MatterJS.BodyType;
  public teamId: number; // 0 = left goal (P2 scores here), 1 = right goal (P1 scores here)

  constructor(scene: Phaser.Scene, teamId: number) {
    this.teamId = teamId;

    // Position: left side or right side
    const x = teamId === 0
      ? ARENA.GOAL_WIDTH / 2
      : GAME.WIDTH - ARENA.GOAL_WIDTH / 2;
    const y = ARENA.GOAL_Y;

    // Visual goal post
    const goalRect = scene.add.rectangle(
      x, y,
      ARENA.GOAL_WIDTH, ARENA.GOAL_HEIGHT,
      COLORS.GOAL_NET,
    );
    goalRect.setAlpha(0.4);
    goalRect.setStrokeStyle(3, COLORS.RUST);
    goalRect.setDepth(5);

    // Top and bottom posts
    const postThickness = 6;
    const topPost = scene.add.rectangle(
      x, y - ARENA.GOAL_HEIGHT / 2,
      ARENA.GOAL_WIDTH + 8, postThickness,
      COLORS.RUST,
    );
    topPost.setDepth(12);

    const bottomPost = scene.add.rectangle(
      x, y + ARENA.GOAL_HEIGHT / 2,
      ARENA.GOAL_WIDTH + 8, postThickness,
      COLORS.RUST,
    );
    bottomPost.setDepth(12);

    // Matter.js sensor (no physical collision, only detection)
    const sensorBody = scene.matter.add.rectangle(
      x, y,
      ARENA.GOAL_WIDTH, ARENA.GOAL_HEIGHT,
      {
        isSensor: true,
        isStatic: true,
        collisionFilter: {
          category: CATEGORIES.GOAL_SENSOR,
          mask: CATEGORIES.BALL,
        },
        label: `goal-${teamId}`,
      },
    );

    this.sensor = sensorBody as unknown as MatterJS.BodyType;
  }
}
