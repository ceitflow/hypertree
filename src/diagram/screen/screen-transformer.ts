import { dia } from '@joint/core';
import { State } from './types.ts';

export function ScreenTransformer(state: State, paperStyle: CSSStyleDeclaration) {
  const { transform: t, physicsTransform: pt, frameStartTransform: ft, extent, viewport } = state;
  return {
    nextFrame: () => {
      const t0 = t[0] + pt[0];
      const t1 = t[1] + pt[1];
      const t2 = t[2] + pt[2]; // scale + scaleX
      const t3 = t[2] + pt[3]; // scale + scaleY;

      if (ft[0] !== t0 || ft[1] !== t1 || ft[2] !== t2 || ft[3] !== t3) {
        // matrix(scaleX, skewY, skewX, scaleY, translateX, translateY);
        paperStyle.transform = `matrix(${t2}, 0, 0, ${t3}, ${t0}, ${t1})`;
        ft[0] = t0;
        ft[1] = t1;
        ft[2] = t2;
        ft[3] = t3;
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
