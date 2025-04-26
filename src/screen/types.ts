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
    input: Vector2;
    inputEaseFn: EaseFunction; // default linear? or allow null, then input -> output
    output: Vector2; // dx, dy
    animation: AnimationState;
  };
  zoom: {
    input: Vector3; // ox, oy, scale
    min: number;
    max: number;
    inputEaseFn: EaseFunction;
    output: Vector3; // dx, dy, ds // can bypass input by setting directly to output - then run the animation
    // todo looks like input easing mechanism (present in zoom, inertia, drag)
    //  1. input easing, 2. animation easing
    animation: AnimationState;
  };
  inertia: {
    input: Vector3[]; // x, y, timestamp
    maxInputSpeed: number;
    inputEaseFn: EaseFunction;
    output: Vector2; // dx, dy
    animation: AnimationState;
  };
};

export type FrameStart = {
  time: number;
  deltaTime: number; // duration between last frame and current
};

export type AnimationState = {
  active: boolean;
  timeStart: number;
  durationMs: number; // todo if durationMs == 0 then immediate
  easeFn: EaseFunction;
};
