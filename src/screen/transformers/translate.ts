import { State } from '../types.ts';

export function Translate({ transform, translate }: State) {
  return {
    start: (x: number, y: number) => {
      const { target } = translate;
      target[0] = x;
      target[1] = y;
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
    },
  };
}
