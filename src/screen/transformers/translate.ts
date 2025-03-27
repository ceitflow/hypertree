import { State } from '../types.ts';

export function Translate({ frameStart, transform, translate, inertia }: State) {
  return {
    start: (x: number, y: number) => {
      const { target } = translate;
      target[0] = x;
      target[1] = y;
      translate.first = [x, y];
      translate.firstTime = frameStart.time;
      translate.active = true;
    },

    move: (x: number, y: number) => {
      if (!translate.active) return;
      const { target } = translate;
      transform[0] += x - target[0]; // prev stored position
      transform[1] += y - target[1];
      target[0] = x;
      target[1] = y;
    },

    stop: () => {
      translate.active = false;
      const { first, firstTime, target } = translate;
      const maxDuration = 300; // before brake is applied
      const duration = frameStart.time - firstTime;
      let factor = 1;
      if (duration > maxDuration) {
        factor = maxDuration / duration;
      }
      inertia.velocity[0] = ((first![0] - target[0]) / -10) * factor;
      inertia.velocity[1] = ((first![1] - target[1]) / -10) * factor;
      // todo remove
    },
  };
}
