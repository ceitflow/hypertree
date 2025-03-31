import { dia } from '@joint/core';
import { State } from './types.ts';
import { Constrain, Inertia, Touch, Translate, Zoom } from './transformers';

export class Screen {
  private state: State = {
    transform: [0, 0, 1],
    currentTransform: [0, 0, 1], // for comparing dirty state
    viewport: [0, 0, 1700, 800],
    extent: [-500, -500, 3000, 2000],

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
      endMultitouchTimeout: null,
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
  private constraint = Constrain(this.state);

  private transformers = [
    this.translate.next,
    this.touch.next,
    this.zoom.next,
    this.inertia.next,
    this.constraint.next,
  ];

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
    this.addResizeListener(container);
    const { translate, touch, inertia, zoom } = this;

    const prevent = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const ua = navigator.userAgent;
    if ((/AppleWebKit/.test(ua) && !/Chrome/.test(ua)) || /\b(iPad|iPhone|iPod)\b/.test(ua)) {
      console.log('WEBKIT');
      paper.cells.getScreenCTM = () => {
        const matrix = paper.svg.getScreenCTM();
        if (!matrix) return matrix;
        const t = this.state.transform;
        matrix.a = t[2]; // scaleX
        matrix.d = t[2]; // scaleY
        return matrix;
      };
    }

    const addContainerListener = <Evt extends Event>(
      type: string,
      target: HTMLElement,
      callback: (e: Evt) => void
    ) =>
      target.addEventListener(type, e => {
        if (target.contains(e.target as Element)) {
          callback(e as Evt);
        }
      });

    // events listeners
    addContainerListener('mousedown', container, (e: MouseEvent) => {
      const view = paper.findView(e.target);
      if (view) {
        inertia.stop();
      } else {
        translate.start(e.clientX, e.clientY);
      }
    });
    addContainerListener('mousemove', container, (e: MouseEvent) => {
      if (this.state.translate.active) {
        translate.move(e.clientX, e.clientY);
      }
    });
    addContainerListener('mouseup', container, (e: MouseEvent) => {
      if (this.state.translate.active) {
        translate.stop();
        inertia.start();
      }
    });
    addContainerListener('dblclick', container, (e: MouseEvent) => {
      const { x, y } = this.paper.clientToLocalPoint(e.clientX, e.clientY);
      zoom.start(1, x, y);
    });
    addContainerListener('wheel', container, (e: WheelEvent) => {
      prevent(e);
      const { x, y } = this.paper.clientToLocalPoint(e.clientX, e.clientY);
      zoom.start(-e.deltaY, x, y);
    });
    // touch support
    addContainerListener('touchstart', container, (e: TouchEvent) => {
      const view = paper.findView(e.target);
      if (view) {
        inertia.stop();
      } else {
        touch.start((e as TouchEvent).touches);
      }
    });
    addContainerListener('touchmove', container, (e: TouchEvent) => {
      if (this.state.touch.active) {
        prevent(e);
        touch.move((e as TouchEvent).changedTouches);
      } else {
      }
    });
    addContainerListener('touchend', container, (e: TouchEvent) => {
      if (this.state.touch.active) {
        const { dblTap, multiReleased } = touch.up(e.changedTouches);
        if (dblTap) {
          const { x, y } = this.paper.clientToLocalPoint(dblTap[0], dblTap[1]);
          zoom.start(1, x, y);
          inertia.stop();
        }
        if (!this.state.touch.active && !multiReleased) {
          inertia.start();
        }
      }
    });

    paper.on({
      // all: (...args) => console.log(args),
      // 'element:pointermove': (elementView, evt, x, y) => console.log(evt.clientX, evt.clientY),
      resize: (width, height) => this.updateContentArea({ width, height }),
      // 'cell:pointerdown': () => {
      //   inertia.stop();
      // },
    });

    this.updateViewport(container.getBoundingClientRect());
    this.updateContentArea(paper.getComputedSize());
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

  private updateViewport(data: dia.Size): void {
    const v = this.state.viewport;
    v[0] = 0;
    v[1] = 0;
    v[2] = data.width;
    v[3] = data.height;
  }

  private updateContentArea(data: dia.Size): void {
    const e = this.state.extent;
    e[0] = 0;
    e[1] = 0;
    e[2] = data.width;
    e[3] = data.height;
  }

  private addResizeListener(container: HTMLElement) {
    const resize = new ResizeObserver(entries => {
      this.updateViewport(entries[0].contentRect);
    });
    resize.observe(container);
  }

  onDestroy(): void {
    cancelAnimationFrame(this._loopId);
  }
}
