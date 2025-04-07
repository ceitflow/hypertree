import { StoreType } from '../store.ts';
import { SoftConstraint } from './constrain-util.ts';

export function Mouse({
  state: {
    transform: t,
    motion: { mouse },
    viewport,
    extent,
  },
  addMotion,
}: StoreType) {
  return {
    start: (x: number, y: number) => {
      const { target } = mouse;
      target[0] = x;
      target[1] = y;
      mouse.active = true;
      addMotion(x, y, true);
    },

    move: (x: number, y: number) => {
      if (!mouse.active) return;
      const { target } = mouse;
      const { dx, dy } = SoftConstraint(x - target[0], y - target[1], t, viewport, extent);
      t[0] += dx;
      t[1] += dy;
      target[0] = x;
      target[1] = y;
    },

    next: () => {
      if (mouse.active) addMotion(mouse.target[0], mouse.target[1]);
    },

    stop: () => {
      mouse.active = false;
    },
  };
}
