import { Edge, Point, VisibilityGraph } from './edges';
import { CodeFile, DeclarationNode, Directory, IdPath, OtherFile } from '@lib/ast';

export type ParentType = GraphNode | null;
export type BBox = { x: number; y: number; width: number; height: number };
export type Margin = { top: number; bottom: number; left: number; right: number };

export type GraphModel = {
  root: DirectoryGraphNode;
  edgesRegistry: Map<IdPath, Edge[]>; // [sourceId]: GraphLink; registry of original links
};

export enum GraphNodeEnum {
  Code = 'code',
  Declaration = 'declaration',
  Other = 'other',
  Directory = 'directory',
  Virtual = 'virtual'
}

type BaseOpt = {
  parent?: ParentType;
  children?: GraphNode[];
  area?: number; // square pixels, for calculating weighted margins
  bbox?: BBox; // includes padding
  margin?: Margin; // todo make it handled by parent container, not directly applied from every node (to avoid overlapping big gaps and remove margin near parent borders)
  padding?: Margin;
  labelPoints?: [number, number, number][]; // x,y,angle
};

export class GraphNodeBase {
  public parent: ParentType;
  public children: GraphNode[];
  public area: number; // square pixels, for calculating weighted margins
  public bbox: BBox; // includes padding
  public margin: Margin;
  public padding: Margin;
  public labelPoints: [number, number, number][]; // x,y,angle

  constructor(opt: BaseOpt) {
    this.parent = opt.parent || null;
    this.children = opt.children || [];
    this.area = opt.area || 0;
    this.bbox = opt.bbox || { x: 0, y: 0, width: 0, height: 0 };
    this.margin = opt.margin || { top: 0, bottom: 0, left: 0, right: 0 };
    this.padding = opt.padding || { top: 0, bottom: 0, left: 0, right: 0 };
    this.labelPoints = opt.labelPoints || [];
  }

  getFullHeight() {
    return this.margin.top + this.bbox.height + this.margin.bottom;
  }

  getFullWidth() {
    return this.margin.left + this.bbox.width + this.margin.right;
  }

  getCorner() {
    const {x,y,width,height} = this.bbox;
    return { x: x + width, y: y + height };
  }

  fitBBoxToChildren() {
    this.bbox = this.getFitChildrenBBox();
  }

  fitSizeToChildren() {
    const { width, height } = this.getFitChildrenBBox();
    this.bbox.width = width;
    this.bbox.height = height;
  }

  private getFitChildrenBBox(): BBox {
    if (!this.children.length) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    const { padding } = this;
    const first = this.children[0];

    const getLeft = (c: GraphNode) => c.bbox.x - c.margin.left;
    const getTop = (c: GraphNode) => c.bbox.y - c.margin.top;
    const getRight = (c: GraphNode) => c.bbox.x + c.bbox.width + c.margin.right;
    const getBottom = (c: GraphNode) => c.bbox.y + c.bbox.height + c.margin.bottom;

    let minX = getLeft(first);
    let minY = getTop(first);
    let maxX = getRight(first);
    let maxY = getBottom(first);

    for (let i = 1; i < this.children.length; i++) {
      const c = this.children[i];
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
}

export class DirectoryGraphNode extends GraphNodeBase {
  readonly type = GraphNodeEnum.Directory;
  routeVisibilityGraph: VisibilityGraph = {
    // for routing edges within this directory
    rootNodeId: 0,
    vertices: new Map()
  };

  constructor(
    opt: BaseOpt,
    public ast: Directory
  ) {
    super(opt);
  }

  static create(parent: ParentType, ast: Directory) {
    return new DirectoryGraphNode({ parent, padding: { top: 10, right: 10, bottom: 10, left: 10 } }, ast);
  }
}

export class CodeGraphNode extends GraphNodeBase {
  static defaultWidth = 60;
  readonly type = GraphNodeEnum.Code;

  constructor(
    opt: BaseOpt,
    public ast: CodeFile,
    public layoutColumns = 1
  ) {
    super(opt);
  }

  static create(parent: ParentType, ast: CodeFile) {
    const m = Math.round(Math.sqrt(ast.loc));
    const padding = { top: Math.max(m, 6), bottom: 0, left: 0, right: 0 };
    return new CodeGraphNode(
      {
        parent,
        area: ast.loc,
        bbox: {
          x: 0,
          y: 0,
          width: CodeGraphNode.defaultWidth + padding.left + padding.right,
          height: ast.loc + padding.top + padding.bottom
        },
        margin: { top: 0, bottom: m, left: 0, right: m },
        padding
      },
      ast
    );
  }
}

export class OtherGraphNode extends GraphNodeBase {
  static defaultWidth = 60;
  readonly type = GraphNodeEnum.Other;

  constructor(
    opt: BaseOpt,
    public ast: OtherFile,
    public layoutColumns: number
  ) {
    super(opt);
  }

  static create(parent: ParentType, ast: OtherFile) {
    // if (ast.bigFile) bbox.height = 10;
    return new OtherGraphNode(
      {
        parent,
        area: ast.loc,
        bbox: { x: 0, y: 0, width: OtherGraphNode.defaultWidth, height: ast.loc },
        margin: { top: 0, bottom: 10, left: 0, right: 10 }
      },
      ast,
      1
    );
  }
}

export class DeclarationGraphNode extends GraphNodeBase {
  readonly type = GraphNodeEnum.Declaration;
  declare parent: CodeGraphNode;

  constructor(
    opt: BaseOpt,
    public ast: DeclarationNode,
    public isSplit = false
  ) {
    super(opt);
  }

  static create(parent: CodeGraphNode, ast: DeclarationNode) {
    return new DeclarationGraphNode(
      {
        parent,
        area: ast.loc,
        bbox: { x: 0, y: 0, width: CodeGraphNode.defaultWidth, height: ast.loc },
        margin: { top: 0, bottom: 4, left: 0, right: 0 }
      },
      ast
    );
  }

  static createFromCodeFile(file: CodeGraphNode): DeclarationGraphNode[] {
    return file.ast.exports.map((e) => DeclarationGraphNode.create(file, e));
  }
}

export class VirtualGraphNode extends GraphNodeBase {
  readonly type = GraphNodeEnum.Virtual;

  constructor(
    opt: BaseOpt,
    public isColumnWrapper: boolean
  ) {
    super(opt);
  }

  static create(parent: ParentType, isColumnWrapper: boolean) {
    return new VirtualGraphNode(
      {
        parent,
        children: [] as GraphNode[],
        area: 0,
        bbox: { x: 0, y: 0, width: 0, height: 0 },
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        labelPoints: [] as [number, number, number][]
      },
      isColumnWrapper
    );
  }
}

export type GraphNode = DirectoryGraphNode | CodeGraphNode | OtherGraphNode | DeclarationGraphNode | VirtualGraphNode;
