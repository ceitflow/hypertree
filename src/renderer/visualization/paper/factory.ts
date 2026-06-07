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
import { BitmapText, CanvasTextMetrics, Graphics, TextStyle } from 'pixi.js';

export class Factory {
  static createLabels(node: GraphNode) {
    if (!node.name) return [];

    switch (node.type) {
      case GraphNodeEnum.Directory: {
        const { x, y, width } = node.bbox;
        const text = node.parent ? node.parent.name + '/' + node.name : node.name;
        const maxTextWidth = width - node.padding * 2;
        const dirFontSize = this.fitFontSize(text, Math.max(Math.round(Math.sqrt(node.area)), 120), maxTextWidth);
        return [this.createLabel(x + node.padding, y, 0, text, dirFontSize, maxTextWidth)];
      }

      case GraphNodeEnum.Virtual: {
        const { x, y, width, height } = node.bbox;
        const fontSize = 24;
        return [this.createLabel(x, y, 0, node.name, fontSize, width)];
      }

      case GraphNodeEnum.Code: {
        const { x, y, width, height } = node.bbox;
        const fontSize = 24;
        return [this.createLabel(x, y, 0, node.name, fontSize, width)];
      }

      case GraphNodeEnum.Other: {
        const { x, y, width, height } = node.bbox;
        const fontSize = 20;
        return [this.createLabel(x, y, 0, node.name, fontSize, width)];
      }

      case GraphNodeEnum.Declaration: {
        const { x, y, width, height } = node.bbox;
        const fontSize = 20;
        return [this.createLabel(x, y, 0, node.name, fontSize, width)];
      }
    }
  }

  private static createLabel(x: number, y: number, angle: number, text: string, fontSize: number, maxWidth: number) {
    const label = new BitmapText({
      label: text,
      text,
      zIndex: 10,
      style: {
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        fontSize,
        fill: '#ffffff',
        ...(maxWidth && maxWidth > 0
          ? { wordWrap: true, wordWrapWidth: maxWidth, breakWords: true, align: 'center' as const }
          : {})
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

  private static fitFontSize(text: string, fontSize: number, maxWidth: number): number {
    if (!text || maxWidth <= 0) return fontSize;
    const style = new TextStyle({ fontFamily: 'sans-serif', fontWeight: 'bold', fontSize });
    const { width } = CanvasTextMetrics.measureText(text, style, undefined, false);
    if (width <= maxWidth) return fontSize;
    return Math.max(1, Math.floor(fontSize * (maxWidth / width)));
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
    let result: PaperNode[] = [];

    switch (node.type) {
      case GraphNodeEnum.Directory:
        result = this.createDirectoryNode(node);
        break;
      case GraphNodeEnum.Code:
        result = this.createCodeNode(node);
        break;
      case GraphNodeEnum.Other:
        result = this.createOtherNode(node);
        break;
      case GraphNodeEnum.Declaration:
        result = this.createDeclarationNode(node);
        break;
      case GraphNodeEnum.Virtual:
        result = this.createVirtualNode(node);
        break;
    }

    if (node.header) {
      // todo render additional data
    }
    return result;
  }

  private static directoryDepthColor(depth: number): string {
    const firstBand = 8;
    if (depth <= firstBand) {
      // blue/teal palette for the first 12 depth levels (0-11)
      const d = depth;
      const hue = 185 + d * 24;
      const sat = 52;
      const light = 14 + d * 9;
      return `hsl(${hue}, ${sat}%, ${light}%)`;
    }
    // yellow palette for depths beyond first one
    const d = depth - firstBand;
    const hue = 20 + d * 2;
    const sat = 70;
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
    graphic.label = node.name;
    graphic.interactive = true;
    graphic.node = node;
    return [graphic];
  }

  private static createCodeNode(node: CodeGraphNode): PaperNode[] {
    const { x, y, width, height } = node.bbox;
    const { linesShape, loc } = node.ast;
    const headerHeight = node.header?.bbox.height || 0;
    const graphic = new Graphics() as PaperNode;

    graphic.rect(0, 0, width, height).fill('#07256177');
    // graphic.addChild(this.createLinesShapeGraphic(headerHeight, width, height - headerHeight, linesShape, loc));

    if (node.ast.kind === 'JS') {
      graphic.rect(0, 0, width, height).stroke({
        width: 10,
        alignment: 1,
        color: 'gold',
        cap: 'butt'
      });
    }
    graphic.x = x;
    graphic.y = y;
    graphic.rotation = 0;
    graphic.label = node.name;
    graphic.interactive = true;
    graphic.node = node;
    return [graphic];
  }

  private static createLinesShapeGraphic(
    y: number,
    width: number,
    height: number,
    linesShape: number[],
    loc: number
  ): Graphics {
    const shape = new Graphics({ eventMode: 'none' });
    shape.y = y;

    let maxCol = 1;
    for (let i = 1; i < linesShape.length; i += 2) {
      maxCol = Math.max(maxCol, linesShape[i]);
    }

    const sx = width / maxCol;
    const lineH = height / loc;

    for (let line = 0; line < loc; line++) {
      const start = linesShape[line * 2] ?? 0;
      const end = linesShape[line * 2 + 1] ?? 0;
      if (end <= start) continue;
      shape.rect(start * sx, line * lineH, (end - start) * sx, lineH);
    }
    shape.fill('#4499ce');

    return shape;
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
    graphic.label = node.name;
    graphic.interactive = true;
    graphic.node = node;
    return [graphic];
  }

  private static createDeclarationNode(node: DeclarationGraphNode): PaperNode[] {
    const { x, y, width, height } = node.bbox;
    const parent = node.parent;
    const graphic = new Graphics() as PaperNode;
    const result: PaperNode[] = [graphic];
    const color = node.ast.token.category === 'unknown' ? '#ff0000' : '#ff7e5f';

    graphic.rect(0, 0, width, height).fill(color);

    graphic.x = x;
    graphic.y = y;
    graphic.rotation = 0;
    graphic.label = node.name;
    graphic.interactive = true;
    graphic.node = node;
    return result;
  }

  private static createVirtualNode(node: VirtualGraphNode): PaperNode[] {
    const { x, y, width, height } = node.bbox;
    const graphic = new Graphics() as PaperNode;
    const color = 'transparent'; //node.isHeader ? this.directoryDepthColor(node.depth) : '#ff000088';

    // graphic.circle(width / 2, height / 2, node.radius).fill(color);
    graphic.rect(0, 0, width, height).fill(color);

    graphic.x = x;
    graphic.y = y;
    graphic.rotation = 0;
    graphic.label = 'Virtual';
    graphic.interactive = !node.isHeader;
    graphic.node = node;

    return [graphic];
  }
}
