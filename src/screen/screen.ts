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

// pass in theme: new Theme('automatic' | ...)
export function Screen(paper: dia.Paper, container: HTMLElement) {
  const state: State = {
    transform: [0, 0, 1],
    physicsTransform: [0, 0, 0, 0],
    frameStartTransform: [0, 0, 1, 1],
    viewport: [0, 0, 0, 0],
    extent: [0, 0, 0, 0],
    viewportPadding: 0.5,

    frameStart: {
      time: 0,
      deltaTime: 0,
    },

    drag: {
      input: [0, 0],
      inputEaseFn: Ease.linear,
      output: [0, 0],
      animation: {
        active: false,
        timeStart: 0,
        durationMs: 200,
        easeFn: Ease.outExpo,
      },
    },
    zoom: {
      input: [0, 0, 0],
      min: 0.1,
      max: 3,
      inputEaseFn: Ease.inLog,
      output: [0, 0, 0],
      animation: {
        active: false,
        timeStart: 0,
        durationMs: 800,
        easeFn: Ease.outQuint,
      },
    },
    inertia: {
      input: [],
      maxInputSpeed: 15,
      inputEaseFn: Ease.linear,
      output: [0, 0],
      animation: {
        active: false,
        timeStart: 0,
        durationMs: 0,
        easeFn: Ease.outQuint,
      },
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
  // requestAnimationFrame(() =>
  //   setInterval(() => {
  //     const currentTime = Date.now();
  //     frameStart.deltaTime = currentTime - frameStart.time;
  //     frameStart.time = currentTime;
  //     transformers.forEach(fn => fn());
  //   }, 8)
  // );

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
