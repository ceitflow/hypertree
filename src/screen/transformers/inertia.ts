import { State } from '../types.ts';

export function Inertia({ transform, inertia, translate: { motionPerFrame } }: State) {
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
      console.log(motionPerFrame, velocity);
      inertia.active = true;
    },
    next: () => {
      if (!inertia.active) return;

      const { velocity, friction, minVelocity } = inertia;

      transform[0] += velocity[0];
      transform[1] += velocity[1];

      // todo time based
      velocity[0] *= friction;
      velocity[1] *= friction;

      // length of vector
      if (velocity[0] * velocity[0] + velocity[1] * velocity[1] < minVelocity * minVelocity) {
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
