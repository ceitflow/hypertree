export type TransformType = [number, number, number]; // x, y, scale
export type Point = [number, number];
export type Rect = [number, number, number, number]; // origin.x origin.y corner.x corner.y

// todo create Options type

export type State = {
  /*
  screen: {
    transform: TransformType;
    currentTransform: TransformType;
    viewport: Rect;
    extent: Rect;

    // transformers force
    dx,
    dy,

    // constraint force
    contrDx
    contrDy
  }*/
  transform: TransformType;
  currentTransform: TransformType;
  viewport: Rect;
  extent: Rect;

  motionPerFrame: Point[];
  motionSize: number;

  frameStart: {
    time: number;
    deltaTime: number; // duration between last frame and current
  };
  /*
  screenMotion: {
      cache: Point[];
      cacheSize: number;
      animation: [number, number, number, number];
      mouse: {

      }
      touch: {

      }
      inertia: {

      }
  }
   */

  translate: {
    target: Point;
    active: boolean;
  };

  inertia: {
    minVelocity: number;
    strength: number;
    friction: number;
    brakeFriction: number;

    velocity: [number, number];
    active: boolean;
  };

  zoom: {
    min: number;
    max: number;
    durationMs: number;

    targetZoom: number;
    startVelocity: [number, number, number];
    velocity: [number, number, number];
    active: boolean;
  };

  touch: {
    touchDelay: number;
    tapDistance: number; // dbl tap has to be near previous tap
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
