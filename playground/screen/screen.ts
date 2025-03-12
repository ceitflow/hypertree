import { dia } from '@joint/core';
import { Transform } from './transform.ts';
import { DragInertia, Pointer, Zoom } from './plugins';

export class Screen {
  private transform: Transform;

  // pipeline architecture for Screen?
  // Events → Normalization → Interpretation → Physics → Constraints → Transformation → Animation → Rendering
  private zoom: Zoom;
  private pointer: Pointer;
  private drag: DragInertia;

  // constraints
  // wheelDelta
  // touchable
  // extent (size of screen) // default is container getClientBBox()
  // scaleExtent
  // translateExtent

  // output
  // - viewport
  // - visible cells (quadtree)

  constructor(paper: dia.Paper, container: HTMLElement) {
    this.transform = new Transform(paper.el.style);
    this.zoom = new Zoom(this.transform);
    this.pointer = new Pointer(this.transform);
    this.drag = new DragInertia(this.transform);

    const addContainerListener = <Evt extends Event>(type: string, callback: (e: Evt) => void) =>
        container.addEventListener(type, (e) => {
          if (e.target === container) callback(e as Evt);
        }, { passive: true })

    addContainerListener('mousedown', this.pointerdown.bind(this));
    addContainerListener('mousemove', this.pointermove.bind(this));
    addContainerListener('mouseup', this.pointerup.bind(this));

    paper.on({
      'cell:pointerdown': () => this.drag.interrupt(),
      'blank:pointerdown': (e) => this.pointerdown(e as any),
      'blank:pointermove': (e) => this.pointermove(e as any),
      'blank:pointerup': (e) => this.pointerup(),
      'cell:mousewheel': (view, e, x, y, delta) => {
        this.zoom.onZoom(delta >= 1, x, y);
      },
      'blank:mousewheel': (e, x, y, delta) => {
        this.zoom.onZoom(delta >= 1, x, y);
      },
      // 'paper:pinch': (...args) => console.log(args),
    });
  }

  pointerdown(evt: MouseEvent): void {
    this.drag.interrupt();
    this.pointer.down(evt.clientX!, evt.clientY!);
  }

  pointermove(evt: MouseEvent): void {
    this.pointer.move(evt);
  }

  pointerup(): void {
    this.pointer.up();
    this.drag.startAnimation(this.pointer.cached);
  }

  onDestroy(): void {
    this.pointer.interrupt();
    this.drag.interrupt();
  }
}
