export type Vector2 = [number, number];
export type Vector3 = [number, number, number];
export type Vector4 = [number, number, number, number];
export type TransformType = Vector3; // x, y, scale
export type Rect = Vector4; // origin.x origin.y corner.x corner.y
export type EaseFunction = (dt: number, value: number, duration: number) => number;

export type State = {
  transform: TransformType;
  physicsTransform: Vector4;
  frameStartTransform: Vector4; // transform + physicsTransform
  viewport: Rect;
  viewportPadding: number; // 0 - 1.0 percentage of current viewport to use as padding
  extent: Rect;

  frameStart: FrameStart;

  // inputs
  drag: {
    current: Vector2; // x, y
    input: Vector3; // x, y, startTimestamp
    limiter: LimitType;
    animation: AnimationState<Vector2>; // dx, dy
    isDragging: NodeJS.Timeout | null;
  };
  zoom: {
    input: Vector3; // ox, oy, scale
    inputEaseFn: EaseFunction;
    min: number;
    max: number;
    // todo looks like input easing mechanism (present in zoom, inertia, drag)  1. input easing, 2. animation easing
    animation: AnimationState<Vector3>; // dx, dy, ds
    limiter: LimitType;
  };
  inertia: {
    input: Vector3[]; // x, y, timestamp
    inputCacheDurationMs: number;
    output: Vector3; // totalX, totalY, totalT
    friction: number;
    turboVelocityThreshold: number;
    minVelocity: number;
    defaultEaseFn: EaseFunction;
    limiter: LimitType;
    animation: {
      active: boolean;
      timeStart: number;
      easeFn?: EaseFunction;
    }
  };
  // animation: {} animated transitions, walkthrough etc 
};

export type FrameStart = {
  time: number;
  deltaTime: number; // duration between last frame and current
};

export type AnimationState<Output extends number[] = number[]> = {
  active: boolean;
  timeStart: number;
  output: Output; // applied over duration
  durationMs: number; // if duration <= deltaTime then instant
  easeFn: EaseFunction;
  cachedDeltas: Output;
};

export type LimitType = {
  toViewport: boolean;
};
