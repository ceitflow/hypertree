import { State } from '../types.ts';

export function Translate({ transform, translate }: State) {
  const addPosToMotion = () => {
    const { motionPerFrame, target, motionSize } = translate;
    motionPerFrame.push([target[0], target[1]]);
    if (motionPerFrame.length > motionSize) motionPerFrame.shift();
  };

  return {
    start: (x: number, y: number) => {
      const { target, motionPerFrame } = translate;
      target[0] = x;
      target[1] = y;
      motionPerFrame.splice(0, motionPerFrame.length, [x, y]);
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

    next: () => {
      if (!translate.active) return;
      addPosToMotion(); // caches position per frame
    },

    stop: () => {
      translate.active = false;
      addPosToMotion();
    },
  };
}
