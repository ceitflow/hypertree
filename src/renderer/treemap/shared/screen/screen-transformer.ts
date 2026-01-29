import { BBox, State, UpdateTransform } from './types';

export function ScreenTransformer(state: State, updateTransform: UpdateTransform) {
  const { transform: t, physicsTransform: pt, frameStartTransform: ft, extent, viewport } = state;
  return {
    nextFrame: () => {
      const t0 = t[0] + pt[0];
      const t1 = t[1] + pt[1];
      const t2 = t[2] + pt[2]; // scale + scaleX
      const t3 = t[2] + pt[3]; // scale + scaleY;

      if (ft[0] !== t0 || ft[1] !== t1 || ft[2] !== t2 || ft[3] !== t3) {
        updateTransform(t0, t1, t2, t3);
        ft[0] = t0;
        ft[1] = t1;
        ft[2] = t2;
        ft[3] = t3;
      }
    },

    // set what is the actual viewport size
    updateVisibleViewport: (data: BBox): void => {
      viewport[0] = data.x;
      viewport[1] = data.y;
      viewport[2] = data.width;
      viewport[3] = data.height;
    },

    // set what is the graph size
    updateExtentArea: (data: BBox): void => {
      extent[0] = data.x;
      extent[1] = data.y;
      extent[2] = data.width;
      extent[3] = data.height;
    },

    resetTransform: (): void => {
      t[0] = 0;
      t[1] = 0;
      t[1] = 1;
      pt[0] = 0;
      pt[1] = 0;
      pt[2] = 0;
      pt[3] = 0;
      ft[0] = 0;
      ft[1] = 0;
      ft[2] = 1;
      ft[3] = 1;
    },
  };
}
