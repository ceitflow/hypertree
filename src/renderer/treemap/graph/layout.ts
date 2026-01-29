import { Directory } from '@lib/ast';
import { eachAfter, eachBefore } from '../../shared/utils';

export function Treemap(root: Directory) {
  // 1 Loc = 1px height x 80px width
  const margin = (v: NodeModel) => Math.round(Math.sqrt(v.map.treeMapValue) / 2);

  const fileWidth = 60;
  const defaultPadding = 4;
  const targetRatio = 0.844;

  // calculate treeMapValues
  eachAfter(root, v => {
    switch (v.ast.type) {
      case 'codeFile': {
        v.map.treeMapValue = Math.max(v.ast.node.loc, 1);
        const m = margin(v);
        v.map.margin = { top: 0, right: m, bottom: m / 2, left: 0 };
        v.map.padding = { top: m, right: defaultPadding, bottom: defaultPadding / 2, left: defaultPadding };
        v.map.width = fileWidth;
        v.map.height = v.map.treeMapValue;
        break;
      }
      case 'otherFile': {
        v.map.treeMapValue = Math.max(v.ast.node.loc, 1);
        // if (v.ref.node.bigFile) {
        //   v.map.treeMapValue = 10;
        // }
        v.map.margin = { top: 0, right: 10, bottom: 10, left: 0 };
        v.map.width = fileWidth;
        v.map.height = Math.ceil(v.map.treeMapValue / fileWidth);
        break;
      }
      case 'declaration': {
        v.map.treeMapValue = Math.max(v.ast.node.loc, 1);
        v.map.margin = { top: 0, right: 0, bottom: v.parent!.children.length > 1 ? 2 : 0, left: 0 };
        v.map.width = fileWidth;
        v.map.height = v.map.treeMapValue;
        break;
      }
      case 'directory': {
        v.map.treeMapValue = 1;
        v.children.forEach(c => (v.map.treeMapValue += c.map.treeMapValue));
        const m = margin(v);
        v.map.margin = { top: 0, right: m, bottom: m, left: m };
        v.map.padding = { top: m, right: defaultPadding, bottom: defaultPadding, left: defaultPadding };
        if (!v.children.length) {
          v.map.width = fileWidth;
          v.map.height = fileWidth;
        }
        break;
      }
    }
    if (v.children.length) {
      v.childrenDepth = v.children.reduce((a, b) => Math.max(a, b.childrenDepth + 1), 0);
    }
  });

  // rect packing
  eachAfter(root, v => {
    if (!v.children.length) {
      return;
    }
    // todo build new tree, bins. Use virtual groupings to bind files together

    customRectPack(v, targetRatio);
  });

  root.map.x = 0;
  root.map.y = 0;

  eachBefore(root, v => {
    // adjusting for relative positions
    for (const child of v.children) {
      child.map.x += v.map.x;
      child.map.y += v.map.y;
    }

    v.map.x -= Math.round(root.map.width / 2); // center for zoom to fit function
    v.map.y -= Math.round(root.map.height / 2);

    // labels
    if (v.ast.type === 'directory') {
      const margin = 4600;
      v.map.labelPoints.push([v.map.x, v.map.y, 0]);
      for (let x = margin; x < v.map.width - margin; x += margin) {
        v.map.labelPoints.push([v.map.x + x, v.map.y, 0]);
      }
    } else {
      v.map.labelPoints = [[v.map.x + 10, v.map.y, 0]];
    }
  });
}

type RectLayout = {
  rects: {
    children: NodeModel[]; // if dir then it is single child
  }[]
}

function customRectPack(node: NodeModel, targetRatio: number) {
  // todo create bin here, group files

  // files layout together

  // calculate min w/h and max w/h for each container
  // foreach node calculate 2 states, 1 row and 1 column
  //  (for tall nodes just rotate them - switch width with height)

  // eachAfter - calculate min max sizes for each node AND layout node optimally (~equals given aspect ratio)
  // eachBefore - second pass do main layout, traverse up - parent nodes can only modify 25% off of children aspect ratio from ideal

  const padding = node.map.padding;
  const isCodeFile = node.ast.type === 'codeFile';

  if (isCodeFile) {
    // layout declarations in codefile into single column
    let tempY = padding.top;
    node.children.forEach(c => {
      c.map.x = padding.left;
      c.map.y = tempY;
      tempY += c.map.height + c.map.margin.bottom;
    });
    node.map.width += padding.left + padding.right;
    node.map.height = tempY + padding.bottom;
    return;
  }

  const dirCount = node.children.reduce((a, b) => a + (b.ast.type === 'directory' ? 1 : 0), 0);

  if (dirCount !== node.children.length) {
    // mixed dirs and files

  }

  node.children.sort((a, b) => b.map.treeMapValue - a.map.treeMapValue);

  // 1. layout in a single row first
  let totalWidth = padding.left;
  let totalHeight = 0;
  node.children.forEach(v => {
    const margin = v.map.margin;
    v.map.x = totalWidth + margin.left;
    v.map.y = padding.top + margin.top;
    totalWidth += v.map.width + margin.left + margin.right;
    if (v.map.height + padding.top + margin.top + margin.bottom > totalHeight) totalHeight = v.map.height + padding.top + margin.top + margin.bottom;
  });
  totalWidth += padding.right;
  totalHeight += padding.bottom;

  let currentRatio = totalHeight / totalWidth;
  const isValidRatio = (r: number) => Math.abs(targetRatio - r) / targetRatio <= 0.1;

  // todo edge cases, like 1 or 2 nodes only
  while (!isValidRatio(currentRatio)){
    console.log(node.name, currentRatio)
    if (currentRatio > targetRatio) {
      // too tall, squash leftmost

    }
    else {
      // too wide, stack columns rightmost first

    }
    currentRatio = targetRatio;
  }

  node.map.width = totalWidth;
  node.map.height = totalHeight;
}
