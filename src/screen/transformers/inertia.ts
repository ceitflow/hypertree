import { State } from '../types.ts';

export function Inertia({ transform, inertia, translate }: State) {
  return {
    start: () => {
      const { velocity, strength } = inertia;
      const motion = translate.motionPerFrame;
      velocity[0] = 0;
      velocity[1] = 0;
      for (let i = 1; i < motion.length; i++) {
        const prev = motion[i - 1];
        const current = motion[i];
        const ratio = i / motion.length;
        const weight = ratio * strength;
        velocity[0] += weight * (current[0] - prev[0]);
        velocity[1] += weight * (current[1] - prev[1]);
      }
      inertia.active = true;
    },
    next: () => {
      if (!inertia.active) return;

      const { velocity, brakeFriction, friction, minVelocity } = inertia;

      transform[0] += velocity[0];
      transform[1] += velocity[1];

      // todo time based
      const acc = translate.active ? brakeFriction : friction;
      velocity[0] *= acc;
      velocity[1] *= acc;

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
