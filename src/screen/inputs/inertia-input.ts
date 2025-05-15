import { Clamp } from '../limiter';
import { State } from '../types.ts';
import { PhysicsInputType } from './physics-input.ts';

export function InertiaInput({ transform, frameStart, drag, inertia }: State, physics: PhysicsInputType) {
  //
  const inertiaIntegral = (v: number, friction: number, limit: number) =>
    (v * Math.pow(friction, limit)) / Math.log(friction) - v / Math.log(friction); // f(x) = velocity * friction^x

  const inertiaIntegralLimit = (v: number, friction: number, stopVelocity: number) =>
    Math.abs(v) <= stopVelocity ? 0 : (Math.log(stopVelocity) - Math.log(Math.abs(v))) / Math.log(friction); // f(x) = (ln(stopVelocity) - ln(velocity)) / ln(friction)

  return {
    start: () => {
      const { input, output, friction, animation, turboVelocityThreshold, minVelocity, durationMultiplier, limiter } = inertia;
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
      if (limiter.toViewport) {
        physics.limitToExtent(limiter.forces, dx, dy);
        if (dx === -limiter.forces[0]) dx = 0;
        if (dy === -limiter.forces[1]) dy = 0;
      }

      if (!dt || Math.abs(dx) + Math.abs(dy) <= minVelocity) {
        return;
      }

      // if drag animation has more momentum then use it instead
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

      /*
        todo nice to have: dynamic duration calculation for every easeFn
         and smoothDuration can be toggled on/off
        provide all inverted Ease functions?
       */
      animation.timeStart = frameStart.time;
      animation.active = true;
    },

    stop: () => {
      inertia.animation.active = false;
      physics.clearLimiterForces(inertia.limiter.forces);
    },

    nextFrame: () => {
      if (!inertia.animation.active) return;

      const { output, limiter, animation } = inertia;
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
        const easeFn = animation.easeFn;
        dx = easeFn(time, output[0], duration) - easeFn(prevTime, output[0], duration);
        dy = easeFn(time, output[1], duration) - easeFn(prevTime, output[1], duration);
        if (time === duration) {
          animation.active = false;
        }
      }

      if (toViewport) {
        physics.limitToExtent(forces, dx, dy);
        // todo detect when touching extent
        if (forces[0] || forces[1]) {
          const ox = output[0];
          const oy = output[1];
          output[0] = ox === 0 ? 0 : ox >= 0 ? Math.max(ox + forces[0], 0) : Math.min(ox + forces[0], 0);
          output[1] = oy === 0 ? 0 : oy >= 0 ? Math.max(oy + forces[1], 0) : Math.min(oy + forces[1], 0);
        }
      }
      // console.log(forces, dx, dy);
      transform[0] += dx + forces[2];
      transform[1] += dy + forces[3];

      if (!animation.active) physics.clearLimiterForces(forces);
    },
  };
}
