import { NodeModel } from '../graph/types.ts';
import { BitmapText, Graphics } from 'pixi.js';
import { Graph } from '../graph/graph.ts';

export class PaperFactory {
  static createCircle(model: NodeModel, graph: Graph) {
    const { ref, polarX, polarY, name } = model;

    let color: string;
    if (ref.type === 'directory') color = '0xcfcfcf';
    else if (ref.type === 'file') color = '0xe24c00';
    else color = '0x277DFF';
    if (model.isEjected) color = '0x00FF00';
    if (model.isVirtual) color = '0x00FF00'; // for debugging only, not going to be part of graph

    const isRoot = model.radialId === model.id;
    const circle = new Graphics().circle(0, 0, isRoot ? 30 : 6).fill(color);
    circle.x = polarX;
    circle.y = polarY;
    circle.label = name;
    circle.interactive = true;
    circle.on('pointerdown', e => console.log(`w: ${model.totalWidth}`, model, graph.model!.radialsMap.get(model.radialId)));
    return circle;
  }

  static createLabel({ polarX, polarY, angle, name, ref }: NodeModel) {
    const isDir = ref.type === 'directory';
    const bitmapFontText = new BitmapText({
      text: `   ${name.substring(0)}     `,
      style: {
        fontFamily: 'sans-serif',
        fontSize: isDir ? 12 : 9,
        fill: '#ffb976', // altColor ? '#ffb976' : '#f5f5f5',
      },
    });
    const adjAngle = angle + Math.PI / 2;
    bitmapFontText.anchor = adjAngle < Math.PI === !isDir ? 0 : { x: 1, y: 0 }; // if d.angle less than half circle and no children
    bitmapFontText.x = polarX;
    bitmapFontText.y = polarY + (isDir ? -6 : -6);
    bitmapFontText.angle = (adjAngle * 180) / Math.PI - 90 + (adjAngle >= Math.PI ? 180 : 0);

    return bitmapFontText;
  }

  static createLink(sourceX: number, sourceY: number, targetX: number, targetY: number): Graphics {
    const linkGraphic = new Graphics();
    const ctx = this.context(linkGraphic);

    ctx.moveTo(sourceX, sourceY);
    ctx.lineTo(targetX, targetY);
    return linkGraphic;
  }

  private static context(graphic: Graphics) {
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
}
