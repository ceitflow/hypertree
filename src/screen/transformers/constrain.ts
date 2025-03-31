import { State } from '../types.ts';

export function Constrain({ transform: t, currentTransform: ct, viewport, extent }: State) {
  return {
    next: () => {
      if (ct[0] === t[0] && ct[1] === t[1] && ct[2] === t[2]) return;

      // todo constrain inertia
      // and hard limit
      // todo apply friction to inertia if touching the viewport border

      const x = t[0];
      const y = t[1];
      const scale = t[2];
      const dstToLeft = (x - viewport[0]) / scale - extent[0];
      const dstToTop = (y - viewport[1]) / scale - extent[1];
      const dstToRight = (viewport[2] - x) / scale - extent[2];
      const dstToBottom = (viewport[3] - y) / scale - extent[3];

      let leftPadding = viewport[2] / 2 / scale;
      let rightPadding = viewport[2] / 2 / scale;
      let topPadding = viewport[3] / 2 / scale;
      let bottomPadding = viewport[3] / 2 / scale;

      const heightFitInViewport = extent[3] * scale <= viewport[3];
      const widthFitInViewport = extent[2] * scale <= viewport[2];

      if (widthFitInViewport) {
        leftPadding = Math.max(leftPadding, dstToLeft + dstToRight);
        rightPadding = Math.max(rightPadding, dstToLeft + dstToRight);
      }
      if (heightFitInViewport) {
        topPadding = Math.max(topPadding, dstToTop + dstToBottom);
        bottomPadding = Math.max(bottomPadding, dstToTop + dstToBottom);
      }

      let dx = 0;
      let dy = 0;

      if (dstToLeft > leftPadding) {
        dx = leftPadding - dstToLeft;
      } else if (dstToRight > rightPadding) {
        dx = dstToRight - rightPadding;
      }

      if (dstToTop > topPadding) {
        dy = topPadding - dstToTop;
      } else if (dstToBottom > bottomPadding) {
        dy = dstToBottom - bottomPadding;
      }

      t[0] += dx * scale;
      t[1] += dy * scale;
    },
  };
}
