import { State } from '../types';
import { PhysicsInputType } from './physics-input';

// todo remove physics argument
export function DragInput({ config, drag, inertia, frameStart, transform }: State, physics: PhysicsInputType) {
  const cacheInertiaMotion = (x: number, y: number, reset?: boolean): void => {
    const cache = inertia.input;
    const cacheDurationMs = config.inertia.inputCacheDurationMs;
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
      drag.output[0] = 0;
      drag.output[1] = 0;
      cacheInertiaMotion(x, y, true);
    },

    move: (x: number, y: number, opt: { relative?: boolean } = {}) => {
      const { input, current, output } = drag;

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

      output[0] = input[0];
      output[1] = input[1];
      drag.timeStart = frameStart.time;
      drag.active = true;
    },

    stop: () => {
      drag.active = false;
      physics.clearLimiterForces(drag.limiterForces);
    },

    nextFrame: () => {
      if (!drag.active) return;

      const { current, limiterForces, input, output, timeStart } = drag;
      const { animDurationMs, limitToViewport, animEaseFn } = config.drag;

      cacheInertiaMotion(current[0], current[1]);
      let dx: number;
      let dy: number;

      // if instant or empty
      if (animDurationMs <= frameStart.deltaTime || !(output[0] || output[1])) {
        dx = output[0];
        dy = output[1];
        drag.active = false;
      } else {
        // animate next frame
        const time = Math.min(frameStart.time - timeStart, animDurationMs);
        const prevTime = Math.max(0, time - frameStart.deltaTime);
        dx = animEaseFn(time, output[0], animDurationMs) - animEaseFn(prevTime, output[0], animDurationMs);
        dy = animEaseFn(time, output[1], animDurationMs) - animEaseFn(prevTime, output[1], animDurationMs);
        if (time === animDurationMs) {
          drag.active = false;
        }
      }

      if (limitToViewport) {
        physics.addForceWithLimitToExtent(limiterForces, dx, dy);
      }
      transform[0] += dx + limiterForces[2];
      transform[1] += dy + limiterForces[3];
      input[0] -= dx; // todo can add config to replace with (-= dx + forces[0]) so if mouse goes outside viewport, the last position is remembered
      input[1] -= dy;
    },
  };
}
