import { dia } from '@joint/core';

type Transform = [number, number, number]; // x, y, scale
type Viewport = [Point, Point];
type Point = [number, number];

export class Screen {
  private transform: Transform = [0, 0, 1]; // paper transform
  private pointer = {
    loop: { id: 0, active: false },
    current: [0, 0] as Point,
    prev: [] as Point[],
    cacheSize: 5,
  }
  private inertia = {
    loop: { id: 0, active: false },
    strengthMultiplier: 0.7,
    minDistanceTrigger: 10,
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
        inertia.loop.active = false;
        this.startPointerLoop(evt.clientX!, evt.clientY!);
      },
      'blank:pointermove': (evt) => {
        pointer.current = [evt.clientX!, evt.clientY!];
        // pointer.dirty = true;
      },
      'blank:pointerup': (evt) => {
        pointer.loop.active = false;
        this.startInertiaLoop();
      },
      // 'cell:mousewheel': (...args) => {
      //   // diagram.zoom(evt | { ox, oy, scale }) // exposing api for manual control
      // },
      // 'blank:mousewheel': (...args) => {
      //
      // },
      // 'paper:pinch': (...args) => console.log(args),
    });

  }

  private startPointerLoop(x: number, y: number) {
    const { pointer, transform, paper } = this;
    pointer.loop.active = true;
    pointer.current[0] = x;
    pointer.current[1] = y;
    pointer.prev.splice(0, pointer.prev.length, [x, y]);

    // update state per frame (so the movement deltas are bigger)
    const loop = (dt: number) => {
      if (pointer.loop.active) pointer.loop.id = requestAnimationFrame(loop);

      pointer.prev.push([pointer.current[0], pointer.current[1]]);
      if (pointer.prev.length > pointer.cacheSize) {
        pointer.prev.shift();
      }

      transform[0] += pointer.current[0] - pointer.prev[pointer.prev.length - 2][0];
      transform[1] += pointer.current[1] - pointer.prev[pointer.prev.length - 2][1];

      paper.el.style.transform = `translate(${transform[0]}px,${transform[1]}px) scale(${transform[2]})`;
    }
    pointer.loop.id = requestAnimationFrame(loop);
  }

  private startInertiaLoop(): void {
    const { paper, pointer, transform, inertia: { loop, velocity, strengthMultiplier, minDistanceTrigger } } = this;

    // calculate velocity
    velocity[0] = 0;
    velocity[1] = 0;
    for (let i = 1; i < pointer.prev.length; i++) {
      const previous = pointer.prev[i - 1];
      const current = pointer.prev[i];
      const weight = i / pointer.prev.length;
      velocity[0] += weight * strengthMultiplier * (current[0] - previous[0]);
      velocity[1] += weight * strengthMultiplier * (current[1] - previous[1]);
    }

    if (Math.abs(velocity[0]) + Math.abs(velocity[1]) < minDistanceTrigger) {
      return;
    }

    const animationLoop = (dt: number) => {
      if (loop.active) loop.id = requestAnimationFrame(animationLoop);

      const dx = velocity[0] / transform[2];
      const dy = velocity[1] / transform[2];
      transform[0] += dx;
      transform[1] += dy;
      paper.el.style.transform = `translate(${transform[0]}px,${transform[1]}px) scale(${transform[2]})`;
      velocity[0] *= 0.92;
      velocity[1] *= 0.92;

      if (Math.abs(velocity[0]) < 0.1 && Math.abs(velocity[1]) < 0.1) {
        // end animation
        loop.active = false;
        velocity[0] = 0;
        velocity[1] = 0;
      }
    }
    loop.active = true;
    loop.id = requestAnimationFrame(animationLoop);
  }

  onDestroy(): void {
    this.pointer.loop.active = false;
    this.inertia.loop.active = false;
  }
}
