import { paperPatch, Ease } from './plugins';
import { dia, util } from '@joint/core';
import { InputController } from './inputs';
import { ScreenConfig, State } from './types.ts';
import { ScreenTransformer } from './screen-transformer.ts';

export type ScreenType = ReturnType<typeof Screen>;

export function Screen(paper: dia.Paper, container: HTMLElement) {
  const state: State = {
    transform: [0, 0, 1],
    physicsTransform: [0, 0, 0, 0],
    frameStartTransform: [0, 0, 1, 1],
    viewport: [0, 0, 0, 0],
    extent: [0, 0, 0, 0],

    // default config
    config: {
      viewportPadding: 0.5,

      physics: {
        maxCompressPercent: 0.1,
        stiffness: 2,
        inputEaseFn: Ease.outCirc,
        animDurationMs: 500,
        animEaseFn: Ease.outBack,
      },
      drag: {
        limitToViewport: true,
        animDurationMs: 500,
        animEaseFn: Ease.outQuint,
      },
      zoom: {
        inputEaseFn: Ease.inLog,
        min: 0.1,
        max: 5,
        limitToViewport: false,
        animDurationMs: 500,
        animEaseFn: Ease.outQuint,
      },
      inertia: {
        inputCacheDurationMs: 20,
        friction: 0.91,
        durationMultiplier: 1,
        turboVelocityThreshold: 14,
        minVelocity: 1,
        limitToViewport: true,
        animEaseFn: Ease.outQuint,
      },
    },

    frameStart: {
      time: 0,
      deltaTime: 0,
    },

    physics: {
      active: false,
      input: [0, 0],
      currentInput: [0, 0],
      timeStart: 0,
      output: [0, 0],
    },

    drag: {
      active: false,
      current: [0, 0],
      input: [0, 0, 0],
      timeStart: 0,
      output: [0, 0],
      limiterForces: [0, 0, 0, 0],
    },
    zoom: {
      active: false,
      input: [0, 0, 0],
      timeStart: 0,
      output: [0, 0, 0],
      limiterForces: [0, 0, 0, 0],
    },
    inertia: {
      active: false,
      input: [],
      output: [0, 0],
      timeStart: 0,
      animDurationMs: 0,
      limiterForces: [0, 0, 0, 0],
    },
  };

  let loopId = 0;

  const screenTransformer = ScreenTransformer(state, paper.el.style);
  const controller = InputController(state);
  const transformers = [
    controller.physics.nextFrame,
    controller.drag.nextFrame,
    controller.zoom.nextFrame,
    controller.inertia.nextFrame,
    screenTransformer.nextFrame,
  ];

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
    paper,
    container,
    // canvas
    controller,
    // plugins,
    getConfig: (): ScreenConfig => state.config,
    setConfig: (config: ScreenConfig) => {
      util.defaultsDeep(state.config, config);
    },
    onDestroy: (): void => {
      cancelAnimationFrame(loopId);
    },
  };
}
