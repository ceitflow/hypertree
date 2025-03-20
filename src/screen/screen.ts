import { dia } from '@joint/core';
import { State } from './types.ts';
import { Inertia, Translate, Zoom } from './transformers';
import { pinchZoom, touchDrag } from '../util/event-touch';
import { Touch } from './touch.ts';

export class Screen {
  private state: State = {
    transform: [0, 0, 1],
    currentTransform: [0, 0, 1], // for comparing dirty state

    frameStart: {
      time: 0,
      deltaTime: 0,
    },

    translate: {
      target: [0, 0],
      motionPerFrame: [],
      motionSize: 6,
      active: false,
    },

    inertia: {
      velocity: [0, 0],
      strength: 0.5,
      friction: 0.93,
      brakeFriction: 0.78,
      minVelocity: 0.5,
      active: false,
    },

    zoom: {
      min: 0.1,
      max: 4,
      durationMs: 150,
      targetZoom: 1,
      startVelocity: [0, 0, 0],
      velocity: [0, 0, 0],
      active: false,
    },
  };
  private _loopId = 0;

  // screen transformers
  private translate = Translate(this.state);
  private inertia = Inertia(this.state);
  private zoom = Zoom(this.state);
  private touch = new Touch();
  private transformers = [this.translate.next, this.inertia.next, this.zoom.next];

  /*// private viewport;

  // [currentTransform, pointer, zoom, drag, force, restriction, setTransform(update paper), updateViewport] modify transform in place
  // todo squish animation (apple like)
  // animation transformer can be self correcting (if user translates it compensates with some delay)
  // constraints
  // wheelDelta
  // touchable
  // extent (size of screen) // default is container getClientBBox()
  // scaleExtent
  // translateExtent

  // output
  // - viewport
  // - visible cells (quadtree)

  // screen is controller (deals with mouse and touch, from paper and container), then
  // so the controllers is contained in screen.ts
  // while (abstracted) main logic is in state and transformers
*/

  constructor(
    private paper: dia.Paper,
    container: HTMLElement
  ) {
    const addContainerListener = <Evt extends Event>(type: string, callback: (e: Evt) => void) =>
      container.addEventListener(type, e => {
        if (e.target === container) callback(e as Evt);
      });

    const { translate, inertia, zoom } = this;

    // events listeners// todo evt.clientX to paper pos
    addContainerListener('mousedown', (e: MouseEvent) => {
      translate.start(e.clientX, e.clientY);
    });
    addContainerListener('mousemove', (e: MouseEvent) => {
      translate.move(e.clientX, e.clientY);
    });
    addContainerListener('mouseup', () => {
      translate.stop();
      inertia.start();
    });
    addContainerListener('wheel', (e: WheelEvent) => {
      const { x, y } = this.paper.clientToLocalPoint(e.clientX, e.clientY);
      zoom.start(-e.deltaY, x, y);
    });
    addContainerListener('touchstart', e => {
      e.stopPropagation();
      e.preventDefault();
      this.touch.touchStart(e as TouchEvent, this.paper);
    });
    addContainerListener('touchmove', e => {
      e.stopPropagation();
      e.preventDefault();
      this.touch.touchMove(e as TouchEvent, this.state.transform);
    });
    addContainerListener('touchend', e => {
      e.stopPropagation();
      e.preventDefault();
      this.touch.touchEnd(e as TouchEvent, this.paper);
    });
    paper.on({
      // all: (...args) => console.log(args),
      // resize: (width, height, data) => { updateviewport },
      'cell:pointerdown': () => {
        inertia.stop();
      },
      'blank:pointerdown': evt => {
        if (evt.type === 'touchstart')
          this.touch.touchStart(evt.originalEvent as TouchEvent, this.paper);
        else translate.start(evt.clientX!, evt.clientY!);
      },
      'blank:pointermove': evt => {
        if (evt.type === 'touchmove') {
          evt.stopPropagation();
          evt.preventDefault();
          this.touch.touchMove(evt.originalEvent as TouchEvent, this.state.transform);
        } else translate.move(evt.clientX!, evt.clientY!);
      },
      'blank:pointerup': evt => {
        if (evt.type === 'touchend' || evt.type === 'touchcancel') {
          this.touch.touchEnd(evt.originalEvent as TouchEvent, this.paper);
        } else {
          translate.move(evt.clientX!, evt.clientY!);
          translate.stop();
        }
        inertia.start();
      },
      'cell:mousewheel': (view, e, x, y, delta) => {
        zoom.start(delta, x, y);
      },
      'blank:mousewheel': (e, x, y, delta) => {
        zoom.start(delta, x, y);
      },
      'paper:pinch': (e, x, y, delta) => {
        console.log('PINCH', e, delta);
      },
    });

    this._loopId = requestAnimationFrame(this.loop.bind(this));
    // setTimeout(() => touchDrag(paper.el, { x: 100, y: 100, x1: 200, y1: 200 }), 1000);
    setTimeout(() => {
      pinchZoom(
        paper.el,
        { from: [0, 100], to: [0, 200] },
        { from: [400, 100], to: [500, 200] },
        10
      );
    }, 1000);
  }

  private loop(currentTime: number): void {
    const { paper, loop, state } = this;
    const frame = state.frameStart;
    this._loopId = requestAnimationFrame(loop.bind(this));

    frame.deltaTime = currentTime - frame.time;
    frame.time = currentTime;

    this.transformers.forEach(filter => filter());

    const t = state.transform;
    const ct = state.currentTransform;
    if (ct[0] !== t[0] || ct[1] !== t[1] || ct[2] !== t[2]) {
      paper.el.style.transform = `translate(${t[0]}px,${t[1]}px) scale(${t[2]})`;
      ct[0] = t[0];
      ct[1] = t[1];
      ct[2] = t[2];
    }
  }

  onDestroy(): void {
    cancelAnimationFrame(this._loopId);
  }
}
