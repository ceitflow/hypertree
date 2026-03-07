import { BBox, GraphNode, Margin, ParentType } from './types';

export type BaseOpt = {
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
