import { NodeModel } from '../graph/types.ts';
import { BitmapText, Graphics } from 'pixi.js';
import { NodeWidth } from '../graph/layout/node-factory.ts';

export class PaperFactory {
  static getColor({ ref }: NodeModel) {
    let color: string;
    if (ref.type === 'directory') color = '#4f4f4f';
    else if (ref.type === 'codeFile') color = '#e24c00';
    else if (ref.type === 'otherFile') color = '#FFFF00';
    else color = '#277DFF';
    return color;
  }

  static createRootNode(node: NodeModel) {
    const { x, y, name } = node;
    const graphic = new Graphics().circle(0, 0, 60).stroke({ color: '#724035', width: 40 }).fill('#444');
    graphic.x = x;
    graphic.y = y;
    graphic.label = name;
    graphic.interactive = true;
    return graphic;
  }

  static createLabel(x: number, y: number, angle: number, text: string, highlight = false) {
    const label = new BitmapText({
      text,
      style: {
        fontFamily: 'sans-serif',
        fontSize: highlight ? 12 : 9,
        fill: highlight ? '#ffb976' : '#f5f5f5',
      },
    });
    const a = angle < 0 ? 2 * Math.PI + angle : angle;
    const doRotate = a > Math.PI / 2 && a < (3 / 2) * Math.PI;
    label.anchor = doRotate ? { x: 0, y: 0.5 } : { x: 1, y: 0.5 };
    label.x = x + (NodeWidth / 2) * Math.cos(angle);
    label.y = y + (NodeWidth / 2) * Math.sin(angle);
    label.rotation = a + (doRotate ? Math.PI : 0);

    return label;
  }

  static createNode(node: NodeModel) {
    const { x, y, name, width, angle } = node;
    const color = this.getColor(node);
    const graphic = new Graphics().roundRect(0, 0, width, width, 4).fill(color);
    graphic.x = x;
    graphic.y = y;
    graphic.rotation = angle;
    graphic.label = name;
    graphic.interactive = true;
    return graphic;
  }

  static createDirArcNode(
    name: string,
    outerArc: [number, number][],
    innerArc: [number, number][],
    labelOrigins: [number, number, number][],
    color: string,
  ) {
    const arc = new Graphics();
    arc.moveTo(outerArc[0][0], outerArc[0][1]);

    // Draw smooth curve using quadratic interpolation
    // outer edge
    for (let i = 1; i <= outerArc.length - 2; i++) {
      const point = outerArc[i];
      const next = outerArc[i + 1];
      const xc = (point[0] + next[0]) / 2;
      const yc = (point[1] + next[1]) / 2;
      arc.quadraticCurveTo(point[0], point[1], xc, yc);
    }
    arc.lineTo(outerArc[outerArc.length - 1][0], outerArc[outerArc.length - 1][1]);
    // arc.lineTo(innerArc[innerArc.length - 1][0], innerArc[innerArc.length - 1][1]);

    // inner edge
    // arc.moveTo(outerArc[0][0], outerArc[0][1]);
    // arc.lineTo(innerArc[0][0], innerArc[0][1]);
    // for (let i = 1; i <= innerArc.length - 2; i++) {
    //   const point = innerArc[i];
    //   const next = innerArc[i + 1];
    //   const xc = (point[0] + next[0]) / 2;
    //   const yc = (point[1] + next[1]) / 2;
    //   arc.quadraticCurveTo(point[0], point[1], xc, yc);
    // }
    // arc.lineTo(innerArc[innerArc.length - 1][0], innerArc[innerArc.length - 1][1]);

    arc.stroke({ width: 1, alignment: 1, color, cap: 'butt' });

    arc.label = name;
    arc.interactive = true;

    // render continuous labels
    const labels: BitmapText[] = [];
    labelOrigins.forEach(pos => {
      labels.push(this.createLabel(pos[0], pos[1], pos[2], name, true));
    });

    return { arc, labels };
  }
}
