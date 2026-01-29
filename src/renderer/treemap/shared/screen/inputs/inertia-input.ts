import { Clamp } from '../plugins';
import { State } from '../types';
import { PhysicsInputType } from './physics-input';

export function InertiaInput({ config, transform, frameStart, drag, inertia }: State, physics: PhysicsInputType) {
  //
  const inertiaIntegral = (v: number, friction: number, limit: number) =>
    (v * Math.pow(friction, limit)) / Math.log(friction) - v / Math.log(friction); // f(x) = velocity * friction^x

  const inertiaIntegralLimit = (v: number, friction: number, stopVelocity: number) =>
    Math.abs(v) <= stopVelocity ? 0 : (Math.log(stopVelocity) - Math.log(Math.abs(v))) / Math.log(friction); // f(x) = (ln(stopVelocity) - ln(velocity)) / ln(friction)

  return {
    start: () => {
      const { input, output, limiterForces } = inertia;
      const { friction, turboVelocityThreshold, minVelocity, durationMultiplier, limitToViewport } = config.inertia;
      if (!input.length) return;
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

      // if no room then stop
      if (limitToViewport) {
        physics.addForceWithLimitToExtent(limiterForces, dx, dy);
        if (dx === -limiterForces[0]) dx = 0;
        if (dy === -limiterForces[1]) dy = 0;
      }

      if (!dt || Math.abs(dx) + Math.abs(dy) <= minVelocity) {
        return;
      }

      // if drag animation has more momentum then use it instead
      if (config.drag.animDurationMs) {
        const dragInputX = drag.input[0];
        const dragInputY = drag.input[1];
        const dragLimit = config.drag.animDurationMs / dt;
        const dragDeltaX = (dragInputX * Math.log(friction)) / (Math.pow(friction, dragLimit) - 1);
        const dragDeltaY = (dragInputY * Math.log(friction)) / (Math.pow(friction, dragLimit) - 1);

        if (Math.abs(dragDeltaX) > Math.abs(dx)) dx = dragDeltaX;
        if (Math.abs(dragDeltaY) > Math.abs(dy)) dy = dragDeltaY;
      }

      const xLimit = inertiaIntegralLimit(dx, friction, minVelocity);
      const yLimit = inertiaIntegralLimit(dy, friction, minVelocity);

      output[0] = inertiaIntegral(dx, friction, xLimit);
      output[1] = inertiaIntegral(dy, friction, yLimit);
      inertia.animDurationMs = Math.max(xLimit * dt, yLimit * dt) * durationMultiplier;

      /*
        todo nice to have: dynamic duration calculation for every easeFn
         and smoothDuration can be toggled on/off
        provide all inverted Ease functions?
       */
      inertia.timeStart = frameStart.time;
      inertia.active = true;
    },

    clearCache: () => {
      inertia.input.splice(0, inertia.input.length);
    },

    stop: () => {
      inertia.active = false;
      physics.clearLimiterForces(inertia.limiterForces);
    },

    nextFrame: () => {
      if (!inertia.active) return;

      const { output, limiterForces, animDurationMs, timeStart } = inertia;
      const { limitToViewport, animEaseFn } = config.inertia;

      let dx: number;
      let dy: number;

      // if instant or empty
      if (animDurationMs <= frameStart.deltaTime || !(output[0] || output[1])) {
        dx = output[0];
        dy = output[1];
        inertia.active = false;
      } else {
        // animate next frame
        const time = Clamp(frameStart.time - timeStart, 0, animDurationMs);
        const prevTime = Math.max(time - frameStart.deltaTime, 0);
        dx = animEaseFn(time, output[0], animDurationMs) - animEaseFn(prevTime, output[0], animDurationMs);
        dy = animEaseFn(time, output[1], animDurationMs) - animEaseFn(prevTime, output[1], animDurationMs);
        if (time === animDurationMs) {
          inertia.active = false;
        }
      }

      if (limitToViewport) {
        physics.addForceWithLimitToExtent(limiterForces, dx, dy); // todo detect when touching extent
        if (limiterForces[0] || limiterForces[1]) {
          const ox = output[0];
          const oy = output[1];
          output[0] = ox === 0 ? 0 : ox >= 0 ? Math.max(ox + limiterForces[0], 0) : Math.min(ox + limiterForces[0], 0);
          output[1] = oy === 0 ? 0 : oy >= 0 ? Math.max(oy + limiterForces[1], 0) : Math.min(oy + limiterForces[1], 0);
        }
      }
      transform[0] += dx + limiterForces[2];
      transform[1] += dy + limiterForces[3];

      if (!inertia.active) physics.clearLimiterForces(limiterForces);
    },
  };
}
