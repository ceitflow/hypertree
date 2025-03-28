import { dia } from '@joint/core';
import { State } from './types.ts';
import { Inertia, Translate, Zoom, Touch } from './transformers';

export class Screen {
  private state: State = {
    transform: [0, 0, 1],
    currentTransform: [0, 0, 1], // for comparing dirty state
    motionPerFrame: [],
    motionSize: 5,

    frameStart: {
      time: 0,
      deltaTime: 0,
    },

    translate: {
      target: [0, 0],
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
      touchDelay: 500,
      tapDistance: 10,

      touch0: null,
      touch1: null,
      prevScale: null,
      taps: 0,
      prevTouchTimeout: null,
      firstTouch: null,
      active: false,
    },
  };
  private _loopId = 0;

  // screen transformers
  private translate = Translate(this.state);
  private inertia = Inertia(this.state);
  private zoom = Zoom(this.state);
  private touch = Touch(this.state);

  private transformers = [this.zoom.next, this.inertia.next];

  /*
  // todo squish animation (apple like)
  // animation transformer can be self correcting (if user translates it compensates with some delay)
  // extent (size of screen) // default is container getClientBBox()
  // scaleExtent
  // translateExtent

  // output
  // - viewport
  // - visible cells (quadtree)
*/

  constructor(
    private paper: dia.Paper,
    container: HTMLElement
  ) {
    const addListeners = (host: HTMLElement) => {
      const { translate, touch, inertia, zoom } = this;

      const addContainerListener = <Evt extends Event>(
        type: string,
        target: HTMLElement,
        callback: (e: Evt) => void
      ) =>
        target.addEventListener(type, e => {
          if (target.contains(e.target as Element)) {
            e.preventDefault();
            e.stopPropagation();
            callback(e as Evt);
          }
        });

      // events listeners
      addContainerListener('mousedown', host, (e: MouseEvent) => {
        translate.start(e.clientX, e.clientY);
        inertia.reset();
      });
      addContainerListener('mousemove', host, (e: MouseEvent) => {
        translate.move(e.clientX, e.clientY);
      });
      addContainerListener('mouseup', host, (e: MouseEvent) => {
        translate.stop();
        inertia.start();
      });
      addContainerListener('dblclick', host, (e: MouseEvent) => {
        const { x, y } = this.paper.clientToLocalPoint(e.clientX, e.clientY);
        zoom.start(1, x, y);
      });
      addContainerListener('wheel', host, (e: WheelEvent) => {
        const { x, y } = this.paper.clientToLocalPoint(e.clientX, e.clientY);
        zoom.start(-e.deltaY, x, y);
      });
      // touch support
      addContainerListener('touchstart', host, e => {
        touch.start((e as TouchEvent).touches);
        inertia.reset();
      });
      addContainerListener('touchmove', host, e => {
        touch.move((e as TouchEvent).changedTouches);
      });
      addContainerListener('touchend', host, (e: TouchEvent) => {
        const { dblTap } = touch.up(e.changedTouches);
        if (dblTap) {
          const { x, y } = this.paper.clientToLocalPoint(dblTap[0], dblTap[1]);
          zoom.start(1, x, y);
        }
        inertia.start();
      });
    };

    addListeners(container);

    /*paper.on({
      // all: (...args) => console.log(args),
      // resize: (width, height, data) => { updateviewport },
      'cell:pointerdown': () => {
        inertia.stop();
      },
    });*/

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
