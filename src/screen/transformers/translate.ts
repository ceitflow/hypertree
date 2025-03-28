import { State } from '../types.ts';

export function Translate({ transform, translate, motionPerFrame, motionSize }: State) {
  const addMotion = (x: number, y: number, reset?: boolean) => {
    if (reset) motionPerFrame.splice(0, motionPerFrame.length, [x, y]);
    else motionPerFrame.push([x, y]);
    if (motionPerFrame.length > motionSize) motionPerFrame.shift();
  };

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
      transform[0] += x - target[0]; // prev stored position
      transform[1] += y - target[1];
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
