import { Graphics } from 'pixi.js';
import { LinkModel } from '../types.ts';

type Point = [number, number];

export function linkRadial(graphic: Graphics, { source, target }: LinkModel): void {

  const pointRadial = (x: number, y: number): Point =>
    [y * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];

  let lastX: number;
  let lastY: number;
  let firstPointDrawn = false;
  const ctx = context(graphic);

  const point = (x: number, y: number): void => {
    if (!firstPointDrawn)
      firstPointDrawn = true;
    else {
      const yTemp = (lastY + y) / 2;
      const p0 = pointRadial(lastX, lastY);
      const p1 = pointRadial(lastX, yTemp);
      const p2 = pointRadial(x, yTemp);
      const p3 = pointRadial(x, y);
      ctx.moveTo(...p0);
      ctx.bezierCurveTo(...p1, ...p2, ...p3);
    }
    lastX = x;
    lastY = y;
  }

  // output.lineStart();
  point(source.layout.x, source.layout.y);
  point(target.layout.x, target.layout.y);
  // output.lineEnd();
}

function context(graphic: Graphics) {
  let _x0: number | null = null;
  let _y0: number | null = null; // start of current subpath
  let _x1: number | null = null;
  let _y1: number | null = null; // end of current subpath

  const moveTo = (x: number, y: number) => {
    _x0 = _x1 = x;
    _y0 = _y1 = y;
    graphic.moveTo(_x1, _y1);
    // console.log(`M${_x1},${_y1}`);
  };

  const bezierCurveTo = (x1: number, y1: number, x2: number, y2: number, x: number, y: number) => {
    // PixiJS uses bezierCurveTo method for cubic Bézier curves
    graphic.bezierCurveTo(x1, y1, x2, y2, x, y).stroke({ width: 2, color: 0xFC8A17 });
    _x1 = x;
    _y1 = y;
    // console.log(`C${x1},${y1},${x2},${y2},${_x1},${_y1}`);
  };

  return { moveTo, bezierCurveTo };
}
