import { dia } from '@joint/core';
import { State } from './types.ts';
import { Mouse, Touch } from './inputs';
import { paperPatch } from '../patches';
import { Ease, InputTransformer, PhysicsTransformer, ScreenTransformer } from './transformers';

export const addContainerListeners = (container: HTMLElement, map: { [type: string]: (e: any) => void }) => {
  Object.entries(map).forEach(([type, callback]) => {
    document.addEventListener(
      type,
      e => {
        if (container.contains(e.target as Element)) {
          callback(e);
        }
      },
      { passive: false }
    );
  });
};

export function Screen(paper: dia.Paper, container: HTMLElement) {
  const state: State = {
    transform: [0, 0, 1],
    physicsTransform: [0, 0, 0, 0],
    frameStartTransform: [0, 0, 1, 1],
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
      timeStart: 0,
      min: 0.1,
      max: 3,
      durationMs: 300,
      inputStep: 1,
      velocity: [0, 0, 0],
      easeFn: Ease.outQuint,
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
      timeStart: 0,
      cache: [],
      velocity: [0, 0],
      stopVelocity: 0.1, // if lower then stop inertia
      durationMs: 0,
      easeFn: Ease.outQuint,
    },
  };
  let loopId = 0;

  const inputTransformer = InputTransformer(state);
  const physicsTransformer = PhysicsTransformer(state);
  const screenTransformer = ScreenTransformer(state, paper.el.style);
  const transformers = [inputTransformer.nextFrame, physicsTransformer.nextFrame, screenTransformer.nextFrame];

  const mouse = Mouse(inputTransformer, paper, container);
  const touch = Touch(inputTransformer, paper);

  addContainerListeners(container, {
    mousedown: mouse.start,
    mousemove: mouse.move,
    mouseup: mouse.up,
    dblclick: mouse.dblClick,
    wheel: mouse.zoom,

    touchstart: touch.start,
    touchmove: touch.move,
    touchend: touch.up,
  });

  paper.on({
    resize: (width, height) => {
      screenTransformer.updateExtentArea({ width, height });
    },
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

  // for screen refresh rate testing
  // setInterval(() => {
  //   const currentTime = Date.now();
  //   frameStart.deltaTime = currentTime - frameStart.time;
  //   frameStart.time = currentTime;
  //   transformers.forEach(fn => fn());
  // }, 8);

  screenTransformer.updateViewport(container.getBoundingClientRect());
  screenTransformer.updateExtentArea(paper.getComputedSize());
  loopId = requestAnimationFrame(loop);

  paperPatch(paper, state.transform);

  return {
    inputTransformer,
    onDestroy: (): void => {
      cancelAnimationFrame(loopId);
    },
  };
}
