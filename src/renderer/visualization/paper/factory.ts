import {
  CodeGraphNode,
  DeclarationGraphNode,
  DirectoryGraphNode,
  GraphNode,
  GraphNodeEnum,
  OtherGraphNode,
  VirtualGraphNode
} from '../graph';
import { PaperNode } from './types';
import { BitmapText, Graphics } from 'pixi.js';

export class Factory {
  static createLabels(node: GraphNode) {
    switch (node.type) {
      case GraphNodeEnum.Directory: {
        const { x, y, width, height } = node.bbox;
        const dirFontSize = Math.max(node.margin / 2, 16);
        const text = node.parent ? node.parent['ast'].name + '/' + node.ast.name : node.ast.name;
        return [this.createLabel(x + width / 2, y, 0, text, dirFontSize)];
      }

      case GraphNodeEnum.Virtual: {
        return [];
      }

      case GraphNodeEnum.Code: {
        const { x, y, width, height } = node.bbox;
        const fontSize = 24;
        return [this.createLabel(x + width / 2, y, 0, node.ast.name, fontSize)];
      }

      case GraphNodeEnum.Other: {
        const { x, y, width, height } = node.bbox;
        const fontSize = 20;
        return [this.createLabel(x + width / 2, y + height / 2, 0, node.ast.name, fontSize)];
      }

      case GraphNodeEnum.Declaration: {
        const { x, y, width, height } = node.bbox;
        const fontSize = 20;
        return [this.createLabel(x + width / 2, y + height / 2, 0, node.ast.name, fontSize)];
      }
    }
  }

  private static createLabel(x: number, y: number, angle: number, text: string, fontSize: number, dim = false) {
    const label = new BitmapText({
      label: text,
      text,
      zIndex: 10,
      style: {
        fontFamily: 'sans-serif',
        fontWeight: dim ? 'normal' : 'bold',
        fontSize,
        fill: dim ? '#bbbbbb' : '#ffffff'
      }
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

  static createLinks(node: GraphNode): Graphics[] {
    const { x, y, width, height } = node.bbox;
    const px = x + width / 2;
    const py = y + height / 2;
    const links: Graphics[] = [];
    for (const child of node.children) {
      const cx = child.bbox.x + child.bbox.width / 2;
      const cy = child.bbox.y + child.bbox.height / 2;
      const line = new Graphics({ eventMode: 'none' });
      line.moveTo(px, py).lineTo(cx, cy).stroke({ width: 1, color: '#888888' });
      links.push(line);
    }
    return links;
  }

  static createNode(node: GraphNode): PaperNode[] {
    switch (node.type) {
      case GraphNodeEnum.Directory:
        return this.createDirectoryNode(node);
      case GraphNodeEnum.Code:
        return this.createCodeNode(node);
      case GraphNodeEnum.Other:
        return this.createOtherNode(node);
      case GraphNodeEnum.Declaration:
        return this.createDeclarationNode(node);
      case GraphNodeEnum.Virtual:
        return this.createVirtualNode(node);
    }
  }

  private static directoryDepthColor(depth: number): string {
    const d = Math.min(Math.max(depth, 0), 11);
    const hue = 185 + d * 24;
    const sat = 52;
    const light = 14 + d * 11;
    return `hsl(${hue}, ${sat}%, ${light}%)`;
  }

  private static createDirectoryNode(node: DirectoryGraphNode): PaperNode[] {
    const color = this.directoryDepthColor(node.ast.depth);
    const { x, y, width, height } = node.bbox;

    const graphic = new Graphics() as PaperNode;

    graphic.rect(0, 0, width, height).fill(color);
    // graphic.circle(node.radius, node.radius, node.radius).fill(color);

    graphic.x = x;
    graphic.y = y;
    graphic.rotation = 0;
    graphic.label = node.ast.name;
    graphic.interactive = true;
    graphic.node = node;
    return [graphic];
  }

  private static createCodeNode(node: CodeGraphNode): PaperNode[] {
    const { x, y, width, height } = node.bbox;
    const graphic = new Graphics() as PaperNode;
    const color = '#4499ce';

    // graphic.circle(width / 2, height / 2, node.radius).fill(color);
    graphic.rect(0, 0, width, height).fill(color);

    if (node.ast.kind === 'JS') {
      graphic.stroke({
        width: 10,
        alignment: 1,
        color: 'gold',
        cap: 'butt'
      });
    }
    graphic.x = x;
    graphic.y = y;
    graphic.rotation = 0;
    graphic.label = node.ast.name;
    graphic.interactive = true;
    graphic.node = node;
    return [graphic];
  }

  private static createOtherNode(node: OtherGraphNode): PaperNode[] {
    const { x, y, width, height } = node.bbox;
    const graphic = new Graphics() as PaperNode;
    const color = '#7990a6'; // node.ast.bigFile ? '#adad30' : '#d39000';

    // graphic.circle(width / 2, height / 2, node.radius).fill(color);
    graphic.rect(0, 0, width, height).fill(color);

    graphic.x = x;
    graphic.y = y;
    graphic.rotation = 0;
    graphic.label = node.ast.name;
    graphic.interactive = true;
    graphic.node = node;
    return [graphic];
  }

  private static createDeclarationNode(node: DeclarationGraphNode): PaperNode[] {
    const { x, y, width, height } = node.bbox;
    const parent = node.parent;
    const graphic = new Graphics() as PaperNode;
    const result: PaperNode[] = [graphic];

    graphic.rect(0, 0, width, height).fill('#ff7e5f');

    // const pcx = parent.bbox.x + parent.bbox.width / 2;
    // const pcy = parent.bbox.y + parent.bbox.height / 2;
    // const mask = new Graphics({ eventMode: 'none' });
    // mask.circle(pcx - x, pcy - y, parent.radius).fill('white');
    // graphic.addChild(mask);
    // graphic.mask = mask;

    graphic.x = x;
    graphic.y = y;
    graphic.rotation = 0;
    graphic.label = node.ast.name;
    graphic.interactive = true;
    graphic.node = node;
    return result;
  }

  private static createVirtualNode(node: VirtualGraphNode): PaperNode[] {
    const { x, y, width, height } = node.bbox;
    const graphic = new Graphics() as PaperNode;
    const color = node.isHeader ? this.directoryDepthColor(node.depth) : '#ff000088';

    // graphic.circle(width / 2, height / 2, node.radius).fill(color);
    graphic.rect(0, 0, width, height).fill(color);

    graphic.x = x;
    graphic.y = y;
    graphic.rotation = 0;
    graphic.label = 'Virtual';
    graphic.interactive = true;
    graphic.node = node;

    return [graphic];
  }
}
