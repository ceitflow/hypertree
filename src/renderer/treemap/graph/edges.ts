import { CodeFileImport, IdPath } from '@lib/ast';

export type EdgeType = {
  ast: CodeFileImport;
  source: { fileId: IdPath; declarationId?: number };
  target: { fileId: IdPath; declarationId?: number };
};

export class Edge {
  ast: CodeFileImport;
  source: { fileId: IdPath; declarationId?: number };
  target: { fileId: IdPath; declarationId?: number };

  constructor(opt: EdgeType) {
    this.ast = opt.ast;
    this.source = opt.source;
    this.target = opt.target;
  }

  static create(ast: CodeFileImport, source: IdPath, target: IdPath) {
    const opt: EdgeType = { ast, source: { fileId: source }, target: { fileId: target } };
    return new Edge(opt);
  }
}

export type Point = { x: number; y: number };

export type VisibilityNodeId = number;

export type VisibilityGraph = {
  rootNodeId: VisibilityNodeId; // rooted graph, root at the top
  vertices: Map<VisibilityNodeId, VisibilityNode>;
};

export class VisibilityNode {
  private static _id = 0;
  id: VisibilityNodeId; // unique in current directory only
  x: number; // position relative to parent
  y: number;
  edges: VisibilityEdge[];
  _debugColor: string;

  constructor(x: number, y: number, debugColor?: string) {
    this.id = VisibilityNode._id;
    VisibilityNode._id++;
    this.x = x;
    this.y = y;
    this.edges = [];
    this._debugColor = debugColor || '#FF0000';
  }

  toPoint() {
    return { x: this.x, y: this.y } as Point;
  }
}

export class VisibilityEdge {
  source: VisibilityNodeId;
  target: VisibilityNodeId;
  astEdges: Edge[]; // todo dijkstra to check which visibility nodes each edge follow

  constructor(source: VisibilityNodeId, target: VisibilityNodeId) {
    this.source = source;
    this.target = target;
    this.astEdges = [];
  }
}
