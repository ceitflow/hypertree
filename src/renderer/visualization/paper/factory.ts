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
    if (node.type === GraphNodeEnum.Directory) {
      const { x, y, width, height } = node.bbox;
      const dirFontSize = Math.round(Math.sqrt(node.radius) * 2);
      const text = node.parent ? node.parent['ast'].name + '/' + node.ast.name : node.ast.name;
      return [this.createLabel(x + width / 2, y + 4, 0, text, dirFontSize)];
    } else if (node.type === GraphNodeEnum.Virtual) {
      return [];
    } else {
      const { x, y, width, height } = node.bbox;
      return [this.createLabel(x + width / 2, y + height / 2, 0, node.ast.name, 5)];
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

  private static createDirectoryNode(node: DirectoryGraphNode): PaperNode[] {
    const color = !node.parent
      ? 'transparent'
      : [
          '#031623',
          '#041d2d',
          '#052437',
          '#062a40',
          '#082f49', // sky-950
          '#093a54',
          '#0a425f',
          '#0c4a6e', // sky-900
          '#0a4f66',
          '#095570',
          '#085a7a',
          '#075985', // sky-800
        ][Math.min(node.ast.depth, 11)];
    const { x, y, width, height } = node.bbox;

    const graphic = new Graphics() as PaperNode;
    // graphic.pivot.set(node.radius, node.radius);

    graphic.circle(width / 2, height / 2, node.radius).fill(color);
    // graphic.rect(0, 0, width, height).fill(color);
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
    // graphic.pivot.set(node.radius, node.radius);

    graphic.circle(width / 2, height / 2, node.radius).fill(color);
    // graphic.rect(0, 0, width, height).fill(color);

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

    graphic.circle(width / 2, height / 2, node.radius).fill(color);

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
    const graphic = new Graphics() as PaperNode;
    const color = '#ff7e5f';
    const result: PaperNode[] = [graphic];

    graphic.circle(width / 2, height / 2, node.radius).fill(color);

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
    const color = '#e4f1ff00';

    graphic.circle(width / 2, height / 2, node.radius).fill(color);

    graphic.x = x;
    graphic.y = y;
    graphic.rotation = 0;
    graphic.label = 'Virtual';
    graphic.interactive = true;
    graphic.node = node;

    return [graphic];
  }
}
