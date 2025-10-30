import { NodeModel } from '../graph/types.ts';
import { BitmapText, Graphics } from 'pixi.js';

export class PaperFactory {
  static createNode(node: NodeModel) {
    const { ref, polarX, polarY, name, angle } = node;

    let color: string;
    if (ref.type === 'directory') color = '0xafafaf';
    else if (ref.type === 'codeFile') color = '0xe24c00';
    else if (ref.type === 'otherFile') color = '0xFFFF00';
    else color = '0x277DFF';
    if (node.isEjected) color = '0x00FF00';
    if (node.isVirtual) color = '0x00FF00'; // for debugging only, not going to be part of graph

    const radius = node.radialId === node.id ? node.diameter : node.diameter / 2;
    let graphic: Graphics;
    if (node.id === node.radialId) graphic = new Graphics().circle(0, 0, node.isMainRoot ? 60 : radius).fill(color);
    else graphic = new Graphics().rect(0, 0, radius, radius * 3).fill(color);
    graphic.x = polarX;
    graphic.y = polarY;
    graphic.rotation = angle;
    graphic.label = name;
    graphic.interactive = true;
    return graphic;
  }

  static createLabel(x: number, y: number, angle: number, text: string, highlight = false) {
    const bitmapFontText = new BitmapText({
      text,
      style: {
        fontFamily: 'sans-serif',
        fontSize: highlight ? 12 : 9,
        fill: '#ffb976', // altColor ? '#ffb976' : '#f5f5f5',
      },
    });
    const adjAngle = angle + Math.PI / 2;
    bitmapFontText.anchor = adjAngle < Math.PI === !highlight ? 0 : { x: 1, y: 0 }; // if d.angle less than half circle and no children
    bitmapFontText.x = x;
    bitmapFontText.y = y + (highlight ? -6 : -6);
    bitmapFontText.angle = (adjAngle * 180) / Math.PI - 90 + (adjAngle >= Math.PI ? 180 : 0);

    return bitmapFontText;
  }

  static createLink(sourceX: number, sourceY: number, targetX: number, targetY: number): Graphics {
    const linkGraphic = new Graphics();
    const ctx = this.drawLink(linkGraphic);

    ctx.moveTo(sourceX, sourceY);
    ctx.lineTo(targetX, targetY);
    return linkGraphic;
  }

  private static drawLink(graphic: Graphics) {
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
