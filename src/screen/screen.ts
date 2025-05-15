import { dia } from '@joint/core';
import { State } from './types.ts';
import { paperPatch } from '../patches';
import { DeviceController } from './devices';
import { Ease, InputTransformer, ScreenTransformer } from './transformers';

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

    physics: {
      active: false,
      input: [0, 0],
      currentInput: [0,0],
      maxCompressPercent: 0.1,
      stiffness: 2,
      inputEaseFn: Ease.outCirc,
      animation: {
        active: false,
        durationMs: 500,
        easeFn: Ease.outBack,
        timeStart: 0,
        output: [0, 0],
      },
    },

    drag: {
      current: [0, 0],
      input: [0, 0, 0],
      animation: {
        active: false,
        timeStart: 0,
        output: [0, 0],
        durationMs: 0,
        easeFn: Ease.outBack,
      },
      limiter: {
        forces: [0, 0, 0, 0],
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
        forces: [0, 0, 0, 0],
      },
    },
    inertia: {
      input: [],
      inputCacheDurationMs: 20,
      friction: 0.91,
      durationMultiplier: 1,
      output: [0, 0],
      turboVelocityThreshold: 14,
      minVelocity: 1,
      animation: {
        active: false,
        timeStart: 0,
        durationMs: 0,
        easeFn: Ease.outQuint,
      },
      limiter: {
        forces: [0, 0, 0, 0],
        toViewport: true,
      },
    },
  };
  let loopId = 0;

  const devices = DeviceController();
  const screen = ScreenTransformer(state, paper.el.style);
  const input = InputTransformer(state);
  const transformers = [
    input.physics.nextFrame,
    input.drag.nextFrame,
    input.zoom.nextFrame,
    input.inertia.nextFrame,
    /*input.programmatic.nextFrame*/ // todo or actually a device?
    screen.nextFrame
  ];
  devices.init(input, paper, container);

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
    input,
    state,
    onDestroy: (): void => {
      cancelAnimationFrame(loopId);
    },
  };
}
