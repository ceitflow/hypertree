import { dia } from '@joint/core';
import { State } from './types.ts';
import { Inertia, Translate, Zoom, Touch } from './transformers';

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
      first: null,
      firstTime: 0,
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

    touch: {
      touch0: null,
      touch1: null,
      prevS: null,
      active: false,
    },
  };
  private _loopId = 0;

  // screen transformers
  private translate = Translate(this.state);
  private inertia = Inertia(this.state);
  private zoom = Zoom(this.state);
  private touch = Touch(this.state);
  private transformers = [this.touch.next, this.inertia.next, this.zoom.next];

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

    const { translate, touch, inertia, zoom } = this;

    // events listeners
    addContainerListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      translate.start(e.clientX, e.clientY);
    });
    addContainerListener('mousemove', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      translate.move(e.clientX, e.clientY);
    });
    addContainerListener('mouseup', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      translate.stop();
      inertia.start();
    });
    addContainerListener('dblclick', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      zoom.start(1, e.clientX, e.clientY);
    });
    addContainerListener('wheel', (e: WheelEvent) => {
      const { x, y } = this.paper.clientToLocalPoint(e.clientX, e.clientY);
      zoom.start(-e.deltaY, x, y);
    });
    // touch support
    addContainerListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      touch.start((e as TouchEvent).touches);
    });
    addContainerListener('touchmove', e => {
      e.preventDefault();
      e.stopPropagation();
      touch.move((e as TouchEvent).changedTouches);
    });
    addContainerListener('touchend', e => {
      e.preventDefault();
      e.stopPropagation();
      touch.up((e as TouchEvent).changedTouches);
      inertia.start();
    });
    paper.el.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      touch.start((e as TouchEvent).touches);
    });
    paper.el.addEventListener('touchmove', e => {
      e.preventDefault();
      e.stopPropagation();
      touch.move((e as TouchEvent).changedTouches);
    });
    paper.el.addEventListener('touchend', e => {
      e.preventDefault();
      e.stopPropagation();
      touch.up((e as TouchEvent).changedTouches);
      inertia.start();
    });

    paper.on({
      // all: (...args) => console.log(args),
      // resize: (width, height, data) => { updateviewport },
      'blank:pointerdblclick': (evt, x, y) => {
        zoom.start(1, x, y);
      },
      'cell:pointerdown': () => {
        inertia.stop();
      },
      'blank:pointerdown': evt => {
        if (evt.type === 'mousedown') {
          translate.start(evt.clientX!, evt.clientY!);
        }
      },
      'blank:pointermove': evt => {
        if (evt.type === 'mousemove') translate.move(evt.clientX!, evt.clientY!);
      },
      'blank:pointerup': evt => {
        if (evt.type === 'mouseup') {
          translate.move(evt.clientX!, evt.clientY!);
          translate.stop();
          inertia.start();
        }
      },
      'cell:mousewheel': (view, e, x, y, delta) => {
        zoom.start(delta, x, y);
      },
      'blank:mousewheel': (e, x, y, delta) => {
        zoom.start(delta, x, y);
      },
    });

    this._loopId = requestAnimationFrame(this.loop.bind(this));
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
