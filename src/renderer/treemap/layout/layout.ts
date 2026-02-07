import { eachAfter, eachBefore } from '../../shared/utils';
import { DeclarationGraphNode, Graph, GraphNode, GraphNodeEnum } from '../../graph';

export function Layout(root: GraphNode) {
  const targetRatio = 0.844;

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

        // todo row layout in app/portfolio aligns to first child rather than widest one
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

    const debugName =
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
      console.log(debugName, this.currentRatio);

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

    console.log(debugName, 'finished with', this.currentRatio);
    Graph.fitBBoxToChildren(node);
  }

  squashBiggestChildNode(node: GraphNode): boolean {
    const sortedByHeight = [...node.children].sort((a, b) => Graph.getFullHeight(b) - Graph.getFullHeight(a));

    for (let i = 0; i < sortedByHeight.length; i++) {
      const c = sortedByHeight[i];
      if (c.type === GraphNodeEnum.Directory) {
        // todo const s = squashBiggestChildNode(c) ?
        continue;
      } else if (c.type === GraphNodeEnum.Virtual) {
        // skip
        continue;
      } else if (c.type === GraphNodeEnum.Code || c.type === GraphNodeEnum.Other) {
        // cut height in half and double the width
        const { bbox, padding: p, layoutColumns } = c;
        const deltaWidth = Graph.fileWidth;
        const originalH = Graph.getFullFileNodeHeight(c);
        const resultHeight = originalH / (layoutColumns + 1);
        const deltaHeight = bbox.height - (p.top + p.bottom) - resultHeight + (p.top + p.bottom) / (layoutColumns + 1); // padding also needs to be proportionate to calculate single col height

        const newHeight = Math.max(this.h - deltaHeight, sortedByHeight[i + 1]?.bbox.height);
        const newWidth = this.w + deltaWidth;
        const newRatio = newHeight / newWidth;

        // if improved
        // TODO run until hit aspect ratio or hit the limit
        if (newHeight > 10 && Math.abs(newRatio - this.targetRatio) < Math.abs(this.currentRatio - this.targetRatio)) {
          c.layoutColumns++;
          this.w = newWidth;
          this.h = newHeight;
          this.currentRatio = newRatio;

          bbox.width += deltaWidth;
          bbox.height -= deltaHeight;

          if (c.type === GraphNodeEnum.Code) {
            const columnHeight = bbox.height - p.top - p.bottom;
            const temp = { columnIdx: 0, yPos: 0 }; // last declaration position
            c.children = [];

            Graph.createFileDeclarations(c).forEach((decl) => {
              const addClone = (h: number) => {
                const cl = Graph.createDeclarationNode(decl.ast, c);
                cl.bbox = {
                  x: temp.columnIdx * decl.bbox.width + 1,
                  y: temp.yPos + p.top,
                  width: cl.bbox.width - 2,
                  height: h
                };
                c.children.push(cl);
                return cl;
              };
              const { bbox, margin } = decl;
              const totalHeight = bbox.height;

              if (totalHeight < columnHeight - temp.yPos) {
                // fits in this column
                bbox.x = temp.columnIdx * decl.bbox.width;
                bbox.y = temp.yPos + p.top;
                temp.yPos += totalHeight + margin.bottom;
                c.children.push(decl); // push entire node without cutting
              } else {
                // overflows to the next column
                const toBottom = columnHeight - temp.yPos;
                addClone(toBottom);
                let tempH = totalHeight - toBottom;
                temp.yPos = 0;
                temp.columnIdx++;

                while (tempH) {
                  if (tempH - columnHeight < 0) {
                    // last column
                    addClone(tempH);
                    temp.yPos += tempH + margin.bottom;
                    break;
                  }
                  addClone(columnHeight);
                  tempH -= columnHeight;
                  temp.columnIdx++;
                }
              }
            });
          }
          // move all nodes to the right
          const idx = node.children.indexOf(c);
          for (let i = idx + 1; i < node.children.length; i++) {
            node.children[i].bbox.x += deltaWidth;
          }
          return true;
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

    // Too wide, stack columns
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

      const cachedPrevLastWidth = prevLast.bbox.width;
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

      // fill in the gap from removing last node (note it is already removed from children array)
      for (let i = lastIdx + 1; i < node.children.length; i++) {
        node.children[i].bbox.x -= Graph.getFullWidth(last);
      }
      // push nodes if prevLast grew
      const diff = prevLast.bbox.width - cachedPrevLastWidth;
      for (let i = prevLastIdx + 1; i < node.children.length; i++) {
        node.children[i].bbox.x += diff;
      }
      node.children.splice(lastIdx, 1);
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
