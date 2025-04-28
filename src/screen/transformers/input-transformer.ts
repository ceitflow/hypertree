import { g } from '@joint/core';
import { State, Vector2 } from '../types.ts';
import { AnimateNextFrame, Clamp, Ease, Round } from './input';

export type InputControllerType = ReturnType<typeof InputTransformer>;

export function InputTransformer(state: State) {
  const { frameStart, inertia, drag, zoom, transform, viewport, extent } = state;

  /**
   * Inertia
   */
  const cacheInertiaMotion = (x: number, y: number, reset?: boolean): void => {
    const fixedDelta = 16.6667; // store position every 60fps frame
    const cache = inertia.input;
    const timestamp = frameStart.time;
    if (reset) {
      cache.splice(0, cache.length, [x, y, timestamp]);
    } else cache.push([x, y, timestamp]);
    for (let i = cache.length - 3; i >= 0; i--) {
      // leave 2 latest caches in case refresh rate is < 60fps
      if (timestamp - cache[i][2] > fixedDelta) cache.splice(i, 1);
    }
  };
  // f(x) = velocity * friction^x
  const integral = (v: number, friction: number, limit: number) =>
    (Math.abs(v) * Math.pow(friction, limit)) / Math.log(friction) - Math.abs(v) / Math.log(friction);

  // f(x) = stopVelocity => (ln(stopVelocity) - ln(velocity)) / ln(friction)
  const getIntegralLimit = (v: number, friction: number, stopVelocity: number) =>
    Math.abs(v) <= stopVelocity ? 0 : (Math.log(stopVelocity) - Math.log(Math.abs(v))) / Math.log(friction);

  return {
    invert: (x: number, y: number): Vector2 => [(x - transform[0]) / transform[2], (y - transform[1]) / transform[2]],

    dragStart: (x: number, y: number) => {
      drag.current[0] = x;
      drag.current[1] = y;
      drag.input[0] = 0;
      drag.input[1] = 0;
      drag.input[2] = frameStart.time;
      drag.animation.output[0] = 0;
      drag.animation.output[1] = 0;
      cacheInertiaMotion(x, y, true);
    },

    drag: (x: number, y: number) => {
      const { input, current, animation } = drag;

      const dx = x - current[0];
      const dy = y - current[1];
      current[0] = x;
      current[1] = y;

      input[0] += dx;
      input[1] += dy;
      input[2] = frameStart.time;

      animation.output[0] = input[0];
      animation.output[1] = input[1];
      animation.timeStart = frameStart.time;
      animation.active = true;
    },

    pinchDrag: (dx: number, dy: number, scale?: number) => {
      transform[0] += dx; // todo use drag() to make it work with constraints
      transform[1] += dy;
      transform[2] += scale || 0;
    },

    dragStop: () => {
      drag.animation.active = false;
    },

    startInertia: () => {
      const { input, animation } = inertia;

      // todo inertia use drag.output values
      const stopVelocity = 1;
      // actual distance made by the motion
      const vx = input[input.length - 1][0] - input[0][0];
      const vy = input[input.length - 1][1] - input[0][1];
      const delta = input[input.length - 1][2] - input[0][2];

      if (!delta || Math.abs(vx) + Math.abs(vy) <= stopVelocity) return;

      // calculate strength based on friction
      let speed = Clamp(Math.max(Math.abs(vx) / delta, Math.abs(vy) / delta), 0, inertia.maxInputSpeed);
      const logValue = Math.log(speed + 1);
      const friction = 0.8 + Ease.outCubic(speed, 1, 15) * 0.17;
      // console.log(logValue / Math.log(maxSpeed + 1), Ease.outCubic(speed, 1, 15));
      speed = (logValue / Math.log(inertia.maxInputSpeed + 1)) * 2;

      const xLimit = getIntegralLimit(vx, friction, stopVelocity);
      const yLimit = getIntegralLimit(vy, friction, stopVelocity);

      const duration = Math.max(xLimit * delta, yLimit * delta);

      animation.durationMs = duration / speed;

      animation.output[0] = Math.sign(vx) * integral(vx, friction, xLimit);
      animation.output[1] = Math.sign(vy) * integral(vy, friction, yLimit);

      animation.timeStart = frameStart.time;
      animation.active = true;
    },

    stopInertia: () => {
      inertia.animation.active = false;
    },

    // todo adaptive zoom step (like inertia)
    zoom: (origin: Vector2, delta: number) => {
      const { input, min, max, inputEaseFn, animation } = zoom;
      const { output } = animation;
      const currentZoom = transform[2];
      input[0] = origin[0];
      input[1] = origin[1];
      input[2] = Clamp(input[2] + delta, min, max); // clamp so there is no dead scrolling if outside range

      const mapping = (input[2] - min) / (max - min); // mapping [min,max] to [0,max]
      const zoomOutput = min + inputEaseFn(mapping, max - min, 1) - currentZoom;
      const sum = Round(zoomOutput, 4);
      if (sum === 0) return; // todo detect if min,max set min max

      output[2] = zoomOutput;
      output[1] = -input[1] * output[2];
      output[0] = -input[0] * output[2];

      animation.timeStart = frameStart.time;
      animation.active = true;
    },

    zoomToFit: (padding: Vector2 = [0, 0], animated = false, ignoreZoomConstraint = true) => {
      const viewRect = new g.Rect(viewport[0], viewport[1], viewport[2] - viewport[0], viewport[3] - viewport[1]);
      const extentRect = new g.Rect(extent[0], extent[1], extent[2] - extent[0], extent[3] - extent[1]);
      const extentToViewportScale = Math.min(
        (viewRect.width - padding[0] * 2) / extentRect.width,
        (viewRect.height - padding[1] * 2) / extentRect.height
      );
      // invertScaleToZoomStep
      zoom.input[2] = Clamp(
        ((Math.log(extentToViewportScale) - Math.log(zoom.min)) * zoom.max) / (Math.log(zoom.max) - Math.log(zoom.min)),
        zoom.min,
        zoom.max
      );

      transform[0] = -(extentRect.width * extentToViewportScale - viewRect.width) / 2;
      transform[1] = -(extentRect.height * extentToViewportScale - viewRect.height) / 2;
      transform[2] = extentToViewportScale;
    },

    nextFrame: () => {
      if (drag.animation.active) {
        cacheInertiaMotion(drag.current[0], drag.current[1]);
        AnimateNextFrame(drag.animation, drag.limiter, state);
        drag.input[0] -= drag.animation.cachedDeltas[0];
        drag.input[1] -= drag.animation.cachedDeltas[1];
      }

      if (zoom.animation.active) {
        AnimateNextFrame(zoom.animation, zoom.limiter, state);
      }

      if (inertia.animation.active) {
        // todo apply friction to inertia if touching the viewport border
        // todo remember pointer pos while inertia runs to animate braking and then going back to pointer pos
        AnimateNextFrame(inertia.animation, inertia.limiter, state);
      }
    },
  };
}
