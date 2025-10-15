import { Graphics } from 'pixi.js';
import { LinkModel } from '../graph/types.ts';

export function drawLinkGraphics(graphic: Graphics, { source, target }: LinkModel): void {
  const ctx = context(graphic);

  ctx.moveTo(source.layout.radialX, source.layout.radialY);
  ctx.lineTo(target.layout.radialX, target.layout.radialY);
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
    graphic.bezierCurveTo(x1, y1, x2, y2, x, y).stroke({ width: 2, color: 0xfc8a17 });
    _x1 = x;
    _y1 = y;
    // console.log(`C${x1},${y1},${x2},${y2},${_x1},${_y1}`);
  };

  const lineTo = (x: number, y: number) => {
    graphic.lineTo(x, y).stroke({ width: 2, color: 0x524035 });
  };

  return { moveTo, bezierCurveTo, lineTo };
}
