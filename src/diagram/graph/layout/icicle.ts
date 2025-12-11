import { NodeModel } from '../types.ts';
import { eachAfter, eachBefore } from './tidy-tree.ts';
import { DirBorderWidth, DirPadding, NodePadding, NodeSize, SpiralArmWidth } from './node-factory.ts';

export function IcicleLayout(root: NodeModel) {
  // root node render as horiznotal strip (slick)

  let rootDepth = 0;
  eachBefore(root, v => (rootDepth = Math.max(rootDepth, v.depth)));

  function positionRecursively(v: NodeModel, globalShift = 0): number {
    // leaf node
    if (!v.children.length) {
      v.x = globalShift;
      return v.width; //+ Padding;
    }

    // directory node
    let lastFileChild: NodeModel | null = null;
    let localShift = DirBorderWidth + NodePadding;

    for (const child of v.children) {
      localShift += positionRecursively(child, globalShift + localShift); // returns only added padding
      localShift += NodePadding;
      if (child.ref.type !== 'directory') lastFileChild = child;
    }
    localShift += DirBorderWidth;

    v.x += globalShift;
    v.width = lastFileChild ? lastFileChild.x + lastFileChild.width - v.x + DirBorderWidth : DirPadding;

    // const lastChildMargin = v.children[v.children.length - 1].margin;
    // localShift += lastChildMargin;

    return localShift;
  }
  positionRecursively(root);

  eachAfter(root, v => {
    v.y = v.depth * SpiralArmWidth;
    if (v.ref.type === 'directory' && v.children.length) {
      v.range = [v.children[0].range[0], v.children[v.children.length - 1].range[1]];
      v.childrenDepth = v.children.reduce((a, b) => Math.max(a, b.childrenDepth + 1), 0);
    }
  });

  eachBefore(root, v => {
    const isDir = v.ref.type === 'directory';
    if (!isDir) {
      const d = isDir ? v.depth : v.depth - 1;
      const relHeight = NodeSize - d * NodePadding;
      // v.height = relHeight;
      // v.y = maxHeight - relHeight;
    }

    // update shapePoints
    const w = v.width;
    const h = v.height;
    v.shapePoints.top = [
      [0, 0],
      [w, 0],
    ];
    v.shapePoints.bottom = [
      [0, h],
      [w, h],
    ];
    if (isDir) {
      v.labelPoints = [
        [v.x, v.y - 10, 0],
        [v.x + v.width, v.y, 0],
      ];
    } else v.labelPoints = [[v.x + 10, v.y + NodePadding, Math.PI / 2]];
  });
}
