import { BBox, GraphNodeBase } from '../../models';

/**
 * Quadtree Constructor
 * @class Quadtree
 * @param {Rect} bounds                 bounds of the node ({ x, y, width, height })
 * @param {number} [max_objects=10]     (optional) max objects a node can hold before splitting into 4 subnodes
 * @param {number} [max_levels=4]       (optional) total max levels inside root Quadtree
 */

type QuadTreeBounds = GraphNodeBase;

export class Quadtree {
  max_objects: number;
  max_levels: number;

  level: number;
  bounds: BBox;

  objects: QuadTreeBounds[];
  leaves: Quadtree[];

  constructor(bounds: BBox, objects: QuadTreeBounds[], max_objects = 16, max_levels = 4, level = 0) {
    this.max_objects = max_objects;
    this.max_levels = max_levels;

    this.level = level;
    this.bounds = bounds;

    this.objects = [];
    this.leaves = [];

    objects.forEach((o) => this.insert(o));
  }

  /**
   * Insert the object into the node. If the node
   * exceeds the capacity, it will split and add all
   * objects to their corresponding subnodes.
   * @param {Rect} pRect      bounds of the object to be added ({ x, y, width, height })
   * @memberof Quadtree
   */
  insert(pRect: QuadTreeBounds): void {
    let indexes;

    //if we have subnodes, call insert on matching subnodes
    if (this.leaves.length) {
      indexes = this.getIndex(pRect.bbox);

      for (let i = 0; i < indexes.length; i++) {
        this.leaves[indexes[i]].insert(pRect);
      }
      return;
    }

    //otherwise, store object here
    this.objects.push(pRect);

    //max_objects reached
    if (this.objects.length > this.max_objects && this.level < this.max_levels) {
      //split if we don't already have subnodes
      if (!this.leaves.length) {
        this.split();
      }

      //add all objects to their corresponding subnode
      for (let i = 0; i < this.objects.length; i++) {
        indexes = this.getIndex(this.objects[i].bbox);

        for (let k = 0; k < indexes.length; k++) {
          this.leaves[indexes[k]].insert(this.objects[i]);
        }
      }

      //clean up this node
      this.objects = [];
    }
  }

  /**
   * Split the node into 4 subnodes
   * @memberof Quadtree
   */
  private split(): void {
    const nextLevel = this.level + 1;
    const subWidth = this.bounds.width / 2;
    const subHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;

    //top right node
    this.leaves[0] = new Quadtree(
      {
        x: x + subWidth,
        y: y,
        width: subWidth,
        height: subHeight
      },
      [],
      this.max_objects,
      this.max_levels,
      nextLevel
    );

    //top left node
    this.leaves[1] = new Quadtree(
      {
        x: x,
        y: y,
        width: subWidth,
        height: subHeight
      },
      [],
      this.max_objects,
      this.max_levels,
      nextLevel
    );

    //bottom left node
    this.leaves[2] = new Quadtree(
      {
        x: x,
        y: y + subHeight,
        width: subWidth,
        height: subHeight
      },
      [],
      this.max_objects,
      this.max_levels,
      nextLevel
    );

    //bottom right node
    this.leaves[3] = new Quadtree(
      {
        x: x + subWidth,
        y: y + subHeight,
        width: subWidth,
        height: subHeight
      },
      [],
      this.max_objects,
      this.max_levels,
      nextLevel
    );
  }

  /**
   * Determine which node the object belongs to
   * @param {Rect} pRect      bounds of the area to be checked ({ x, y, width, height })
   * @return {number[]}       an array of indexes of the intersecting subnodes (0-3 = top-right, top-left, bottom-left, bottom-right / ne, nw, sw, se)
   * @memberof Quadtree
   */
  private getIndex(pRect: BBox): number[] {
    const indexes: number[] = [];
    const verticalMidpoint = this.bounds.x + this.bounds.width / 2;
    const horizontalMidpoint = this.bounds.y + this.bounds.height / 2;

    const startIsNorth = pRect.y < horizontalMidpoint;
    const startIsWest = pRect.x < verticalMidpoint;
    const endIsEast = pRect.x + pRect.width > verticalMidpoint;
    const endIsSouth = pRect.y + pRect.height > horizontalMidpoint;

    //top-right quad
    if (startIsNorth && endIsEast) {
      indexes.push(0);
    }

    //top-left quad
    if (startIsWest && startIsNorth) {
      indexes.push(1);
    }

    //bottom-left quad
    if (startIsWest && endIsSouth) {
      indexes.push(2);
    }

    //bottom-right quad
    if (endIsEast && endIsSouth) {
      indexes.push(3);
    }

    return indexes;
  }

  /**
   * Return all objects that could collide with the given object

   */
  retrieve(query: GraphNodeBase): Set<QuadTreeBounds> {
    const bbox = query.bbox;
    const indexes = this.getIndex(bbox);
    const result = new Set<QuadTreeBounds>();

    const isValid = (obj: GraphNodeBase) => obj !== query && obj.parent === query.parent && intersects(bbox, obj.bbox);

    this.objects.forEach((obj) => {
      if (isValid(obj)) {
        result.add(obj);
      }
    });

    // recursion
    if (this.leaves.length) {
      for (let i = 0; i < indexes.length; i++) {
        this.leaves[indexes[i]].retrieve(query).forEach((l) => {
          if (isValid(l)) {
            result.add(l);
          }
        });
      }
    }
    return result;
  }

  clear(): void {
    this.objects = [];

    for (let i = 0; i < this.leaves.length; i++) {
      if (this.leaves.length) {
        this.leaves[i].clear();
      }
    }

    this.leaves = [];
  }
}

function intersects(l: BBox, r: BBox): boolean {
  return r.x + r.width > l.x && r.y + r.height > l.y && r.x < l.x + l.width && r.y < l.y + l.height;
}
