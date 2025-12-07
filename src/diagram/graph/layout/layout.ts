import { NodeModel } from '../types.ts';
import { NodeWidth } from './node-factory.ts';
import TidyTree, { eachAfter, YPosition } from './tidy-tree.ts';

export class Layout {
  spiralLayout(root: NodeModel, overrideLinear = false) {
    console.log(root);
    TidyTree(root); // todo layout declaration nodes into column (so it reads like real code file)
    if (overrideLinear) {
      return;
    }
    this.spiral(root);
    this.generateArcs(root);
  }

  private generateArcs(root: NodeModel) {
    eachAfter(root, v => {
      if (!v.children.length) {
        return;
      }
    });
  }

  private spiral(root: NodeModel) {
    // todo assign x,y points
    // todo modify shapePoints in place
    const startOffset = 600 * Math.PI;

    // calculate arc points for each node
    eachAfter(root, v => {
      // if (!v.children.length && prev) {
      //  margin += this.calculateMargin(v, prev, root.childrenDepth);
      // }
      v.spiralLength = v.x + startOffset; // v.x is distance from 0 set by tidy tree
      // if is root node
      if (v.spiralLength === 0) {
        v.x = 0;
        v.y = 0;
        return;
      }

      const minLabelDistance = 300;
      const minX = v.range[0].spiralLength;
      const maxX = v.range[1].spiralLength + v.range[1].width;
      v.shapePoints.top = [];
      v.shapePoints.bottom = [];
      v.labelArcPoints = [];
      const out: [number, number, number] = [0, 0, 0]; // data container (for performance)
      let lastLabelSpiralLength!: number;

      for (let L = minX; L <= maxX; L += NodeWidth / 2) {
        this.getCartesianFromSpiralLength(root.childrenDepth, L, v.depth, out);
        // v.shapePoints.push([out[0], out[1]]);
        // if first point
        if (L === minX) {
          v.x = out[0];
          v.y = out[1];
          v.angle = out[2] % (2 * Math.PI);
        }
        // text label
        if (!lastLabelSpiralLength || L - lastLabelSpiralLength > minLabelDistance) {
          v.labelArcPoints.push([out[0], out[1], (out[2] - Math.PI / 2) % (2 * Math.PI)]);
          lastLabelSpiralLength = L;
        }
      }
    });
    root.x = 0;
    root.y = 0;
  }

  // private calculateMargin(v: NodeModel, prev: NodeModel, totalDepth: number): number {
  //   const prevId = prev.id.split('/');
  //   const id = v.id.split('/');
  //   let commonParentDepth = -1;
  //   for (let i = 0; i < Math.min(prevId.length, id.length); i++) {
  //     if (prevId[i] === id[i]) {
  //       commonParentDepth = i + 1;
  //     } else {
  //       break;
  //     }
  //   }
  //   if (v.depth - commonParentDepth > 2) {
  //     return Math.pow(totalDepth - commonParentDepth, 2);
  //   }
  //   return 0;
  // }

  getSpiralWidth(totalDepth: number) {
    return YPosition(totalDepth);
  }

  // out: [x, y, angle]
  getCartesianFromSpiralLength(totalDepth: number, length: number, offsetByDepth: number, out: [number, number, number]) {
    const spiralWidth = this.getSpiralWidth(totalDepth);
    const width = spiralWidth / 2 / Math.PI; // distance between spiral arms

    // Step 1: Calculate the angle θ from the arc length L ≈ (a/2) * θ^2  =>  θ = sqrt(2L / a)
    const angle = Math.sqrt((2 * length) / width);

    // Step 2: Calculate the radius r = a * θ with offset
    let radius = width * angle;
    if (offsetByDepth) {
      radius = Math.max(0, radius - ((totalDepth - offsetByDepth) / totalDepth) * spiralWidth);
    }
    out[0] = radius * Math.cos(angle);
    out[1] = radius * Math.sin(angle);
    out[2] = angle;
  }
}
