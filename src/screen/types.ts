export type TransformType = [number, number, number]; // x, y, scale
export type Point = [number, number];
export type Rect = [number, number, number, number]; // origin.x origin.y corner.x corner.y

// optimization
// const TRANSLATE_STRUCT = {
//   TARGET_X: 0,
//   TARGET_Y: 1,
//   MIN_VELOCITY: 2,
//   ...
// }
// set minVelocity(value) {
//   this.data[TRANSLATE_STRUCT.MIN_VELOCITY] = value;
// }
// e.g. transform.minVelocity = 1
// new Float64Array(arraySize)
export type State = {
  transform: TransformType;
  currentTransform: TransformType;
  viewport: Rect; // todo viewport and currentViewport to trigger constrain snap
  extent: Rect;

  motionPerFrame: Point[];
  motionSize: number;

  frameStart: {
    time: number;
    deltaTime: number; // duration between last frame and current
  };

  translate: {
    target: Point;
    active: boolean;
  };

  inertia: {
    minVelocity: number;
    strength: number;
    friction: number;
    brakeFriction: number;
    // internal
    velocity: [number, number];
    active: boolean;
  };

  zoom: {
    min: number;
    max: number;
    durationMs: number;
    // internal
    targetZoom: number;
    startVelocity: [number, number, number];
    velocity: [number, number, number];
    active: boolean;
  };

  touch: {
    touchDelay: number;
    tapDistance: number; // dbl tap has to be near previous tap
    // wheelDelay = 150,
    // clickDistance2 = 0,
    touch0: { id: number; point: Point; fixed: Point } | null;
    touch1: { id: number; point: Point; fixed: Point } | null;
    prevScale: number | null;
    firstTouch: Point | null;
    prevTouchTimeout: NodeJS.Timeout | null;
    endMultitouchTimeout: NodeJS.Timeout | null;
    taps: number; // for dbl click
    active: boolean;
  };
};
