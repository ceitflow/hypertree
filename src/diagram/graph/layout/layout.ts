import { NodeModel } from '../types.ts';
import TidyTree, { eachBefore } from './tidy-tree.ts';
import { DirPadding, SpiralArmWidth } from './node-factory.ts';

export class Layout {
  spiralLayout(root: NodeModel, overrideLinear = true) {
    console.log(root);
    TidyTree(root); // todo layout declaration nodes into column (so it reads like real code file)
    if (overrideLinear) {
      return;
    }
    this.spiral(root);
  }

  private spiral(root: NodeModel) {
    const startOffset = Math.PI * 2600; // todo calculate length of single spiral turn of SpiralArmWidth width

    // calculate arc points for each node
    eachBefore(root, v => {
      if (v === root) {
        return;
      }
      const out: [number, number, number] = [0, 0, 0]; // data container (for performance)
      const maxX = v.width;
      const maxY = v.shapePoints.bottom[0][1];

      // v.x loses meaning in polar coordinates, use spiralLength instead
      v.spiralLength = v.x + startOffset; // v.x is distance from 0 set by tidy tree
      v.x = 0;
      v.y = 0;
      v.shapePoints.top = [];
      v.shapePoints.bottom = [];
      v.labelPoints = [];

      for (let dx = 0; dx <= maxX; dx += DirPadding) {
        // top border
        this.getCartesianFromSpiralLength(root.childrenDepth, v.spiralLength + dx, v.depth, 0, out);
        v.shapePoints.top.push([out[0] - v.x, out[1] - v.y]);

        if (dx === 0) {
          v.labelPoints.push([out[0], out[1], out[2] % (2 * Math.PI)]);
        }
        // bottom border
        this.getCartesianFromSpiralLength(root.childrenDepth, v.spiralLength + dx, v.depth, maxY, out);
        v.shapePoints.bottom.push([out[0] - v.x, out[1] - v.y]);

        if (dx + DirPadding > maxX) {
          // make sure to add the last point
          this.getCartesianFromSpiralLength(root.childrenDepth, v.spiralLength + maxX, v.depth, 0, out);
          v.shapePoints.top.push([out[0] - v.x, out[1] - v.y]);
          this.getCartesianFromSpiralLength(root.childrenDepth, v.spiralLength + maxX, v.depth, maxY, out);
          v.shapePoints.bottom.push([out[0] - v.x, out[1] - v.y]);
        }
      }
    });
    root.x = 0;
    root.y = 0;
  }

  // out: [x, y, angle]
  getCartesianFromSpiralLength(
    totalDepth: number,
    L: number,
    offsetByDepth: number,
    offset: number,
    out: [number, number, number]
  ) {
    const spiralWidth = totalDepth * SpiralArmWidth;
    const width = spiralWidth / 2 / Math.PI; // distance between spiral arms

    // Step 1: Calculate the angle θ from the arc length L ≈ (a/2) * θ^2  =>  θ = sqrt(2L / a)
    const angle = Math.sqrt((2 * L) / width);

    // Step 2: Calculate the radius r = a * θ with offset
    let radius = width * angle;
    if (offsetByDepth) {
      radius = Math.max(0, radius - ((totalDepth - offsetByDepth) / totalDepth) * spiralWidth + offset);
    }
    out[0] = radius * Math.cos(angle);
    out[1] = radius * Math.sin(angle);
    out[2] = angle;
  }
}
