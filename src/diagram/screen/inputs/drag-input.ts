import { State } from '../types.ts';
import { PhysicsInputType } from './physics-input.ts';

export function DragInput({ drag, inertia, frameStart, transform }: State, physics: PhysicsInputType) {
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

  return {
    start: (x: number, y: number) => {
      drag.current[0] = x;
      drag.current[1] = y;
      drag.input[0] = 0;
      drag.input[1] = 0;
      drag.input[2] = frameStart.time;
      drag.animation.output[0] = 0;
      drag.animation.output[1] = 0;
      cacheInertiaMotion(x, y, true);
    },

    move: (x: number, y: number, opt: { relative?: boolean } = {}) => {
      const { input, current, animation } = drag;

      if (opt.relative) {
        x += current[0];
        y += current[1];
      }

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

    stop: () => {
      drag.animation.active = false;
      physics.clearLimiterForces(drag.limiter.forces);
    },

    nextFrame: () => {
      if (!drag.animation.active) return;

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
        physics.limitToExtent(forces, dx, dy);
        console.log(forces);
      }
      transform[0] += dx + forces[2];
      transform[1] += dy + forces[3];
      input[0] -= dx; // todo can add config to replace with (-= dx + forces[0]) so if mouse goes outside viewport, the last position is remembered
      input[1] -= dy;
    },
  };
}
