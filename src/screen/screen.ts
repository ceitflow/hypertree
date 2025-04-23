import { dia } from '@joint/core';
import { State } from './types.ts';
import { Mouse, Touch } from './inputs';
import { paperPatch } from '../patches';
import { addContainerListeners } from './util.ts';
import { InputTransformer, PhysicsTransformer, ScreenTransformer } from './transformers';

export type ScreenType = ReturnType<typeof Screen>;

export function Screen(paper: dia.Paper, container: HTMLElement) {
  const state: State = {
    transform: [0, 0, 1],
    physicsTransform: [0, 0, 0, 0],
    currentTransform: [0, 0, 1, 1], // for comparing dirty state
    viewport: [0, 0, 1700, 800],
    extent: [-500, -500, 3000, 2000],
    viewportPadding: 0.5,

    frameStart: {
      time: 0,
      deltaTime: 0,
    },

    drag: {
      active: false,
      first: [0, 0],
      current: [0, 0],

      prevCurrent: [0, 0],
    },
    zoom: {
      active: false,
      min: 0.1,
      max: 3,
      durationMs: 150,
      targetZoom: 1,
      velocity: [0, 0, 0, 0],
    },

    // input extras
    constraint: {
      dx: 0,
      dy: 0,
      lastValidX: null,
      lastValidY: null,
      forces: [0, 0], // negative - left, top, positive - right, bottom
    },
    inertia: {
      active: false,
      // todo options: 1. strength (duration, quick or long), 2. distance (multiplier)
      cache: [],
      cacheSize: 2,
      velocityThreshold: 4,
      varStrength: 0,
      minVelocity: 0.1, // if lower then stop inertia
      strength: 70,
      velocity: [0, 0],
    },
  };
  let loopId = 0;

  const inputTransformer = InputTransformer(state);
  const physicsTransformer = PhysicsTransformer(state);
  const screenTransformer = ScreenTransformer(state, paper.el.style);
  const transformers = [inputTransformer.nextFrame, physicsTransformer.nextFrame, screenTransformer.nextFrame];

  const mouse = Mouse(inputTransformer, paper, container);
  const touch = Touch(inputTransformer);

  addContainerListeners(container, {
    mousedown: mouse.start,
    mousemove: mouse.move,
    mouseup: mouse.up,
    dblclick: (e: MouseEvent) => mouse.zoom(1, e.clientX, e.clientY),
    wheel: (e: WheelEvent) => mouse.zoom(-e.deltaY, e.clientX, e.clientY),

    // touch support
    touchstart: (e: TouchEvent) => {
      const view = paper.findView(e.target);
      if (view) {
        // todo if not multitouch
        // inertia.up();
      } else {
        touch.start((e as TouchEvent).touches);
      }
    },
    touchmove: (e: TouchEvent) => {
      if (touch.isActive()) {
        e.preventDefault();
        e.stopPropagation();
        touch.move((e as TouchEvent).changedTouches);
      }
    },
    touchend: (e: TouchEvent) => {
      if (touch.isActive()) {
        const { dblTap, multiReleased } = touch.up(e.changedTouches);
        if (dblTap) {
          const { x, y } = paper.clientToLocalPoint(dblTap[0], dblTap[1]);
          // zoom.zoomByStep(1, x, y);
          // inertia.up();
        }
        if (!touch.isActive() && !multiReleased) {
          // inertia.start();
        }
      }
    },
  });

  paper.on({
    // all: (...args) => console.log(args),
    resize: (width, height) => screenTransformer.updateContentArea({ width, height }),
  });

  // resize browser callback
  new ResizeObserver(entries => {
    screenTransformer.updateViewport(entries[0].contentRect);
  }).observe(container);

  const { frameStart } = state;

  const loop = (currentTime: number): void => {
    loopId = requestAnimationFrame(loop);

    frameStart.deltaTime = currentTime - frameStart.time;
    frameStart.time = currentTime;

    transformers.forEach(fn => fn());
  };

  screenTransformer.updateViewport(container.getBoundingClientRect());
  screenTransformer.updateContentArea(paper.getComputedSize());
  loopId = requestAnimationFrame(loop);

  paperPatch(paper, state.transform);

  return {
    inputTransformer,
    onDestroy: (): void => {
      cancelAnimationFrame(loopId);
    },
  };
}
