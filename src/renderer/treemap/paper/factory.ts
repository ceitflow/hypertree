import { BitmapText, Graphics } from 'pixi.js';
import { IdPath, NodeModel } from '../../common/types.ts';
import { PaperNode } from './types.ts';

export class Factory {
  static getColor(id: IdPath, ref: NodeModel['ast'], depth: number) {
    let color: string;
    if (ref.type === 'directory') {
      const greyShades = [
        '#333333',
        '#404040',
        '#4d4d4d',
        '#595959',
        '#666666',
        '#737373',
        '#808080',
        '#8c8c8c',
        '#999999',
        '#a6a6a6',
        '#b3b3b3',
        '#c0c0c0',
      ];
      color = greyShades[Math.min(depth, 11)];
    } else if (ref.type === 'codeFile') {
      color = '#e24c00';
    } else if (ref.type === 'otherFile') {
      color = ref.node.bigFile ? '#adad30' : '#d39000';
    } else color = '#866957';
    // if (depth && ref.type==='directory' && id.includes('test')) color = '#00ff00'
    return color;
  }

  static createLabel(x: number, y: number, angle: number, text: string, fontSize: number, dim = false) {
    const label = new BitmapText({
      label: text,
      text,
      zIndex: 10,
      style: {
        fontFamily: 'sans-serif',
        fontWeight: dim ? 'normal' : 'bold',
        fontSize,
        fill: dim ? '#bbbbbb': '#ffffff',
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
    label.rotation = radians;

    return label;
  }

  static createNode(node: NodeModel, totalDepth: number): PaperNode {
    const {
      name,
      map: { x, y, width, height },
    } = node;
    const color = this.getColor(node.id, node.ast, node.depth);
    const graphic = new Graphics() as PaperNode;
    const isDir = node.ast.type === 'directory';

    graphic.roundRect(0, 0, width, height, isDir ? node.map.margin.left : 0).fill(color);

    if (node.ast.type === 'codeFile' && node.ast.node.kind === 'JS') {
      graphic.stroke({
        width: totalDepth - node.depth + 1,
        alignment: 1,
        color: 'gold',
        cap: 'butt',
      });
    }

    graphic.x = x;
    graphic.y = y;
    graphic.rotation = 0;
    graphic.label = name;
    graphic.interactive = true;
    graphic.node = node;
    return graphic;
  }
}
