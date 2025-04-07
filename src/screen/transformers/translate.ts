import { StoreType } from '../store.ts';
import { SoftConstraint } from './constrain-util.ts';

export function Translate({ state: { transform: t, translate, viewport, extent }, addMotion }: StoreType) {
  return {
    start: (x: number, y: number) => {
      const { target } = translate;
      target[0] = x;
      target[1] = y;
      translate.active = true;
      addMotion(x, y, true);
    },

    move: (x: number, y: number) => {
      if (!translate.active) return;
      const { target } = translate;
      const { dx, dy } = SoftConstraint(x - target[0], y - target[1], t, viewport, extent);
      t[0] += dx;
      t[1] += dy;
      target[0] = x;
      target[1] = y;
    },

    next: () => {
      if (translate.active) addMotion(translate.target[0], translate.target[1]);
    },

    stop: () => {
      translate.active = false;
    },
  };
}
