import {
  CodeGraphNode,
  DeclarationGraphNode,
  Graph,
  GraphNode,
  GraphNodeEnum,
  OtherGraphNode,
  VirtualGraphNode
} from '../../index';

export class AspectRatioLayout {
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
    node.fitBBoxToChildren();
  }

  private getFullFileNodeHeight(node: CodeGraphNode | OtherGraphNode) {
    let margins = 0;
    if (node.type === GraphNodeEnum.Code)
      margins = DeclarationGraphNode.createFromCodeFile(node).reduce((a, b) => a + b.margin.top + b.margin.bottom, 0);
    return node.ast.loc + node.padding.top + node.padding.bottom + margins;
  }

  squashBiggestChildNode(node: GraphNode): boolean {
    const sortedByHeight = [...node.children].sort((a, b) => b.getFullHeight() - a.getFullHeight());

    for (let i = 0; i < sortedByHeight.length; i++) {
      const c = sortedByHeight[i];
      if (c.type === GraphNodeEnum.Directory) {
        // todo const s = squashBiggestChildNode(c) ?
        continue;
      } else if (c.type === GraphNodeEnum.Virtual) {
        // skip
        continue;
      } else if (c.type === GraphNodeEnum.Code || c.type === GraphNodeEnum.Other) {
        // todo split separate
        // cut height in half and double the width
        const { bbox, padding: p, layoutColumns } = c;
        const deltaWidth = CodeGraphNode.defaultWidth;
        const originalH = this.getFullFileNodeHeight(c);
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

            DeclarationGraphNode.createFromCodeFile(c).forEach((decl) => {
              const addClone = (h: number) => {
                const cl = DeclarationGraphNode.create(c, decl.ast);
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
      if (child.getFullHeight() <= last.getFullHeight()) {
        // '<=' to prefer rightmost
        prevLast = last;
        last = child;
        prevLastIdx = lastIdx;
        lastIdx = idx;
      }
    });
    const newHeight = Math.max(this.h, prevLast.getFullHeight() + last.getFullHeight());
    const newWidth = this.w - last.getFullWidth();
    const newRatio = newHeight / newWidth;

    // if improved
    if (Math.abs(newRatio - this.targetRatio) < Math.abs(this.currentRatio - this.targetRatio)) {
      if (!(prevLast.type === GraphNodeEnum.Virtual && prevLast.isColumnWrapper)) {
        // if target is a CodeFile or OtherFile, then wrap it
        const columnWrapper = VirtualGraphNode.create(node, true);
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
          c.bbox.y = prevLast.getFullHeight();
          prevLast.children.push(c);
          prevLast.fitSizeToChildren();
        });
      } else {
        last.bbox.x = 0;
        last.bbox.y = prevLast.getFullHeight();
        prevLast.children.push(last);
        prevLast.fitSizeToChildren();
      }

      // fill in the gap from removing last node (note it is already removed from children array)
      for (let i = lastIdx + 1; i < node.children.length; i++) {
        node.children[i].bbox.x -= last.getFullWidth();
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
