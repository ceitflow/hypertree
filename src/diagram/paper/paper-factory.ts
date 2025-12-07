import { NodeModel } from '../graph/types.ts';
import { BitmapText, Graphics } from 'pixi.js';
import { NodeSize } from '../graph/layout/node-factory.ts';

export class PaperFactory {
  static getColor({ ref }: NodeModel) {
    let color: string;
    if (ref.type === 'directory') color = '#4f4f4f';
    else if (ref.type === 'codeFile') color = '#e24c00';
    else if (ref.type === 'otherFile') {
      color = ref.node.bigFile ? '#adad30' : '#FFFF00';
    }
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
    label.x = x + (NodeSize / 2) * Math.cos(angle);
    label.y = y + (NodeSize / 2) * Math.sin(angle);
    label.rotation = a + (doRotate ? Math.PI : 0);

    return label;
  }

  static createNode(node: NodeModel) {
    const {
      x,
      y,
      name,
      angle,
      shapePoints: { top, bottom },
    } = node;
    const color = this.getColor(node);
    const graphic = new Graphics();

    // bottom edge
    for (let i = 0; i < bottom.length; i++) {
      const point = bottom[i];
      const next = bottom[i + 1];
      if (i === 0) graphic.moveTo(point[0], point[1]);
      else if (i === bottom.length - 1) graphic.lineTo(point[0], point[1]);
      else {
        // const xc = (point[0] + next[0]) / 2;
        // const yc = (point[1] + next[1]) / 2;
        // graphic.quadraticCurveTo(point[0], point[1], xc, yc);
        graphic.lineTo(point[0], point[1]);
      }
    }

    // top edge
    for (let i = 0; i < top.length; i++) {
      const point = top[i];
      const next = top[i + 1];
      if (i === 0) graphic.lineTo(point[0], point[1]);
      if (i === top.length - 1) {
        graphic.lineTo(point[0], point[1]);
        graphic.lineTo(bottom[0][0], bottom[0][1]); // close off shape
      }
      else {
        // const xc = (point[0] + next[0]) / 2;
        // const yc = (point[1] + next[1]) / 2;
        // graphic.quadraticCurveTo(point[0], point[1], xc, yc);
        graphic.lineTo(point[0], point[1]);
      }
    }
    graphic.fill(color).stroke({ width: 0.5, alignment: 1, color: 'black', cap: 'butt' });

    graphic.x = x;
    graphic.y = y;
    graphic.rotation = angle;
    graphic.label = name;
    graphic.interactive = true;
    return graphic;
  }
}
