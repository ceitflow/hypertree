import { g } from '@joint/core';
import { State, Vector2, Vector4 } from '../types.ts';
import { Clamp, Ease, ExtentLimiter, Round } from './input';

export type InputControllerType = ReturnType<typeof InputTransformer>;

export function InputTransformer(state: State) {
  const { frameStart, inertia, drag, zoom, transform, viewport, physics, viewportPadding, extent } = state;

  // inertia
  const cacheInertiaMotion = (x: number, y: number, reset?: boolean): void => {
    const cache = inertia.input;
    const cacheDurationMs = inertia.inputCacheDurationMs;
    const timestamp = Date.now();
    if (reset) {
      cache.splice(0, cache.length, [x, y, timestamp]);
    } else cache.push([x, y, timestamp]);

    for (let i = cache.length - 3; i >= 0; i--) {
      // leave 2 latest caches in case refresh rate is < 60fps
      if (timestamp - cache[i][2] > cacheDurationMs) cache.splice(i, 1);
    }
  };

  const inertiaIntegral = (v: number, friction: number, limit: number) =>
    (v * Math.pow(friction, limit)) / Math.log(friction) - v / Math.log(friction); // f(x) = velocity * friction^x

  const inertiaIntegralLimit = (v: number, friction: number, stopVelocity: number) =>
    Math.abs(v) <= stopVelocity ? 0 : (Math.log(stopVelocity) - Math.log(Math.abs(v))) / Math.log(friction); // f(x) = (ln(stopVelocity) - ln(velocity)) / ln(friction)

  // zoom
  const invertScaleToZoomStep = (targetZoom: number) => {
    // (input[2] - min) / (max - min) = Inverse(fn, extentToViewportScale - min, max - min, 1)
    // input[2]  = Inverse() * (max - min) + min
    const { min, max, inputEaseFn } = zoom;
    return Ease.Inverse(inputEaseFn, targetZoom - min, max - min, 1) * (max - min) + min;
  };

  // physics
  const limitToExtent = (forces: Vector4, dx: number, dy: number): void => {
    const { xForce, yForce } = ExtentLimiter(dx, dy, transform, viewport, viewportPadding, extent);
    forces[0] += xForce;
    forces[1] += yForce;
    forces[2] = xForce;
    forces[3] = yForce;
    if (!xForce && !yForce) {
      clearLimiterForces(forces);
    } else {
      physics.input[0] += xForce;
      physics.input[1] += yForce;
    }
  };
  const clearLimiterForces = (forces: Vector4) => {
    physics.input[0] -= forces[0]; // clear applied force
    physics.input[1] -= forces[1];
    forces[0] = 0;
    forces[1] = 0;
  }

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
      clearLimiterForces(drag.limiter.forces);
    },

    startInertia: () => {
      const { input, output, friction, animation, turboVelocityThreshold, minVelocity, durationMultiplier } = inertia;
      // todo apply friction to inertia if touching the viewport border
      // remember pointer pos while inertia runs to animate braking and then going back to pointer pos

      // actual distance made by the motion
      let dx = input[input.length - 1][0] - input[0][0];
      let dy = input[input.length - 1][1] - input[0][1];
      const dt = input[input.length - 1][2] - input[0][2];

      const velocity = Math.max(Math.abs(dx) / dt, Math.abs(dy) / dt);
      const turbo = (Math.max(0, velocity - turboVelocityThreshold) * 2) / turboVelocityThreshold;
      if (turbo) {
        dx *= 1 + turbo;
        dy *= 1 + turbo;
      }

      if (!dt || Math.abs(dx) + Math.abs(dy) <= minVelocity) {
        return;
      }

      // if drag animation has more drag then use its value
      if (drag.animation.durationMs) {
        const dragInputX = drag.input[0];
        const dragInputY = drag.input[1];
        const dragLimit = drag.animation.durationMs / dt;
        const dragDeltaX = (dragInputX * Math.log(friction)) / (Math.pow(friction, dragLimit) - 1);
        const dragDeltaY = (dragInputY * Math.log(friction)) / (Math.pow(friction, dragLimit) - 1);

        if (Math.abs(dragDeltaX) > Math.abs(dx)) dx = dragDeltaX;
        if (Math.abs(dragDeltaY) > Math.abs(dy)) dy = dragDeltaY;
      }

      const xLimit = inertiaIntegralLimit(dx, friction, minVelocity);
      const yLimit = inertiaIntegralLimit(dy, friction, minVelocity);

      output[0] = inertiaIntegral(dx, friction, xLimit);
      output[1] = inertiaIntegral(dy, friction, yLimit);
      animation.durationMs = Math.max(xLimit * dt, yLimit * dt) * durationMultiplier;

      inertia.defaultEaseFn = (t, c, d) => {
        const isX = c === output[0];
        return inertiaIntegral(isX ? dx : dy, friction, (t / d) * (isX ? xLimit : yLimit));
      };

      /*
        nice to have: dynamic duration calculation for every easeFn
         and smoothDuration can be toggled on/off
        provide all inverted Ease functions?
       */
      console.log(
        input,
        dt,
        'input: ',
        dx,
        'duration ',
        animation.durationMs,
        'friction',
        friction,
        'xLimit',
        xLimit,
        'velocity',
        velocity,
        'turbo',
        turbo
      );
      animation.timeStart = frameStart.time;
      animation.active = true;
    },

    stopInertia: () => {
      inertia.animation.active = false;
      clearLimiterForces(inertia.limiter.forces);
    },

    // todo adaptive zoom step (like inertia) if zooming while is active then speed up
    zoom: (origin: Vector2, step: number) => {
      const { input, min, max, inputEaseFn, animation } = zoom;
      const { output } = animation;
      const currentZoom = transform[2];
      input[0] = origin[0];
      input[1] = origin[1];
      input[2] = Clamp(input[2] + step, min, max); // clamp so there is no dead scrolling if outside range

      const mapping = (input[2] - min) / (max - min); // mapping [min,max] to [0,1] (0,max)
      const diffToTargetZoom = Clamp(min + inputEaseFn(mapping, max - min, 1), min, max) - currentZoom;

      if (Round(diffToTargetZoom, 4) === 0) return; // todo detect if min,max set min max

      output[0] = -input[0] * diffToTargetZoom;
      output[1] = -input[1] * diffToTargetZoom;
      output[2] = diffToTargetZoom;

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

      zoom.input[2] = invertScaleToZoomStep(extentToViewportScale);

      transform[0] = -(extentRect.width * extentToViewportScale - viewRect.width) / 2;
      transform[1] = -(extentRect.height * extentToViewportScale - viewRect.height) / 2;
      transform[2] = extentToViewportScale;
    },

    nextFrame: () => {
      if (drag.animation.active) {
        const { current, animation, limiter, input } = drag;
        const { durationMs, easeFn, output, timeStart } = animation;
        const { toViewport, forces } = limiter;

        cacheInertiaMotion(current[0], current[1]);
        let dx: number;
        let dy: number;

        // if instant or empty
        if (durationMs <= frameStart.deltaTime || !(output[0] || output[1])) {
          dx = output[0];
          dy = output[1];
          animation.active = false;
        } else {
          // animate next frame
          const time = Math.min(frameStart.time - timeStart, durationMs);
          const prevTime = Math.max(0, time - frameStart.deltaTime);
          dx = easeFn(time, output[0], durationMs) - easeFn(prevTime, output[0], durationMs);
          dy = easeFn(time, output[1], durationMs) - easeFn(prevTime, output[1], durationMs);
          if (time === durationMs) {
            animation.active = false;
          }
        }

        if (toViewport) {
          limitToExtent(forces, dx, dy);
        }
        transform[0] += dx + forces[2];
        transform[1] += dy + forces[3];
        input[0] -= dx; // todo can add config to replace with (-= dx + forces[0]) so if mouse goes outside viewport, the last position is remembered
        input[1] -= dy;
      }

      if (zoom.animation.active) {
        const { animation, limiter } = zoom;
        const { durationMs, easeFn, output } = animation;
        const { toViewport, forces } = limiter;

        let dx: number;
        let dy: number;
        let ds: number;

        // if instant or empty
        if (durationMs <= frameStart.deltaTime || !(output[0] || output[1] || output[2])) {
          dx = output[0];
          dy = output[1];
          ds = output[2];
          animation.active = false;
        } else {
          // animate next frame
          const time = Math.min(frameStart.time - animation.timeStart, durationMs);
          const prevTime = Math.max(0, time - frameStart.deltaTime);
          dx = easeFn(time, output[0], durationMs) - easeFn(prevTime, output[0], durationMs);
          dy = easeFn(time, output[1], durationMs) - easeFn(prevTime, output[1], durationMs);
          ds = easeFn(time, output[2], durationMs) - easeFn(prevTime, output[2], durationMs);
          if (time === durationMs) {
            animation.active = false;
          }
        }
        if (toViewport) {
          limitToExtent(forces, dx, dy);
        }
        transform[0] += dx + forces[2];
        transform[1] += dy + forces[3];
        transform[2] += ds;
      }

      if (inertia.animation.active) {
        const { output, defaultEaseFn, limiter, animation } = inertia;
        const { toViewport, forces } = limiter;
        const duration = animation.durationMs;

        let dx: number;
        let dy: number;

        // if instant or empty
        if (duration <= frameStart.deltaTime || !(output[0] || output[1])) {
          dx = output[0];
          dy = output[1];
          animation.active = false;
        } else {
          // animate next frame
          const time = Clamp(frameStart.time - animation.timeStart, 0, duration);
          const prevTime = Math.max(time - frameStart.deltaTime, 0);
          const easeFn = animation.easeFn ?? defaultEaseFn;
          dx = easeFn(time, output[0], duration) - easeFn(prevTime, output[0], duration);
          dy = easeFn(time, output[1], duration) - easeFn(prevTime, output[1], duration);
          if (time === duration) {
            animation.active = false;
          }
        }
        // console.log(
        //   'dx',
        //   dx,
        //   'durationMs',
        //   animation.durationMs,
        //   'dt',
        //   time / animation.durationMs,
        //   'time',
        //   time,
        //   'ratio',
        //   dx / output[0]
        // );
        if (toViewport) {
          limitToExtent(forces, dx, dy);
        }
        transform[0] += dx + forces[2];
        transform[1] += dy + forces[3];
        if (!animation.active) clearLimiterForces(forces);
      }
    },
  };
}
