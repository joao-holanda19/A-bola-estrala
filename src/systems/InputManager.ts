// ============================================================
// A Bola Estrala — Input Manager
// Handles keyboard mapping for up to 2 local players
// ============================================================
import Phaser from 'phaser';

export interface PlayerInput {
  accelerate: boolean;
  reverse: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  boost: boolean;
  jump: boolean;
  drift: boolean;
}

interface KeyBindings {
  accelerate: Phaser.Input.Keyboard.Key;
  reverse: Phaser.Input.Keyboard.Key;
  turnLeft: Phaser.Input.Keyboard.Key;
  turnRight: Phaser.Input.Keyboard.Key;
  boost: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  drift: Phaser.Input.Keyboard.Key;
}

export class InputManager {
  private bindings: Map<number, KeyBindings> = new Map();

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;

    // Player 1: WASD + Shift/Space + J/K
    this.bindings.set(0, {
      accelerate: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      reverse: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      turnLeft: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      turnRight: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      boost: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      jump: kb.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      drift: kb.addKey(Phaser.Input.Keyboard.KeyCodes.K),
    });

    // Player 2: Arrow keys + Numpad
    this.bindings.set(1, {
      accelerate: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      reverse: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      turnLeft: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      turnRight: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      boost: kb.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO),
      jump: kb.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE),
      drift: kb.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO),
    });
  }

  getInput(playerId: number): PlayerInput {
    const keys = this.bindings.get(playerId);
    if (!keys) {
      return {
        accelerate: false,
        reverse: false,
        turnLeft: false,
        turnRight: false,
        boost: false,
        jump: false,
        drift: false,
      };
    }

    return {
      accelerate: keys.accelerate.isDown,
      reverse: keys.reverse.isDown,
      turnLeft: keys.turnLeft.isDown,
      turnRight: keys.turnRight.isDown,
      boost: keys.boost.isDown,
      jump: Phaser.Input.Keyboard.JustDown(keys.jump),
      drift: keys.drift.isDown,
    };
  }
}
