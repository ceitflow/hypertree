import { NodeModel } from '../graph/types.ts';
import { BitmapText, Graphics } from 'pixi.js';
import { DirBorderWidth } from '../graph/layout/node-factory.ts';

export class PaperFactory {
  static getColor({ ref }: NodeModel) {
    let color: string;
    if (ref.type === 'directory') color = '#4f4f4f';
    else if (ref.type === 'codeFile') color = '#e24c00';
    else if (ref.type === 'otherFile') {
      color = ref.node.bigFile ? '#adad30' : '#d39000';
    }
    else color = '#277DFF';
    return color;
  }

  static createLabel(x: number, y: number, angle: number, text: string, highlight = false) {
    const label = new BitmapText({
      label: text,
      text,
      zIndex: 10,
      style: {
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        fontSize: highlight ? 12 : 5,
        fill: '#ffb976',
      },
    });
    let radians = angle < 0 ? 2 * Math.PI + angle : angle;
    if (radians > Math.PI / 2 && radians < (3 / 2) * Math.PI) {
      radians += Math.PI;
      label.anchor.x = 1;
      label.anchor.y = 1;
    }
    // label.anchor = doRotate ? { x: 0, y: 0.5 } : { x: 1, y: 0.5 };
    label.x = x;
    label.y = y;
    label.rotation = radians

    return label;
  }

  static createFileGraphics(node: NodeModel) {
    const {
      x,
      y,
      name,
      angle,
      shapePoints: { top, bottom },
    } = node;
    const color = this.getColor(node);
    const graphic = new Graphics();

    /*if (!node.parent) {
      graphic.moveTo(0, 0);
      graphic.lineTo(0, node.height);
      graphic.moveTo(node.width, 0);
      graphic.lineTo(node.width, node.height / 2);
      graphic.stroke({ width: DirBorderWidth, alignment: 1, color: '#333', cap: 'butt' });
    } else*/ {
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
      for (let i = top.length - 1; i >= 0; i--) {
        const point = top[i];
        graphic.lineTo(point[0], point[1]);
        if (i === 0 && bottom.length) graphic.lineTo(bottom[0][0], bottom[0][1]); // close off shape
      }

      graphic.fill(color);
      if (node.ref.type === 'directory')
        graphic.stroke({ width: 0.5, alignment: 1, color: 'black', cap: 'butt' });
    }

    graphic.x = x;
    graphic.y = y;
    graphic.rotation = angle;
    graphic.label = name;
    graphic.interactive = true;
    return graphic;
  }
}
