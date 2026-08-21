// ============================================================
// A Bola Estrala — Math Helpers
// ============================================================

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get the speed (magnitude) of a velocity vector
 */
export function getSpeed(vx: number, vy: number): number {
  return Math.sqrt(vx * vx + vy * vy);
}

/**
 * Get angle from velocity vector (radians)
 */
export function velocityToAngle(vx: number, vy: number): number {
  return Math.atan2(vy, vx);
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Get the forward-facing unit vector from an angle
 */
export function angleToVector(angle: number): { x: number; y: number } {
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

/**
 * Dot product of two 2D vectors
 */
export function dot(ax: number, ay: number, bx: number, by: number): number {
  return ax * bx + ay * by;
}
