import { GraphNode } from '../../graph';
import { eachAfter } from '../../shared/utils';

export function Layout(root: GraphNode) {
  // 1 Loc = 1px height x 80px width
  const fileWidth = 60;
  const defaultPadding = 4;
  const targetRatio = 0.844;

  const getArea = (nodes: GraphNode[]) => {
    return nodes.reduce((sum, n) => {
      const {
        bbox: { width, height },
        margin: m,
        padding: p
      } = n;
      return sum + (width + m.left + m.right + p.left + p.right) * (height + m.top + m.bottom + p.top + p.bottom);
    }, 0);
  };

  eachAfter(root, (v) => {

    // compute margins and layout declarations in a single column
    /*v.files.forEach((child) => {
      switch (child.type) {
        case NodeEnum.Code: {
          const m = Math.round(Math.sqrt(child.loc) / 2);
          child.layout.margin = { top: 0, right: m, bottom: m / 2, left: 0 };
          child.layout.padding = { top: m, right: defaultPadding, bottom: defaultPadding / 2, left: defaultPadding };
          child.layout.bbox.width = fileWidth;
          child.layout.bbox.height = child.loc;

          let tempY = child.layout.padding.top;
          child.exports.forEach((decl) => {
            decl.layout.margin = { top: 0, right: 0, bottom: child.exports.length > 1 ? 2 : 0, left: 0 };
            decl.layout.bbox.width = fileWidth;
            decl.layout.bbox.height = decl.loc;
            decl.layout.bbox.x = child.layout.padding.left;
            decl.layout.bbox.y = tempY;
            tempY += decl.layout.bbox.height + decl.layout.margin.bottom;
          });
          break;
        }
        case NodeEnum.Other: {
          child.layout.margin = { top: 0, right: 10, bottom: 10, left: 0 };
          child.layout.bbox.width = fileWidth;
          child.layout.bbox.height = Math.ceil(child.loc / fileWidth);
          // if (child.node.bigFile) {
          //   child.layout.bbox.height = 10;
          // }
          break;
        }
      }
    });

    v.layout.treeMapValue = 1;
    v.children.forEach(c => (v.map.treeMapValue += c.map.treeMapValue));
    const m = margin(v);
    v.map.margin = { top: 0, right: m, bottom: m, left: m };
    v.map.padding = { top: m, right: defaultPadding, bottom: defaultPadding, left: defaultPadding };
    if (!v.children.length) {
      v.map.width = fileWidth;
      v.map.height = fileWidth;
    }

    if (v.files.length) {
      // files are grouped together
      v.files.sort((a, b) => b.loc - a.loc);
      v.layoutGroups.push({
        nodes: v.files,
        area: getArea(v.files)
      });
    }

    v.dirs.forEach((child) => {
      // every dir gets its own group
      v.layoutGroups.push({
        nodes: [child],
        area: getArea([child])
      });
    });

    if (!v.layoutGroups.length) {
      v.layout.bbox.width = fileWidth;
      v.layout.bbox.height = fileWidth;
      return;
    }

    v.layoutGroups.sort((a, b) => b.area - a.area);

    // 1. layout in a single row first
    let totalWidth = v.layout.padding.left;
    let totalHeight = 0;

    v.layoutGroups.forEach((group) => {
      group.nodes.forEach((child) => {
        const margin = child.layout.margin;
        child.layout.bbox.x = totalWidth + margin.left;
        child.layout.bbox.y = v.layout.padding.top + margin.top;
        totalWidth += child.layout.bbox.width + margin.left + margin.right;
        const height = child.layout.bbox.height + v.layout.padding.top + margin.top + margin.bottom;
        if (height > totalHeight) totalHeight = height;
      });
    });
    totalWidth += v.layout.padding.right;
    totalHeight += v.layout.padding.bottom;
    v.layout.bbox.width = totalWidth;
    v.layout.bbox.height = totalHeight;*/
  });

  // 2. layout second pass
  /*eachBefore(root, (dir) => {
    // adjusting for relative positions
    for (const group of dir.layoutGroups) {
      group.nodes.forEach((n) => {
        n.layout.bbox.x += dir.layout.bbox.x;
        n.layout.bbox.y += dir.layout.bbox.y;
      });
    }
  });*/

  /*
  eachBefore(root, (v) => {
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
