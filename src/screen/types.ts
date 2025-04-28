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
    input: Vector3; // x, y, timestamp
    cachedInput: Vector3;
    animation: AnimationState<Vector2>; // dx, dy
  };
  zoom: {
    input: Vector3; // ox, oy, scale
    inputEaseFn: EaseFunction;
    min: number;
    max: number;
    // todo looks like input easing mechanism (present in zoom, inertia, drag)
    //  1. input easing, 2. animation easing
    animation: AnimationState<Vector3>; // dx, dy, ds
  };
  inertia: {
    input: Vector3[]; // x, y, timestamp
    maxInputSpeed: number;
    animation: AnimationState<Vector2>; // dx, dy
  };
};

export type FrameStart = {
  time: number;
  deltaTime: number; // duration between last frame and current
};

export type AnimationState<Output extends number[] = number[]> = {
  active: boolean;
  timeStart: number;
  // todo input? split to instant and ease in nextFrame
  instantOutput: Output; // applied in the next frame // todo remove, use durationMs 0
  easeOutput: Output; // applied over duration
  durationMs: number; // todo if durationMs == 0 or <= deltaTime, then immediate
  easeFn: EaseFunction;
  easeOutputRatio: number; // [0,1]
};
