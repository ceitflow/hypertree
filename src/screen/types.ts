export type TransformType = [number, number, number]; // x, y, scale
export type Rect = [number, number, number, number]; // x, y, width, height
export type Point = [number, number];

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

  frameStart: {
    time: number;
    deltaTime: number; // duration between last frame and current
  };

  translate: {
    target: Point;
    motionPerFrame: Point[];
    motionSize: number;
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
};
