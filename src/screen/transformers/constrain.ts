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
      const paddingX = viewport[2] / 2;
      const paddingY = viewport[3] / 2;
      const dx0 = (viewport[0] - x) / scale - translateExtent[0]; // origin.X
      const dy0 = (viewport[1] - y) / scale - translateExtent[1]; // origin.Y
      const dx1 = (viewport[2] - x) / scale - translateExtent[2]; // corner.X
      const dy1 = (viewport[3] - y) / scale - translateExtent[3]; // corner.Y

      const dx = dx1 > dx0 ? dx0 + dx1 : Math.min(0, dx0) || Math.max(0, dx1);
      const dy = dy1 > dy0 ? dy0 + dy1 : Math.min(0, dy0) || Math.max(0, dy1);

      t[0] += dx * scale;
      t[1] += dy * scale;
    },
  };
}
