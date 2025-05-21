export type Vector2 = [number, number];
export type Vector3 = [number, number, number];
export type Vector4 = [number, number, number, number];
export type TransformType = Vector3; // x, y, scale
export type Rect = Vector4; // origin.x origin.y corner.x corner.y
export type EaseFunction = (dt: number, value: number, duration: number) => number;

export type ScreenConfig = {
  viewportPadding: number; // 0 - 1.0 percentage of current viewport to use as padding
  /*_movingCell: {
    animation, // mode: single|multi|custom
               //   specialKey: 'ctrl'
  }*/
  physics: {
    maxCompressPercent: number; // 0.0-1.0
    stiffness: number;
    inputEaseFn: EaseFunction;
    animDurationMs: number;
    animEaseFn: EaseFunction;
  };

  drag: {
    limitToViewport: boolean;
    animDurationMs: number;
    animEaseFn: EaseFunction;
  };

  zoom: {
    inputEaseFn: EaseFunction;
    min: number;
    max: number;
    limitToViewport: boolean;
    animDurationMs: number;
    animEaseFn: EaseFunction;
  };

  inertia: {
    friction: number;
    inputCacheDurationMs: number;
    durationMultiplier: number;
    turboVelocityThreshold: number;
    minVelocity: number;
    limitToViewport: boolean;
    animEaseFn: EaseFunction; // no duration because its automatic, for better effect
  };
};

export type State = {
  transform: TransformType;
  physicsTransform: Vector4;
  frameStartTransform: Vector4; // change detection
  viewport: Rect;
  extent: Rect;

  config: ScreenConfig;

  frameStart: {
    time: number;
    deltaTime: number; // duration between last frame and current
  };

  physics: {
    active: boolean;
    input: Vector2; // dx, dy <- squeeze forces
    currentInput: Vector2;
    timeStart: number;
    output: Vector2;
  };

  // inputs
  drag: {
    current: Vector2; // x, y
    input: Vector3; // x, y, startTimestamp
    limiterForces: Vector4; // totalX, totalY, dx, dy
    active: boolean;
    timeStart: number;
    output: Vector2; // dx, dy
  };
  zoom: {
    input: Vector3; // ox, oy, scale
    limiterForces: Vector4; // totalX, totalY, dx, dy
    active: boolean;
    timeStart: number;
    output: Vector3; // dx, dy, ds
  };
  inertia: {
    input: Vector3[]; // x, y, timestamp
    limiterForces: Vector4; // totalX, totalY, dx, dy
    active: boolean;
    timeStart: number;
    output: Vector2; // totalX, totalY
    animDurationMs: number;
  };
};
