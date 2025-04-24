export type TransformType = Vector3; // x, y, scale
export type Vector2 = [number, number];
export type Vector3 = [number, number, number];
export type Vector4 = [number, number, number, number];
export type Rect = [number, number, number, number]; // origin.x origin.y corner.x corner.y
export type EaseFunction = (t: number, c: number, d: number) => number;

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
    easeFn: EaseFunction;
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
    timeStart: number;
    cache: Vector2[];
    velocity: Vector2; // dx, dy
    stopVelocity: number; // if lower then stops inertia
    durationMs: number; // dynamic
    easeFn: EaseFunction; // dynamic
    thresholds: InertiaThreshold[];
  };
};

export type InertiaThreshold = {
  atVelocityThreshold: number;
  friction: number;
  speed: number; // 1 - normal, 0.5 slow, 2 fast etc
  easeFn: EaseFunction;
};
