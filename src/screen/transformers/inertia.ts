import { State } from '../types.ts';
import { SoftConstraint } from './constrain-util.ts';

export function Inertia({
  transform,
  touch,
  inertia,
  translate,
  motionPerFrame,
  viewport,
  extent,
}: State) {
  return {
    start: () => {
      const { velocity, strength } = inertia;
      velocity[0] = 0;
      velocity[1] = 0;
      for (let i = 1; i < motionPerFrame.length; i++) {
        const prev = motionPerFrame[i - 1];
        const current = motionPerFrame[i];
        const ratio = i / motionPerFrame.length;
        const weight = ratio * strength;
        velocity[0] += weight * (current[0] - prev[0]);
        velocity[1] += weight * (current[1] - prev[1]);
      }
      // console.log(velocity,motionPerFrame.reduce((prev, curr) => prev + ` x: ${curr[0]}, y: ${curr[1]},`, ''));
      inertia.active = true;
    },

    next: () => {
      if (!inertia.active) return;

      const { velocity, brakeFriction, friction, minVelocity } = inertia;

      const { dx, dy } = SoftConstraint(velocity[0], velocity[1], transform, viewport, extent);
      transform[0] += dx;
      transform[1] += dy;

      // todo time based
      // remember pointer pos while inertia runs to animate braking and then going back to pointer pos
      const acc = translate.active || touch.active ? brakeFriction : friction;
      velocity[0] *= acc;
      velocity[1] *= acc;

      // length of vector
      if (Math.abs(velocity[0]) + Math.abs(velocity[1]) < minVelocity) {
        velocity[0] = 0;
        velocity[1] = 0;
        inertia.active = false;
      }
    },

    stop: () => {
      inertia.active = false;
    },
  };
}
