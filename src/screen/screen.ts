import { dia } from '@joint/core';
import { State } from './types.ts';
import { Inertia, Translate, Zoom } from './transformers';

export class Screen {
  private state: State = {
    transform: [0, 0, 1],
    currentTransform: [0, 0, 1],

    frameStart: {
      time: 0,
      deltaTime: 0,
    },

    translate: {
      target: [0, 0],
      motionPerFrame: [],
      motionSize: 5,
      active: false,
    },

    inertia: {
      velocity: [0, 0],
      strength: 1,
      friction: 0.92,
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
  private transformers = [this.translate.next, this.inertia.next];

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
    /*addContainerListener('wheel', (evt: WheelEvent) => {
      zoom.start(evt.deltaY, evt.x, evt.y);
    });*/
    paper.on({
      // resize: (width, height, data) => { updateviewport },
      'cell:pointerdown': () => inertia.stop(),
      'blank:pointerdown': evt => translate.start(evt.clientX!, evt.clientY!),
      'blank:pointermove': evt => translate.move(evt.clientX!, evt.clientY!),
      'blank:pointerup': () => {
        translate.stop();
        inertia.start();
      },
      // 'cell:mousewheel': (view, e, x, y, delta) => zoom.start(delta, x, y),
      // 'blank:mousewheel': (e, x, y, delta) => zoom.start(delta, x, y),
      // 'paper:pinch': (...args) => console.log(args),
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
    if (ct[0] !== t[0] || ct[1] !== t[1] || ct[2] !== t[2])
      paper.el.style.transform = `translate(${t[0]}px,${t[1]}px) scale(${t[2]})`;
  }

  onDestroy(): void {
    cancelAnimationFrame(this._loopId);
  }
}
