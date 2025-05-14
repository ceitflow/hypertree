export type Vector2 = [number, number];
export type Vector3 = [number, number, number];
export type Vector4 = [number, number, number, number];
export type TransformType = Vector3; // x, y, scale
export type Rect = Vector4; // origin.x origin.y corner.x corner.y
export type EaseFunction = (dt: number, value: number, duration: number) => number;

export type State = {
  transform: TransformType;
  physicsTransform: Vector4;
  frameStartTransform: Vector4; // change detection
  viewport: Rect;
  viewportPadding: number; // 0 - 1.0 percentage of current viewport to use as padding
  extent: Rect;

  frameStart: FrameStart;

  physics: {
    active: boolean;
    input: Vector2; // dx, dy <- squeeze forces
    currentInput: Vector2;
    maxCompressPercent: number;
    stiffness: number;
    inputEaseFn: EaseFunction;
    animation: {
      active: boolean;
      timeStart: number;
      output: Vector2;
      durationMs: number;
      easeFn: EaseFunction;
    }
  };

  // inputs
  drag: {
    current: Vector2; // x, y
    input: Vector3; // x, y, startTimestamp
    limiter: LimitType;
    animation: {
      active: boolean;
      timeStart: number;
      output: Vector2; // dx, dy
      durationMs: number;
      easeFn: EaseFunction;
    };
  };
  zoom: {
    input: Vector3; // ox, oy, scale
    inputEaseFn: EaseFunction;
    min: number;
    max: number;
    animation: {
      active: boolean;
      timeStart: number;
      output: Vector3; // dx, dy, ds
      durationMs: number;
      easeFn: EaseFunction;
    };
    limiter: LimitType;
  };
  inertia: {
    input: Vector3[]; // x, y, timestamp
    inputCacheDurationMs: number;
    output: Vector2; // totalX, totalY
    friction: number;
    durationMultiplier: number;
    turboVelocityThreshold: number;
    minVelocity: number;
    limiter: LimitType;
    animation: {
      active: boolean;
      timeStart: number;
      durationMs: number;
      easeFn: EaseFunction;
    }
  };
  // animation: {} animated transitions, walkthrough etc 
};

export type FrameStart = {
  time: number;
  deltaTime: number; // duration between last frame and current
};

export type LimitType = {
  forces: Vector4; // totalX, totalY, dx, dy
  toViewport?: boolean;
};
