import { dia } from '@joint/core';
import { State } from './types.ts';
import { Mouse, Touch } from './devices';
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
    frameStartTransform: [0, 0, 1, 1],
    viewport: [0, 0, 0, 0],
    extent: [0, 0, 0, 0],
    viewportPadding: 0.5,

    frameStart: {
      time: 0,
      deltaTime: 0,
    },

    physics: {
      active: false,
      input: [0, 0],
    },

    drag: {
      current: [0, 0],
      input: [0, 0, 0],
      animation: {
        active: false,
        timeStart: 0,
        output: [0, 0],
        durationMs: 200,
        easeFn: Ease.outBack,
      },
      limiter: {
        forces: [0, 0],
        toViewport: true,
      },
    },
    zoom: {
      input: [0, 0, 0],
      inputEaseFn: Ease.inLog,
      min: 0.1,
      max: 5,
      animation: {
        active: false,
        timeStart: 0,
        output: [0, 0, 0],
        durationMs: 500,
        easeFn: Ease.outQuint,
      },
      limiter: {
        forces: [0, 0],
      },
    },
    inertia: {
      input: [],
      inputCacheDurationMs: 20,
      friction: 0.91,
      durationMultiplier: 0.75,
      output: [0, 0],
      turboVelocityThreshold: 14,
      minVelocity: 1,
      defaultEaseFn: Ease.noop,
      animation: {
        active: false,
        timeStart: 0,
        durationMs: 0,
        easeFn: undefined,
      },
      limiter: {
        forces: [0, 0],
        toViewport: true,
      },
    },
  };
  let loopId = 0;

  const input = InputTransformer(state);
  const physics = PhysicsTransformer(state);
  const screen = ScreenTransformer(state, paper.el.style);
  const transformers = [input.nextFrame, /*programmaticInput.nextFrame*/ physics.nextFrame, screen.nextFrame];

  const mouse = Mouse(input, paper, container);
  const touch = Touch(input, paper);
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
      screen.updateExtentArea({ width, height });
    },
  });

  // resize browser callback
  new ResizeObserver(entries => {
    screen.updateViewport(entries[0].contentRect);
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
  screen.updateViewport(container.getBoundingClientRect());
  screen.updateExtentArea(paper.getComputedSize());
  loopId = requestAnimationFrame(loop);

  paperPatch(paper, state.transform);

  return {
    inputTransformer: input,
    state,
    onDestroy: (): void => {
      cancelAnimationFrame(loopId);
    },
  };
}
