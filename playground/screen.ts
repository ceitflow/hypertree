import { dia } from '@joint/core';

type Transform = { x: number, y: number, z: number };
type Viewport = [Point, Point];
type Point = [number, number];

export class Screen {
  private loopId: number = 0;
  private transform: Transform = { x: 0, y: 0, z: 1 }; // paper transform
  private pointer = {
    current: [0, 0] as Point,
    prev: [] as Point[],
    cacheSize: 5,
    dirty: false,
  }
  private inertia = {
    animate: false,
    strengthMultiplier: 0.7,
    velocity: [0, 0],
  }
  // constraints
  // wheelDelta
  // touchable
  // extent (size of screen) // default is container getClientBBox()
  // scaleExtent
  // translateExtent

  // output
  // - viewport
  // - visible cells (quadtree)

  constructor(private paper: dia.Paper) {
    const { inertia, pointer } = this;
    paper.on({
      // 'all': (...args) => console.log(args[1].type),
      'blank:pointerdown': (evt) => {
        pointer.current[0] = evt.clientX!;
        pointer.current[1] = evt.clientY!;
        pointer.prev.splice(0, pointer.prev.length, [evt.clientX!, evt.clientY!]);
        inertia.animate = false;
      },
      'blank:pointermove': (evt) => {
        pointer.current = [evt.clientX!, evt.clientY!];
        pointer.dirty = true;
        inertia.animate = false;
        // console.log(pointer.velocityX, pointer.velocityY)
      },
      'blank:pointerup': (evt) => {
        inertia.animate = true;
      },
      'cell:mousewheel': (...args) => {
        // diagram.zoom(evt | { ox, oy, scale }) // exposing api for manual control
      },
      'blank:mousewheel': (...args) => {

      },
      'paper:pinch': (...args) => console.log(args),
    });

    this.loopId = requestAnimationFrame(this.loop.bind(this));
  }

  private loop(dt: number) {
    const { pointer, transform, inertia: { velocity, strengthMultiplier } } = this;

    if (pointer.dirty) {
      pointer.dirty = false;
      // update state per frame (so the deltas are bigger)
      pointer.prev.push([pointer.current[0], pointer.current[1]]);
      if (pointer.prev.length > pointer.cacheSize) {
        pointer.prev.shift();
      }
      velocity[0] = 0;
      velocity[1] = 0;
      for (let i = 1; i < pointer.prev.length; i++) {
        const previous = pointer.prev[i - 1];
        const current = pointer.prev[i];
        const weight = i / pointer.prev.length;
        velocity[0] += weight * strengthMultiplier * (current[0] - previous[0]);
        velocity[1] += weight * strengthMultiplier * (current[1] - previous[1]);
      }
      transform.x += pointer.current[0] - pointer.prev[pointer.prev.length - 2][0];
      transform.y += pointer.current[1] - pointer.prev[pointer.prev.length - 2][1];

      this.paper.el.style.transform = `translate(${transform.x}px,${transform.y}px) scale(${transform.z})`;
    }

    if (this.inertia.animate) {
      const dx = velocity[0] / transform.z;
      const dy = velocity[1] / transform.z;
      transform.x += dx;
      transform.y += dy;
      this.paper.el.style.transform = `translate(${transform.x}px,${transform.y}px) scale(${transform.z})`;
      velocity[0] *= 0.92;
      velocity[1] *= 0.92;

      // end simulation
      if (Math.abs(velocity[0]) < 0.1 && Math.abs(velocity[1]) < 0.1) {
        this.inertia.animate = false;
        velocity[0] = 0;
        velocity[1] = 0;
      }
    }

    this.loopId = requestAnimationFrame(this.loop.bind(this));
  }

  onDestroy(): void {
    cancelAnimationFrame(this.loopId);
  }
}
