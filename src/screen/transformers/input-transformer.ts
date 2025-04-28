import { g } from '@joint/core';
import { State, Vector2 } from '../types.ts';
import { cacheInertiaMotion, Clamp, Ease, ExtentConstraint, getIntegralLimit, integral, Round } from './input';

export type InputControllerType = ReturnType<typeof InputTransformer>;

export function InputTransformer(state: State) {
  const { frameStart, inertia, drag, zoom, transform, viewport, viewportPadding, extent } = state;

  return {
    invert: (x: number, y: number): Vector2 => [(x - transform[0]) / transform[2], (y - transform[1]) / transform[2]],

    dragStart: (x: number, y: number) => {
      drag.input[0] = x;
      drag.input[1] = y;
      drag.input[2] = frameStart.time;
      drag.cachedInput[0] = x;
      drag.cachedInput[1] = y;
      drag.cachedInput[2] = frameStart.time;
      drag.animation.easeOutput[0] = 0;
      drag.animation.easeOutput[1] = 0;
      cacheInertiaMotion(x, y, frameStart.time, inertia.input, true);
    },

    drag: (x: number, y: number) => {
      const { input, cachedInput, animation } = drag;
      const { easeOutput, easeOutputRatio, durationMs, instantOutput } = animation;

      const dt = frameStart.time - cachedInput[2]; // from last cache time

      if (dt >= frameStart.deltaTime) {
        const currRatioElapsed = Clamp(dt / durationMs, 0, 1); // todo it can be never applied and its still >0

        // TODO subtract? -=
        //  maybe losing precision

        const xEaseLeft = easeOutput[0] - currRatioElapsed * easeOutput[0];
        const yEaseLeft = easeOutput[1] - currRatioElapsed * easeOutput[1];

        // calculate distance to new input[]
        const dx = x - cachedInput[0] + xEaseLeft;
        const dy = y - cachedInput[1] + yEaseLeft;

        easeOutput[0] = dx * easeOutputRatio; // todo prev dst is lost
        easeOutput[1] = dy * easeOutputRatio; // todo Ease.in and invert 1 - time
        instantOutput[0] += dx - easeOutput[0];
        instantOutput[1] += dy - easeOutput[1];

        animation.timeStart = frameStart.time;
      }

      input[0] = x;
      input[1] = y;
      input[2] = frameStart.time;
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

      animation.easeOutput[0] = Math.sign(vx) * integral(vx, friction, xLimit);
      animation.easeOutput[1] = Math.sign(vy) * integral(vy, friction, yLimit);

      animation.timeStart = frameStart.time;
      animation.active = true;
    },

    stopInertia: () => {
      inertia.animation.active = false;
    },

    // todo adaptive zoom step (like inertia)
    zoom: (origin: Vector2, delta: number) => {
      const { input, min, max, inputEaseFn, animation } = zoom;
      const { easeOutput } = animation;
      const currentZoom = transform[2];
      input[0] = origin[0];
      input[1] = origin[1];
      input[2] = Clamp(input[2] + delta, min, max); // clamp so there is no dead scrolling if outside range

      const mapping = (input[2] - min) / (max - min); // mapping [min,max] to [0,max]
      const zoomOutput = min + inputEaseFn(mapping, max - min, 1) - currentZoom;
      const sum = Round(zoomOutput, 4);
      if (sum === 0) return; // todo detect if min,max set min max

      easeOutput[2] = zoomOutput;
      easeOutput[1] = -input[1] * easeOutput[2];
      easeOutput[0] = -input[0] * easeOutput[2];

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
      // todo zoom instantOutput
      transform[0] = -(extentRect.width * extentToViewportScale - viewRect.width) / 2;
      transform[1] = -(extentRect.height * extentToViewportScale - viewRect.height) / 2;
      transform[2] = extentToViewportScale;
    },

    nextFrame: () => {
      if (drag.animation.active) {
        const { input, animation, cachedInput } = drag;
        const { durationMs, instantOutput, easeFn, easeOutput } = animation;
        cachedInput[0] = input[0];
        cachedInput[1] = input[1];
        cachedInput[2] = input[2];
        cacheInertiaMotion(input[0], input[1], frameStart.time, inertia.input);

        let time = frameStart.time - animation.timeStart;
        if (time >= durationMs) {
          time = durationMs;
          drag.animation.active = false;
        }
        const prevTime = Math.max(0, time - frameStart.deltaTime);

        let dx = easeFn(time, easeOutput[0], durationMs) - easeFn(prevTime, easeOutput[0], durationMs); // todo store prev values
        let dy = easeFn(time, easeOutput[1], durationMs) - easeFn(prevTime, easeOutput[1], durationMs);

        // console.log(easeOutput[0], time, Round(dx));
        if (instantOutput[0] || instantOutput[1]) {
          dx += instantOutput[0];
          dy += instantOutput[1];
          instantOutput[0] = 0;
          instantOutput[1] = 0;
        }

        const force = ExtentConstraint(dx, dy, transform, viewport, viewportPadding, extent);

        transform[0] += dx + force.xForce;
        transform[1] += dy + force.yForce;
      }

      if (zoom.animation.active) {
        const { animation } = zoom;
        const { timeStart, durationMs, easeFn, easeOutput } = animation;
        const easeOutputEmpty = !(easeOutput[0] || easeOutput[1] || easeOutput[2]);

        let time = frameStart.time - timeStart;
        if (time >= durationMs || easeOutputEmpty) {
          time = durationMs;
          zoom.animation.active = false;
        }
        const prevTime = Math.max(0, time - frameStart.deltaTime);

        transform[0] += easeFn(time, easeOutput[0], durationMs) - easeFn(prevTime, easeOutput[0], durationMs);
        transform[1] += easeFn(time, easeOutput[1], durationMs) - easeFn(prevTime, easeOutput[1], durationMs);
        transform[2] += easeFn(time, easeOutput[2], durationMs) - easeFn(prevTime, easeOutput[2], durationMs);
      }

      if (inertia.animation.active) {
        // todo apply friction to inertia if touching the viewport border
        // todo remember pointer pos while inertia runs to animate braking and then going back to pointer pos
        const { animation } = inertia;
        const { timeStart, durationMs, easeFn, easeOutput, instantOutput } = animation;
        const easeOutputEmpty = !(easeOutput[0] || easeOutput[1]);

        let time = frameStart.time - timeStart;
        if (time >= durationMs || easeOutputEmpty) {
          time = durationMs;
          animation.active = false;
        }
        const prevTime = Math.max(0, time - frameStart.deltaTime);

        let dx = easeFn(time, easeOutput[0], durationMs) - easeFn(prevTime, easeOutput[0], durationMs);
        let dy = easeFn(time, easeOutput[1], durationMs) - easeFn(prevTime, easeOutput[1], durationMs);

        if (instantOutput[0] || instantOutput[1]) {
          dx += instantOutput[0];
          dy += instantOutput[1];
          instantOutput[0] = 0;
          instantOutput[1] = 0;
        }

        const { xForce, yForce } = ExtentConstraint(dx, dy, transform, viewport, viewportPadding, extent);

        transform[0] += dx + xForce;
        transform[1] += dy + yForce;
      }
    },
  };
}
