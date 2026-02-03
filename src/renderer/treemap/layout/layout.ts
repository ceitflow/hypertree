import { eachAfter, eachBefore } from '../../shared/utils';
import { Graph, GraphNode, GraphNodeEnum } from '../../graph';

export function Layout(root: GraphNode) {
  // 1 Loc = 1px height x 80px width
  const fileWidth = 60;
  const defaultPadding = 4;
  const targetRatio = 0.844;

  eachAfter(root, (v) => {
    const { type, bbox, margin, padding } = v;

    // padding is included in bbox
    switch (type) {
      case GraphNodeEnum.Declaration: {
        const isNotLast = v.parent!.children[v.parent!.children.length - 1] !== v;
        margin.bottom = v.parent!.children.length > 1 && isNotLast ? 2 : 0;
        bbox.width = fileWidth;
        bbox.height = v.ast.loc;
        v.area = v.ast.loc;
        break;
      }
      case GraphNodeEnum.Code: {
        const m = Math.round(Math.sqrt(v.ast.loc) / 2);
        margin.right = m;
        margin.bottom = m;
        padding.top = m * 2;
        padding.bottom = defaultPadding;

        // layout declarations in a single column
        let tempY = padding.top;
        let marginsAddition = 0;
        v.children.forEach((decl) => {
          decl.bbox.x = v.padding.left;
          decl.bbox.y = tempY;
          tempY += decl.bbox.height + decl.margin.bottom;
          marginsAddition += decl.margin.bottom;
        });

        // file can sometimes have more LOC than sum of its declarations
        bbox.width = fileWidth + padding.left + padding.right;
        bbox.height = v.ast.loc + padding.top + padding.bottom + marginsAddition;
        v.area = v.ast.loc;
        break;
      }
      case GraphNodeEnum.Other: {
        margin.right = 10;
        margin.bottom = 10;
        bbox.width = fileWidth;
        bbox.height = v.ast.loc;
        // if (child.node.bigFile) {
        //   child.layout.bbox.height = 10;
        // }
        v.area = v.ast.loc;
        break;
      }
      case GraphNodeEnum.Virtual:
      case GraphNodeEnum.Directory: {
        v.area = v.children.reduce((s, c) => s + c.area, 0);
        const m = Math.round(Math.sqrt(v.area) / 2);
        if (type === GraphNodeEnum.Directory) {
          margin.right = m;
          margin.bottom = m;
          margin.left = m;
          padding.top = m;
          padding.right = defaultPadding;
          padding.bottom = defaultPadding;
          padding.left = defaultPadding;
        }

        v.children.sort((a, b) => b.area - a.area);

        // layout in a single row
        let totalWidth = padding.left;
        let totalHeight = 0;

        v.children.forEach((child) => {
          child.bbox.x = totalWidth + child.margin.left;
          child.bbox.y = padding.top + child.margin.top;
          totalWidth += Graph.getFullWidth(child);
          const height = Graph.getFullHeight(child);
          if (height > totalHeight) {
            totalHeight = height;
          }
        });
        totalWidth += padding.right;
        totalHeight += padding.top + padding.bottom;
        bbox.width = totalWidth;
        bbox.height = totalHeight;

        new AspectRatioLayout(v, targetRatio);
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

    if (v.type === GraphNodeEnum.Directory) {
      const margin = 1000;
      for (let x = v.margin.left + v.padding.left; x < v.bbox.width; x += margin) {
        v.labelPoints.push([v.bbox.x + x, v.bbox.y, 0]);
      }
    }
  });
}

class AspectRatioLayout {
  w: number;
  h: number;
  currentRatio: number;

  constructor(
    node: GraphNode,
    private targetRatio: number
  ) {
    this.w = node.bbox.width;
    this.h = node.bbox.height;
    this.currentRatio = this.h / this.w;

    const _name =
      node.type === GraphNodeEnum.Directory
        ? node.ast.id
        : node.parent?.type === GraphNodeEnum.Directory
          ? node.parent.ast.id + ' virtual'
          : 'virtual';
    const isValidRatio = (r: number) => Math.abs(targetRatio - r) / targetRatio <= 0.1;

    if (isValidRatio(this.currentRatio) || !node.children.length) {
      return;
    }

    while (!isValidRatio(this.currentRatio)) {
      console.log(_name, this.currentRatio);

      // too tall, squash leftmost
      if (this.currentRatio > targetRatio) {
        console.log('too tall');
        const success = this.squashBiggestChildNode(node);
        if (!success) break;
      } else {
        // too wide, stack 2 nodes into column
        const success = this.stackTwoSmallestChildren(node);
        if (!success) break;
      }
    }

    console.log(_name, 'finished with', this.currentRatio);
    Graph.fitBBoxToChildren(node);
  }

  squashBiggestChildNode(node: GraphNode): boolean {
    const sortedByHeight = [...node.children].sort((a, b) => Graph.getFullHeight(b) - Graph.getFullHeight(a));

    for (const c of sortedByHeight) {
      if (c.type === GraphNodeEnum.Directory) {
        // todo const s = squashBiggestChildNode(c) ?
        continue;
      } else if (c.type === GraphNodeEnum.Virtual) {
        continue;
      } else if (c.type === GraphNodeEnum.Code || c.type === GraphNodeEnum.Other) {
        // cut height in half and double the width
        const newHeight = this.h - c.bbox.height / 2;
        const newWidth = this.w + c.bbox.width;
        const newRatio = newHeight / newWidth;

        // if improved
        if (Math.abs(newRatio - this.targetRatio) < Math.abs(this.currentRatio - this.targetRatio)) {
          return false; // true

          this.w = newWidth;
          this.h = newHeight;
          this.currentRatio = newRatio;
        } else {
          return false;
        }
      }
    }

    // couldn't find node to squash
    console.log('not improved too tall, aborting');
    return false;
  }

  stackTwoSmallestChildren(node: GraphNode): boolean {
    if (node.children.length === 1) {
      console.log('too few children, skipping', 'ast' in node ? node.ast.name : 'virtual');
      return false; // nothing to stack
    }

    // Too wide, stack columns rightmost first.
    // Find two smallest nodes to stack them
    let last = node.children[0];
    let prevLast = node.children[1];
    let lastIdx = 0;
    let prevLastIdx = 1;
    node.children.forEach((child, idx) => {
      if (child === last) return;
      if (Graph.getFullHeight(child) <= Graph.getFullHeight(last)) {
        // '<=' to prefer rightmost
        prevLast = last;
        last = child;
        prevLastIdx = lastIdx;
        lastIdx = idx;
      }
    });
    const newHeight = Math.max(this.h, Graph.getFullHeight(prevLast) + Graph.getFullHeight(last));
    const newWidth = this.w - Graph.getFullWidth(last);
    const newRatio = newHeight / newWidth;

    // if improved
    if (Math.abs(newRatio - this.targetRatio) < Math.abs(this.currentRatio - this.targetRatio)) {
      if (!(prevLast.type === GraphNodeEnum.Virtual && prevLast.isColumnWrapper)) {
        // if target is a CodeFile or OtherFile, then wrap it
        const columnWrapper = Graph.createVirtualNode(true, node);
        const { x, y, width, height } = prevLast.bbox;
        const m = prevLast.margin;
        columnWrapper.bbox = {
          x: x - m.left,
          y: y - m.top,
          width: width + m.left + m.right,
          height: height + m.top + m.bottom
        };
        prevLast.bbox.x = m.left;
        prevLast.bbox.y = m.top;
        prevLast.parent = columnWrapper;
        columnWrapper.children = [prevLast];
        node.children.splice(prevLastIdx, 1, columnWrapper); // todo splice while iterating bad?
        prevLast = columnWrapper;
      }

      // append last to prevLast
      if (last.type === GraphNodeEnum.Virtual && last.isColumnWrapper) {
        last.children.forEach((c) => {
          c.bbox.x = 0;
          c.bbox.y = Graph.getFullHeight(prevLast);
          prevLast.children.push(c);
          Graph.fitSizeToChildren(prevLast);
        });
      } else {
        last.bbox.x = 0;
        last.bbox.y = Graph.getFullHeight(prevLast);
        prevLast.children.push(last);
        Graph.fitSizeToChildren(prevLast);
      }
      node.children.splice(lastIdx, 1);

      // move all columns to the right of 'last' (note last node is already removed from children array)
      for (let i = lastIdx; i < node.children.length; i++) {
        node.children[i].bbox.x -= Graph.getFullWidth(last);
      }
      this.w = newWidth;
      this.h = newHeight;
      this.currentRatio = newRatio;
      return true;
    }

    console.log('not improved too wide, aborting');
    return false;
  }
}

// calculate min w/h and max w/h for each container
// foreach node calculate 2 states, 1 row and 1 column
//  (for tall nodes just rotate them - switch width with height)

// eachAfter - calculate min max sizes for each node AND layout node optimally (~equals given aspect ratio)
// eachBefore - second pass do main layout, traverse up - parent nodes can only modify 25% off of children aspect ratio from ideal
