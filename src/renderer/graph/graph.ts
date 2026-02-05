import {
  BBox,
  CodeGraphNode,
  DeclarationGraphNode,
  DirectoryGraphNode,
  GraphModel,
  GraphNode,
  GraphNodeEnum,
  OtherGraphNode,
  ParentType,
  VirtualGraphNode
} from './graph.type';
import mitt from 'mitt';
import { CodeFile, DeclarationNode, Directory, NodeEnum, OtherFile } from '@lib/ast';

export class Graph {
  model: GraphModel;
  // 1 Loc = 1px height x 80px width
  // padding is included in bbox
  static fileWidth = 60;
  static defaultPadding = 4;
  readonly emit = mitt<{ select: null }>();

  constructor(astRoot: Directory) {
    const root = this.createGraphNodes(astRoot);

    this.model = {
      root
    };
  }

  static createDirectoryNode(ast: Directory, parent: ParentType): DirectoryGraphNode {
    return {
      parent,
      children: [] as GraphNode[],
      area: 0,
      bbox: { x: 0, y: 0, width: 0, height: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      padding: { top: 0, bottom: this.defaultPadding, left: this.defaultPadding, right: this.defaultPadding },
      labelPoints: [] as [number, number, number][],
      type: GraphNodeEnum.Directory,
      ast
    };
  }

  static createCodeNode(ast: CodeFile, parent: ParentType): CodeGraphNode {
    const m = Math.round(Math.sqrt(ast.loc) / 2);
    const padding = { top: m * 2, bottom: 0, left: 0, right: 0 };
    return {
      parent,
      children: [] as GraphNode[],
      area: ast.loc,
      bbox: {
        x: 0,
        y: 0,
        width: this.fileWidth + padding.left + padding.right,
        height: ast.loc + padding.top + padding.bottom
      },
      margin: { top: 0, bottom: m, left: 0, right: m },
      padding,
      labelPoints: [] as [number, number, number][],
      type: GraphNodeEnum.Code,
      ast,
      layoutColumns: 1
    };
  }

  static createOtherNode(ast: OtherFile, parent: ParentType): OtherGraphNode {
    // if (ast.bigFile) bbox.height = 10;
    return {
      parent,
      children: [] as GraphNode[],
      area: ast.loc,
      bbox: { x: 0, y: 0, width: this.fileWidth, height: ast.loc },
      margin: { top: 0, bottom: 10, left: 0, right: 10 },
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
      labelPoints: [] as [number, number, number][],
      type: GraphNodeEnum.Other,
      ast,
      layoutColumns: 1
    };
  }

  static createDeclarationNode(ast: DeclarationNode, parent: CodeGraphNode): DeclarationGraphNode {
    return {
      parent,
      children: [] as GraphNode[],
      area: ast.loc,
      bbox: { x: 0, y: 0, width: this.fileWidth, height: ast.loc },
      margin: { top: 0, bottom: 2, left: 0, right: 0 },
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
      labelPoints: [] as [number, number, number][],
      type: GraphNodeEnum.Declaration,
      ast,
      isSplit: false
    };
  }

  static createVirtualNode(isColumnWrapper: boolean, parent: ParentType): VirtualGraphNode {
    return {
      parent,
      children: [] as GraphNode[],
      area: 0,
      bbox: { x: 0, y: 0, width: 0, height: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
      labelPoints: [] as [number, number, number][],
      type: GraphNodeEnum.Virtual,
      isColumnWrapper
    };
  }

  static fitBBoxToChildren(node: GraphNode) {
    node.bbox = this.getFitChildrenBBox(node);
  }

  static fitSizeToChildren(node: GraphNode) {
    const { width, height } = this.getFitChildrenBBox(node);
    node.bbox.width = width;
    node.bbox.height = height;
  }

  private static getFitChildrenBBox(node: GraphNode): BBox {
    if (!node.children.length) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    const { padding } = node;
    const first = node.children[0];

    const getLeft = (c: GraphNode) => c.bbox.x - c.margin.left;
    const getTop = (c: GraphNode) => c.bbox.y - c.margin.top;
    const getRight = (c: GraphNode) => c.bbox.x + c.bbox.width + c.margin.right;
    const getBottom = (c: GraphNode) => c.bbox.y + c.bbox.height + c.margin.bottom;

    let minX = getLeft(first);
    let minY = getTop(first);
    let maxX = getRight(first);
    let maxY = getBottom(first);

    for (let i = 1; i < node.children.length; i++) {
      const c = node.children[i];
      minX = Math.min(minX, getLeft(c));
      minY = Math.min(minY, getTop(c));
      maxX = Math.max(maxX, getRight(c));
      maxY = Math.max(maxY, getBottom(c));
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + padding.left + padding.right,
      height: maxY - minY + padding.top + padding.bottom
    };
  }

  static getFullHeight(n: GraphNode) {
    return n.margin.top + n.bbox.height + n.margin.bottom;
  }

  static getFullWidth(n: GraphNode) {
    return n.margin.left + n.bbox.width + n.margin.right;
  }

  private createGraphNodes(root: Directory): GraphNode {
    const rootNode = Graph.createDirectoryNode(root, null);

    const stack: { dir: Directory; parentNode: GraphNode }[] = [{ dir: root, parentNode: rootNode }];

    while (stack.length > 0) {
      const { dir, parentNode } = stack.pop()!;

      for (const subdir of dir.dirs) {
        const dirNode = Graph.createDirectoryNode(subdir, parentNode);
        parentNode.children.push(dirNode);
        stack.push({ dir: subdir, parentNode: dirNode });
      }

      if (dir.files.length > 0) {
        const virtualNode = Graph.createVirtualNode(false, parentNode);

        for (const file of dir.files) {
          let fileNode: GraphNode;
          if (file.type === NodeEnum.Code) {
            fileNode = Graph.createCodeNode(file, virtualNode);
            fileNode.children = Graph.createFileDeclarations(fileNode);
          } else {
            fileNode = Graph.createOtherNode(file, virtualNode);
          }
          virtualNode.children.push(fileNode);
        }
        parentNode.children.push(virtualNode);
      }
    }
    return rootNode;
  }

  static createFileDeclarations(file: GraphNode): DeclarationGraphNode[] {
    if (file.type !== GraphNodeEnum.Code) {
      return [];
    }
    return file.ast.exports.map((e) => Graph.createDeclarationNode(e, file));
  }

  static getFullFileNodeHeight(node: CodeGraphNode | OtherGraphNode) {
    const margins = this.createFileDeclarations(node).reduce((a, b) => a + b.margin.top + b.margin.bottom, 0);
    return node.ast.loc + node.padding.top + node.padding.bottom + margins;
  }
}
