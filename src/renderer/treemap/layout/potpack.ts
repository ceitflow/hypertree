/*
/!**
 * @typedef {Object} PotpackBox
 * @property {number} w Box width.
 * @property {number} h Box height.
 * @property {number} [x] X coordinate in the resulting container.
 * @property {number} [y] Y coordinate in the resulting container.
 *!/

/!**
 * @typedef {Object} PotpackStats
 * @property {number} w Width of the resulting container.
 * @property {number} h Height of the resulting container.
 * @property {number} fill The space utilization value (0 to 1). Higher is better.
 *!/

/!**
 * Packs 2D rectangles into a near-square container.
 *
 * Mutates the {@link boxes} array: it's sorted (by height/width),
 * and box objects are augmented with `x`, `y` coordinates.
 *
 * @param {PotpackBox[]} boxes
 * @return {PotpackStats}
 *!/
export function rectPack(v: NodeModel) {
  const isFile = v.ast.type === 'codeFile';
  const isDirectory = v.ast.type === 'directory';
  const containerPadding = v.map.padding;

  const childRects = v.children.map(c => {
    const { x, y, width, height, margin } = c.map;
    return { x, y, width: width + margin.left + margin.right, height: height + margin.top + margin.bottom, ref: c };
  });

  let childrenBBox = { w: 0, h: 0 };

  if (isFile) {
    // layout declarations in codefile into single column
    let tempY = 0;
    childRects.forEach(c => {
      c.y = tempY;
      tempY += c.height + c.ref.map.margin.bottom;
    });
    childrenBBox.w = v.map.width;
    childrenBBox.h = tempY;
  } /!*else if (isDirectory && v.children.every(c => c.ref.type !== 'directory')) {
    // files only, layout manually into row
    let tempX = 0;
    let maxY = 0;
    childRects.forEach(c => {
      c.x = tempX;
      tempX += c.width + c.ref.map.margin.left;
      if (c.height > maxY) maxY = c.height;
    });
    childrenBBox.w = tempX;
    childrenBBox.h = maxY;
  }*!/ else {
    childrenBBox = potpack(childRects);
  }

  for (const box of childRects) {
    const childMargin = box.ref.map.margin;
    box.ref.map.x = box.x + containerPadding.left + childMargin.left;
    box.ref.map.y = box.y + containerPadding.top + childMargin.top;
  }
  v.map.width = childrenBBox.w + containerPadding.left + containerPadding.right;
  v.map.height = childrenBBox.h + containerPadding.top + containerPadding.bottom;
}

function potpack(boxes: { x: number; y: number; width: number; height: number }[]) {
  // calculate total box area and maximum box width
  let area = 0;
  let maxWidth = 0;

  for (const box of boxes) {
    area += box.width * box.height;
    maxWidth = Math.max(maxWidth, box.width);
  }

  // sort the boxes for insertion by height, descending
  boxes.sort((a, b) => b.height - a.height);

  // aim for a squarish resulting container,
  // slightly adjusted for sub-100% space utilization
  const startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth);

  // start with a single empty space, unbounded at the bottom
  const spaces = [{ x: 0, y: 0, w: startWidth, h: Infinity }];

  let width = 0;
  let height = 0;

  for (const box of boxes) {
    // look through spaces backwards so that we check smaller spaces first
    for (let i = spaces.length - 1; i >= 0; i--) {
      const space = spaces[i];

      // look for empty spaces that can accommodate the current box
      if (box.width > space.w || box.height > space.h) continue;

      // found the space; add the box to its top-left corner
      // |-------|-------|
      // |  box  |       |
      // |_______|       |
      // |         space |
      // |_______________|
      box.x = space.x;
      box.y = space.y;

      height = Math.max(height, box.y + box.height);
      width = Math.max(width, box.x + box.width);

      if (box.width === space.w && box.height === space.h) {
        // space matches the box exactly; remove it
        const last = spaces.pop();
        if (last && i < spaces.length) spaces[i] = last;
      } else if (box.height === space.h) {
        // space matches the box height; update it accordingly
        // |-------|---------------|
        // |  box  | updated space |
        // |_______|_______________|
        space.x += box.width;
        space.w -= box.width;
      } else if (box.width === space.w) {
        // space matches the box width; update it accordingly
        // |---------------|
        // |      box      |
        // |_______________|
        // | updated space |
        // |_______________|
        space.y += box.height;
        space.h -= box.height;
      } else {
        // otherwise the box splits the space into two spaces
        // |-------|-----------|
        // |  box  | new space |
        // |_______|___________|
        // | updated space     |
        // |___________________|
        spaces.push({
          x: space.x + box.width,
          y: space.y,
          w: space.w - box.width,
          h: box.height,
        });
        space.y += box.height;
        space.h -= box.height;
      }
      break;
    }
  }

  return {
    w: width, // container width
    h: height, // container height
    fill: area / (width * height) || 0, // space utilization
  };
}
*/
