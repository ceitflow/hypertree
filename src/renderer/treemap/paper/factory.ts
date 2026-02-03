import {
  CodeGraphNode,
  DeclarationGraphNode,
  DirectoryGraphNode,
  GraphNode,
  GraphNodeEnum,
  OtherGraphNode,
  VirtualGraphNode
} from '../../graph';
import { PaperNode } from './types';
import { BitmapText, Graphics } from 'pixi.js';

export class Factory {
  static createLabels(node: GraphNode) {
    if (node.type === GraphNodeEnum.Directory) {
      return this.createDirLabels(node);
    } else if (node.type === GraphNodeEnum.Virtual) {
      return [];
    } else {
      const { x, y } = node.bbox;
      return [this.createLabel(x, y, 0, node.ast.name, 5)];
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

  private static createDirLabels(node: DirectoryGraphNode) {
    const result: BitmapText[] = [];
    let text = node.ast.name;
    let prefix: string;

    if (node.ast.depth !== 0) {
      const p = node.ast.id.split('/').slice(-2);
      if (p.length === 2) {
        prefix = p[0];
        text = '/' + p[1];
      } else text = p[0];
    }

    node.labelPoints.forEach((p) => {
      let prefixWidth = 0;
      const dirFontSize = Math.round(Math.sqrt(node.area) * 0.4);
      if (prefix) {
        const prefixLabel = Factory.createLabel(
          p[0],
          p[1] + dirFontSize / 6,
          p[2],
          prefix,
          (dirFontSize * 2) / 3,
          true
        );
        result.push(prefixLabel);
        prefixWidth = prefixLabel.width;
      }
      const label = Factory.createLabel(p[0] + prefixWidth, p[1], p[2], text, dirFontSize, false);
      result.push(label);
    });

    return result;
  }

  static createNode(node: GraphNode): PaperNode {
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

  private static createDirectoryNode(node: DirectoryGraphNode): PaperNode {
    const color = [
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
      '#c0c0c0'
    ][Math.min(node.ast.depth, 11)];
    const { x, y, width, height } = node.bbox;

    const graphic = new Graphics() as PaperNode;

    graphic.roundRect(0, 0, width, height, node.margin.left).fill(color);
    graphic.x = x;
    graphic.y = y;
    graphic.rotation = 0;
    graphic.label = node.ast.name;
    graphic.interactive = true;
    graphic.node = node;
    return graphic;
  }

  private static createCodeNode(node: CodeGraphNode): PaperNode {
    const { x, y, width, height } = node.bbox;
    const graphic = new Graphics() as PaperNode;
    const color = '#e24c00';

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
    return graphic;
  }

  private static createOtherNode(node: OtherGraphNode): PaperNode {
    const { x, y, width, height } = node.bbox;
    const graphic = new Graphics() as PaperNode;
    const color = node.ast.bigFile ? '#adad30' : '#d39000';

    graphic.rect(0, 0, width, height).fill(color);

    graphic.x = x;
    graphic.y = y;
    graphic.rotation = 0;
    graphic.label = node.ast.name;
    graphic.interactive = true;
    graphic.node = node;
    return graphic;
  }

  private static createDeclarationNode(node: DeclarationGraphNode): PaperNode {
    const { x, y, width, height } = node.bbox;
    const graphic = new Graphics() as PaperNode;
    const color = '#866957';

    graphic.rect(0, 0, width, height).fill(color);

    graphic.x = x;
    graphic.y = y;
    graphic.rotation = 0;
    graphic.label = node.ast.name;
    graphic.interactive = true;
    graphic.node = node;
    return graphic;
  }

  private static createVirtualNode(node: VirtualGraphNode): PaperNode {
    const { x, y, width, height } = node.bbox;
    const graphic = new Graphics() as PaperNode;
    const color = '#e4f1ff';

    graphic.rect(0, 0, width, height).stroke(color);

    graphic.x = x;
    graphic.y = y;
    graphic.rotation = 0;
    graphic.label = 'Virtual';
    graphic.interactive = true;
    graphic.node = node;
    return graphic;
  }
}
