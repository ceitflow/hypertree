import { NodeModel } from '../graph/types.ts';
import { BitmapText, Graphics } from 'pixi.js';
import { NodeDiameter } from '../graph/layout/layout-factory.ts';
import { Graph } from '../graph/graph.ts';

export class PaperFactory {
  static createNode(node: NodeModel) {
    const { ref, x, y, name } = node;

    let color: string;
    if (ref.type === 'directory') color = '0xfefefe';
    else if (ref.type === 'codeFile') color = '0xe24c00';
    else if (ref.type === 'otherFile') color = '0xFFFF00';
    else color = '0x277DFF';

    const radius = node.diameter / 2;
    let graphic: Graphics;
    if (!node.parent) graphic = new Graphics().circle(0, 0, 60).stroke('#333').fill('#444');
    // else graphic = new Graphics().rect(-radius, -radius, radius * 2, radius * 2).fill(color);
    else graphic = new Graphics().circle(0, 0, radius).fill(color);
    graphic.x = x;
    graphic.y = y;
    graphic.label = name;
    graphic.interactive = true;
    return graphic;
  }

  static createDirectoryNode(node: NodeModel, graph: Graph) {
    const { x, y, name, range } = node;
    const graphDepth = graph.model!.root!.childrenDepth;
    const color = '#eaeaea';
    const width = Math.floor(graph.layout.getArmWidth(graphDepth) / graphDepth) - 8;
    let minX = range[0].spiralLength;
    let maxX = range[1].spiralLength;
    if (node.children.length <= 1) {
      minX = node.spiralLength - NodeDiameter / 2;
      maxX = node.spiralLength + NodeDiameter;
    }
    const points: [number, number][] = [];
    const out: [number, number, number] = [0, 0, 0];
    for (let L = minX; L < maxX; L += NodeDiameter) {
      graph.layout.getCartesianFromSpiralLength(graphDepth, L, node.depth, out);
      points.push([out[0], out[1]]);
    }

    const g = new Graphics();
    g.moveTo(points[0][0], points[0][1]);

    // Draw smooth curve using quadratic interpolation
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i][0] + points[i + 1][0]) / 2;
      const yc = (points[i][1] + points[i + 1][1]) / 2;
      g.quadraticCurveTo(points[i][0], points[i][1], xc, yc).stroke({ width, color, cap: 'square' });
    }

    // Draw final segment
    const last = points[points.length - 1];
    g.lineTo(last[0], last[1]).stroke({ width, color, cap: 'square' });

    g.label = name;
    g.interactive = true;
    return g;
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
    const a = angle < 0 ? 2 * Math.PI + angle : angle;
    const doRotate = a > Math.PI / 2 && a < (3 / 2) * Math.PI;
    bitmapFontText.anchor = doRotate ? { x: 0, y: 0.5 } : { x: 1, y: 0.5 };
    bitmapFontText.x = x + (NodeDiameter / 2) * Math.cos(angle);
    bitmapFontText.y = y + (NodeDiameter / 2) * Math.sin(angle);
    bitmapFontText.rotation = a + (doRotate ? Math.PI : 0);

    return bitmapFontText;
  }

  static createLink(sourceX: number, sourceY: number, targetX: number, targetY: number): Graphics {
    const linkGraphic = new Graphics();

    linkGraphic.moveTo(sourceX, sourceY);
    linkGraphic.lineTo(targetX, targetY).stroke({ width: 2, color: 0x724035 });
    return linkGraphic;
  }
}
