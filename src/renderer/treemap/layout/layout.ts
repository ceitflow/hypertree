import { NodeEnum } from '@lib/ast';
import { GraphNode } from '../../graph';
import { eachAfter, eachBefore } from '../../shared/utils';

export function Layout(root: GraphNode) {
  // 1 Loc = 1px height x 80px width
  const fileWidth = 60;
  const defaultPadding = 4;
  const targetRatio = 0.844;

  eachAfter(root, (v) => {
    const { ref, bbox, margin, padding } = v;

    switch (ref.type) {
      case NodeEnum.Declaration: {
        const isNotLast = v.parent!.children[v.parent!.children.length - 1] !== v;
        margin.bottom = v.parent!.children.length > 1 && isNotLast ? 2 : 0;
        bbox.width = fileWidth;
        bbox.height = ref.loc;
        v.area = ref.loc;
        break;
      }
      case NodeEnum.Code: {
        const m = Math.round(Math.sqrt(ref.loc) / 2);
        margin.right = m;
        margin.bottom = m / 2;
        padding.top = m;
        padding.right = defaultPadding;
        padding.bottom = defaultPadding / 2;
        padding.left = defaultPadding;

        // layout declarations in a single column
        let tempY = padding.top;
        v.children.forEach((decl) => {
          decl.bbox.x = v.padding.left;
          decl.bbox.y = tempY;
          tempY += decl.bbox.height + decl.margin.bottom;
        });

        bbox.width = fileWidth + padding.left + padding.right;
        bbox.height = tempY + padding.top + padding.bottom;
        v.area = ref.loc;
        break;
      }
      case NodeEnum.Other: {
        margin.right = 10;
        margin.bottom = 10;
        bbox.width = fileWidth;
        bbox.height = ref.loc;
        // if (child.node.bigFile) {
        //   child.layout.bbox.height = 10;
        // }
        v.area = ref.loc;
        break;
      }
      case NodeEnum.Virtual:
      case NodeEnum.Directory: {
        v.area = v.children.reduce((s, c) => s + c.area, 0);
        const m = Math.round(Math.sqrt(v.area) / 2);
        margin.right = m;
        margin.bottom = m;
        margin.left = m;
        padding.top = ref.type === NodeEnum.Directory ? m : defaultPadding;
        padding.right = defaultPadding;
        padding.bottom = defaultPadding;
        padding.left = defaultPadding;

        v.children.sort((a, b) => b.area - a.area);

        // layout in a single row
        let totalWidth = padding.left;
        let totalHeight = 0;

        v.children.forEach((child) => {
          const childM = child.margin;
          const childB = child.bbox;
          childB.x = totalWidth + childM.left;
          childB.y = padding.top + childM.top;
          totalWidth += childB.width + childM.left + childM.right;
          const height = childB.height + padding.top + childM.top + childM.bottom;
          if (height > totalHeight) totalHeight = height;
        });
        totalWidth += v.padding.right;
        totalHeight += v.padding.bottom;
        bbox.width = totalWidth;
        bbox.height = totalHeight;
        break;
      }
    }
  });

  eachBefore(root, (v) => {
    // adjusting for relative positions
    v.children.forEach((c) => {
      c.bbox.x += v.bbox.x;
      c.bbox.y += v.bbox.y;
    });
  });

  /*eachBefore(root, (v) => {
    // labels
    // if (v.ast.type === 'directory') {
    //   const margin = 4600;
    //   v.map.labelPoints.push([v.map.x, v.map.y, 0]);
    //   for (let x = margin; x < v.map.width - margin; x += margin) {
    //     v.map.labelPoints.push([v.map.x + x, v.map.y, 0]);
    //   }
    // } else {
    //   v.map.labelPoints = [[v.map.x + 10, v.map.y, 0]];
    // }
  });
}

function layoutDir(node: Directory, targetRatio: number) {
  // files layout together

  // calculate min w/h and max w/h for each container
  // foreach node calculate 2 states, 1 row and 1 column
  //  (for tall nodes just rotate them - switch width with height)

  // eachAfter - calculate min max sizes for each node AND layout node optimally (~equals given aspect ratio)
  // eachBefore - second pass do main layout, traverse up - parent nodes can only modify 25% off of children aspect ratio from ideal
  const padding = node.layout.padding;

  if (node.dirs.length && node.files.length) {
    // mixed dirs and files
    return;
  }*/
}
