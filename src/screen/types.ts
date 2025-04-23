export type TransformType = Vector3; // x, y, scale
export type Vector2 = [number, number];
export type Vector3 = [number, number, number];
export type Vector4 = [number, number, number, number];
export type Rect = [number, number, number, number]; // origin.x origin.y corner.x corner.y

export type State = {
  transform: TransformType;
  physicsTransform: Vector4;
  currentTransform: Vector4; // transform + physicsTransform
  viewport: Rect;
  viewportPadding: number; // 0 - 1.0 percentage of current viewport to use as padding
  extent: Rect;

  frameStart: {
    time: number;
    deltaTime: number; // duration between last frame and current
  };

  // inputs
  drag: {
    active: boolean;
    first: Vector2;
    current: Vector2;

    prevCurrent: Vector2;
  };
  zoom: {
    active: boolean;
    timeStart: number;
    min: number;
    max: number;
    durationMs: number;
    inputStep: number;
    velocity: Vector3; // dx, dy, ds
  };

  // input extras
  constraint: {
    dx: number;
    dy: number;
    lastValidX: number | null;
    lastValidY: number | null;
    forces: Vector2; // negative - left, top, positive - right, bottom
  };
  inertia: {
    active: boolean;
    cache: Vector2[];
    cacheSize: number;
    velocityThreshold: number;
    varStrength: number;
    minVelocity: number; // if lower then stop inertia
    strength: number;
    velocity: Vector2; // dx, dy, durationMsRemaining
  };
};
