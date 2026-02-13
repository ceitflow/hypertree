import { AspectRatioLayout } from './aspect-ratio-layout';
import { eachAfter, eachBefore } from '../../../../shared/utils';
import { DeclarationGraphNode, GraphNode, GraphNodeEnum } from '../../index';

export class NodeLayout {
  private static targetRatio = 0.844;

  static init(root: GraphNode) {
    eachAfter(root, (v) => {
      const { type, bbox, margin, padding, children } = v;

      switch (type) {
        case GraphNodeEnum.Code: {
          // layout declarations in a single column
          let tempY = padding.top;
          let marginsAddition = 0; // margins of declarations used to adjust height of code file

          children.forEach((d) => {
            const decl = d as DeclarationGraphNode;
            decl.bbox.x = padding.left;
            decl.bbox.y = tempY;
            tempY += decl.bbox.height + decl.margin.bottom;
            marginsAddition += decl.margin.bottom;
          });

          bbox.height += marginsAddition;
          break;
        }
        case GraphNodeEnum.Virtual:
        case GraphNodeEnum.Directory: {
          v.area = children.reduce((s, c) => s + c.area, 0);

          if (type === GraphNodeEnum.Directory) {
            const m = Math.round(Math.sqrt(v.area));
            margin.right = m;
            margin.bottom = m;
            margin.left = m;
            padding.top = m;
          }
          // TODO inverse margin (large get small, small get large)
          // todo polygon bboxes, will allow more compact layout
          // children.sort((a, b) => b.area - a.area);

          // layout in a single row
          let totalWidth = padding.left;
          let totalHeight = 0;

          children.forEach((child) => {
            child.bbox.x = totalWidth + child.margin.left;
            child.bbox.y = padding.top + child.margin.top;
            totalWidth += child.getFullWidth();
            const height = child.getFullHeight();
            if (height > totalHeight) {
              totalHeight = height;
            }
          });
          totalWidth += padding.right;
          totalHeight += padding.top + padding.bottom;
          bbox.width = totalWidth;
          bbox.height = totalHeight;

          new AspectRatioLayout(v, this.targetRatio);
          break;
        }
      }
    });

    root.bbox.x = 0;
    root.bbox.y = 0;
    eachBefore(root, (v) => {
      // adjusting for relative positions
      v.children.forEach((c) => {
        c.bbox.x += v.bbox.x;
        c.bbox.y += v.bbox.y;
      });

      if (v.type === GraphNodeEnum.Directory) {
        const margin = 1000;
        for (let x = v.margin.left + v.padding.left; x < v.bbox.width; x += margin) {
          v.labelPoints.push([v.bbox.x + x, v.bbox.y, 0]);
        }
      }
    });
  }
}
