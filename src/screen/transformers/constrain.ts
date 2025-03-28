import { State } from '../types.ts';

export function Constrain({
  transform: t,
  currentTransform: ct,
  constrain: { viewport, translateExtent },
}: State) {
  return {
    next: () => {
      if (ct[0] === t[0] && ct[1] === t[1] && ct[2] === t[2]) return;

      // todo inertia
      // and hard limit

      const x = t[0];
      const y = t[1];
      const scale = t[2];
      const xPadding = (viewport[2] - 200) / scale; // todo apply padding in the end to avoid multiplying by scale
      const yPadding = (viewport[3] - 200) / scale;
      const dx0 = (viewport[0] - x) / scale - translateExtent[0] + xPadding; // origin.X
      const dy0 = (viewport[1] - y) / scale - translateExtent[1] + yPadding; // origin.Y
      const dx1 = (viewport[2] - x) / scale - translateExtent[2] - xPadding; // corner.X
      const dy1 = (viewport[3] - y) / scale - translateExtent[3] - yPadding; // corner.Y

      // if d0 is negative - viewport is past origin
      // if d1 is positive - viewport is past corner
      let dx: number;
      let dy: number;

      if (dx1 > dx0) {
        // left and right corner in viewport
        dx = (dx0 + dx1) / 2;
      } else {
        dx = Math.min(0, dx0) || Math.max(0, dx1);
      }

      if (dy1 > dy0) {
        // top and bottom corner in viewport
        dy = (dy0 + dy1) / 2;
      } else {
        dy = Math.min(0, dy0) || Math.max(0, dy1);
      }

      t[0] += dx * scale;
      t[1] += dy * scale;
    },
  };
}
