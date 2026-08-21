// ============================================================
// A Bola Estrala — Game Constants & Physics Configuration
// ============================================================

export const GAME = {
  WIDTH: 1280,
  HEIGHT: 720,
  BACKGROUND_COLOR: 0x2d1b0e,
} as const;

export const PHYSICS = {
  // Vehicle
  VEHICLE_MASS: 5,
  VEHICLE_MAX_SPEED: 8,
  VEHICLE_ACCELERATION: 0.005,
  VEHICLE_REVERSE_FACTOR: 0.6,
  VEHICLE_TURN_SPEED: 0.05,
  VEHICLE_FRICTION: 0.05,
  VEHICLE_FRICTION_AIR: 0.08,
  VEHICLE_FRICTION_STATIC: 0.1,
  VEHICLE_RESTITUTION: 0.3,
  VEHICLE_ANGULAR_FRICTION: 0.15,

  // Boost
  BOOST_FORCE: 0.012,
  BOOST_MAX: 100,
  BOOST_DRAIN_RATE: 1.5,
  BOOST_REGEN_RATE: 0.2,
  BOOST_GEYSER_REGEN: 25,

  // Drift
  DRIFT_FRICTION_AIR: 0.01,
  DRIFT_LATERAL_FACTOR: 0.7,

  // Jump (visual only in top-down)
  JUMP_SCALE: 1.3,
  JUMP_DURATION: 400,
  JUMP_COOLDOWN: 800,

  // Ball
  BALL_MASS: 3,
  BALL_RADIUS: 18,
  BALL_FRICTION: 0.01,
  BALL_FRICTION_AIR: 0.02,
  BALL_RESTITUTION: 0.7,
  BALL_SPARK_SPEED_THRESHOLD: 4,

  // Arena walls
  WALL_THICKNESS: 20,
} as const;

export const MATCH = {
  DURATION_SECONDS: 180,
  GOAL_PAUSE_MS: 2000,
  OVERTIME_SECONDS: 30,
  COUNTDOWN_SECONDS: 3,
} as const;

export const ARENA = {
  // Playfield boundaries (inside walls)
  LEFT: PHYSICS.WALL_THICKNESS,
  RIGHT: GAME.WIDTH - PHYSICS.WALL_THICKNESS,
  TOP: PHYSICS.WALL_THICKNESS,
  BOTTOM: GAME.HEIGHT - PHYSICS.WALL_THICKNESS,

  // Goal dimensions
  GOAL_WIDTH: 30,
  GOAL_HEIGHT: 160,

  // Goal Y center
  GOAL_Y: GAME.HEIGHT / 2,

  // Geyser positions
  GEYSER_POSITIONS: [
    { x: GAME.WIDTH * 0.25, y: GAME.HEIGHT * 0.25 },
    { x: GAME.WIDTH * 0.75, y: GAME.HEIGHT * 0.25 },
    { x: GAME.WIDTH * 0.25, y: GAME.HEIGHT * 0.75 },
    { x: GAME.WIDTH * 0.75, y: GAME.HEIGHT * 0.75 },
  ],

  // Spawn positions
  VEHICLE_P1_SPAWN: { x: 200, y: GAME.HEIGHT / 2 },
  VEHICLE_P2_SPAWN: { x: GAME.WIDTH - 200, y: GAME.HEIGHT / 2 },
  BALL_SPAWN: { x: GAME.WIDTH / 2, y: GAME.HEIGHT / 2 },
} as const;

// Collision categories for Matter.js
export const CATEGORIES = {
  WALL: 0x0001,
  VEHICLE: 0x0002,
  BALL: 0x0004,
  GOAL_SENSOR: 0x0008,
  GEYSER: 0x0010,
} as const;

// Color palette — Steampunk Western
export const COLORS = {
  SAND: 0xd4a574,
  TERRACOTTA: 0xc75b39,
  COPPER: 0xb87333,
  DARK_WOOD: 0x3e2723,
  BURNT_WOOD: 0x5d3a1a,
  RUST: 0x8b4513,
  GOLD: 0xffd700,
  CREAM: 0xf5e6c8,
  DUST: 0xc9b896,
  STEEL: 0x708090,
  SMOKE: 0x808080,
  TNT_RED: 0xcc2200,
  PLAYER1: 0xe85d3a,
  PLAYER2: 0x3a7ec8,
  BOOST_FULL: 0x44cc44,
  BOOST_EMPTY: 0xcc4444,
  GOAL_NET: 0x8b6914,
} as const;
