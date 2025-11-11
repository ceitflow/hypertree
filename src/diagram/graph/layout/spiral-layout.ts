import { NodeModel } from '../types.ts';
import { YPosition, TidyTree, eachAfter } from './tidy-tree.ts';

export class SpiralLayout {
  layout(root: NodeModel) {
    console.log(root);
    TidyTree(root);
    this.spiral(root);
  }

  private spiral(root: NodeModel) {
    const startOffset = 600 * Math.PI;
    let prev!: NodeModel;
    let padding = 0;
    const out: [number, number, number] = [0, 0, 0]; // array to pass data (for performance)

    eachAfter(root, v => {
      padding += prev && !v.children.length && prev.parent !== v.parent ? 12 : 0;
      v.spiralLength = v.x + startOffset + padding; // v.x is distance from 0 set by tidy tree
      if (v.spiralLength === 0) {
        v.x = 0;
        v.y = 0;
        return;
      }
      this.getCartesianFromSpiralLength(root.childrenDepth, v.spiralLength, v.children.length ? v.depth : 0, out);
      v.angle = out[2] % (2 * Math.PI);
      v.x = out[0];
      v.y = out[1];
      prev = v;
    });
    root.x = 0;
    root.y = 0;
  }

  getArmWidth(totalDepth: number) {
    return YPosition(totalDepth) / 2;
  }

  // out: [x, y, angle]
  getCartesianFromSpiralLength(totalDepth: number, length: number, offsetByDepth: number, out: [number, number, number]) {
    const armWidth = this.getArmWidth(totalDepth);
    const width = armWidth / 2 / Math.PI; // distance between spiral arms

    // Step 1: Calculate the angle θ from the arc length L ≈ (a/2) * θ^2  =>  θ = sqrt(2L / a)
    const angle = Math.sqrt((2 * length) / width);

    // Step 2: Calculate the radius r = a * θ with offset
    let radius = width * angle;
    if (offsetByDepth) {
      radius = Math.max(0, radius - ((totalDepth - offsetByDepth) / totalDepth) * armWidth);
    }
    out[0] = radius * Math.cos(angle);
    out[1] = radius * Math.sin(angle);
    out[2] = angle;
  }
}
