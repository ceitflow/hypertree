import { State } from '../types.ts';
import { dia } from '@joint/core';

export function ScreenTransformer(
  { transform: t, physicsTransform: off, currentTransform: ct, extent, viewport }: State,
  paperStyle: CSSStyleDeclaration
) {
  // sets currentTransform based on transform + transformOffset
  return {
    nextFrame: () => {
      const t0 = t[0] + off[1];
      const t1 = t[1] + off[3];
      const t2 = t[2] + off[0];
      const t3 = t[2] + off[3];
      if (ct[0] !== t0 || ct[1] !== t1 || ct[2] !== t2 || ct[3] !== t3) {
        paperStyle.transform = `matrix(${t2}, 0, 0, ${t3}, ${t0}, ${t1})`;
        ct[0] = t0;
        ct[1] = t1;
        ct[2] = t2;
        ct[3] = t3;
      }
    },

    updateViewport: (data: dia.Size): void => {
      viewport[0] = 0;
      viewport[1] = 0;
      viewport[2] = data.width;
      viewport[3] = data.height;
    },

    updateExtentArea: (data: dia.Size): void => {
      extent[0] = 0;
      extent[1] = 0;
      extent[2] = data.width;
      extent[3] = data.height;
    },
  };
}
