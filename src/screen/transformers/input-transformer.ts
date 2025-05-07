import { g } from '@joint/core';
import { State, Vector2 } from '../types.ts';
import { AnimateNextFrame, Clamp, Ease, ExtentLimiter, Round } from './input';

export type InputControllerType = ReturnType<typeof InputTransformer>;

export function InputTransformer(state: State) {
  const { frameStart, inertia, drag, zoom, transform, viewport, viewportPadding, extent } = state;

  /* Inertia */
  const cacheInertiaMotion = (x: number, y: number, reset?: boolean): void => {
    const fixedDelta = 20; // todo put in config
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
    (v * Math.pow(friction, limit)) / Math.log(friction) - v / Math.log(friction);

  // f(x) = (ln(stopVelocity) - ln(velocity)) / ln(friction)
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
      cacheInertiaMotion(x, y);
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

      // todo apply friction to inertia if touching the viewport border
      // todo remember pointer pos while inertia runs to animate braking and then going back to pointer pos

      function brakeRatio(vel: number, baseline: number, strength: number) {
        if (vel <= baseline) return 1;
        const excess = vel - baseline;
        const smoothed = Math.log1p(excess) * strength;
        return (baseline + smoothed) / vel;
      }

      const currentZoom = transform[2];
      const zoomRatio =
        0.5 + Clamp((Math.log(currentZoom) - Math.log(zoom.min)) / (Math.log(zoom.max) - Math.log(zoom.min)), 0, 1) * 0.5;
      const stopVelocity = 1;
      const baselineVelocity = 50;

      // actual distance made by the motion
      inertia.deltaX = (input[input.length - 1][0] - input[0][0]) * zoomRatio;
      inertia.deltaY = (input[input.length - 1][1] - input[0][1]) * zoomRatio;
      inertia.deltaT = input[input.length - 1][2] - input[0][2];
      console.log(inertia.deltaX);

      const velocity = Math.max(Math.abs(inertia.deltaX) / inertia.deltaT, Math.abs(inertia.deltaY) / inertia.deltaT);
      const brake = Math.min(
        brakeRatio(Math.abs(inertia.deltaX), baselineVelocity, velocity * 1.75),
        brakeRatio(Math.abs(inertia.deltaY), baselineVelocity, velocity * 1.75)
      );

      inertia.deltaX *= brake;
      inertia.deltaY *= brake;

      if (!inertia.deltaT || Math.abs(inertia.deltaX) + Math.abs(inertia.deltaY) <= stopVelocity) return;

      inertia.friction = 0.92; //+ Ease.linear(velocity, 1, 15) * 0.05;

      if (drag.animation.durationMs) {
        const dragInputX = drag.input[0];
        const dragInputY = drag.input[1];
        const dragLimit = drag.animation.durationMs / inertia.deltaT;
        const dragDeltaX = (dragInputX * Math.log(inertia.friction)) / (Math.pow(inertia.friction, dragLimit) - 1);
        const dragDeltaY = (dragInputY * Math.log(inertia.friction)) / (Math.pow(inertia.friction, dragLimit) - 1);

        if (Math.abs(dragDeltaX) > Math.abs(inertia.deltaX)) inertia.deltaX = dragDeltaX;
        if (Math.abs(dragDeltaY) > Math.abs(inertia.deltaY)) inertia.deltaY = dragDeltaY;
      }

      const xLimit = getIntegralLimit(inertia.deltaX, inertia.friction, stopVelocity);
      const yLimit = getIntegralLimit(inertia.deltaY, inertia.friction, stopVelocity);
      inertia.distanceX = integral(inertia.deltaX, inertia.friction, xLimit);
      inertia.distanceY = integral(inertia.deltaY, inertia.friction, yLimit);

      animation.durationMs = Math.max(xLimit * inertia.deltaT, yLimit * inertia.deltaT); // duration / speed;
      /*
        nice to have: dynamic duration calculation for every easeFn
         and smoothDuration can be toggled on/off
        provide all inverted Ease functions?
       */

      console.log(
        'input: ',
        inertia.deltaX,
        'duration ',
        animation.durationMs,
        'friction',
        inertia.friction,
        'xLimit',
        xLimit,
        'brake',
        brake,
        'velocity',
        velocity,
        'zoomRatio',
        zoomRatio
      );
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
        const { deltaX, deltaY, deltaT, limiter, friction, animation } = inertia;
        // TODO implement integral easeFn. add on top of it another easeFn (optionally- if it adds the subtract, if removes then add to totalDistance)
        const time = Clamp(frameStart.time - animation.timeStart, 0, animation.durationMs);
        const prevTime = Math.max(time - frameStart.deltaTime, 0);

        let dx = integral(deltaX, friction, time / deltaT) - integral(deltaX, friction, prevTime / deltaT);
        let dy = integral(deltaY, friction, time / deltaT) - integral(deltaY, friction, prevTime / deltaT);

        const easeFn = Ease.outQuint;
        // dx = easeFn(time, inertia.distanceX, animation.durationMs) - easeFn(prevTime, inertia.distanceX, animation.durationMs);
        // dy = easeFn(time, inertia.distanceY, animation.durationMs) - easeFn(prevTime, inertia.distanceY, animation.durationMs);

        // if (Math.abs(dx) >= Math.abs(inertia.distanceX)) dx = inertia.distanceX;
        // if (Math.abs(dy) >= Math.abs(inertia.distanceY)) dy = inertia.distanceY;

        if (time >= animation.durationMs) {
          animation.active = false;
        }

        // inertia.distanceX -= Math.abs(dx);
        // inertia.distanceY -= Math.abs(dy);

        console.log(
          'dx',
          dx,
          'distanceX',
          inertia.distanceX,
          'durationMs',
          animation.durationMs,
          'dt',
          time / animation.durationMs,
          'time',
          time,
          'ratio',
          dx / deltaX
        );

        if (limiter.toViewport) {
          const { xForce, yForce } = ExtentLimiter(dx, dy, transform, viewport, viewportPadding, extent);
          // todo if force==0 then clear physics force
          dx += xForce;
          dy += yForce;
        }

        transform[0] += dx;
        transform[1] += dy;
      }
    },
  };
}
