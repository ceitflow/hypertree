import { Ease } from './ease.ts';
import { dia, util } from '@joint/core';
import { paperPatch } from './paper-patch';
import { InputController } from './inputs';
import { ScreenConfig, State } from './types.ts';

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
        animDurationMs: 200,
        animEaseFn: Ease.outQuint,
      },
      zoom: {
        inputEaseFn: Ease.linear,
        min: 0.1,
        max: 5,
        limitToViewport: false,
        animDurationMs: 200,
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

function ScreenTransformer(
  { transform: t, physicsTransform: pt, frameStartTransform: ft, extent, viewport }: State,
  paperStyle: CSSStyleDeclaration
) {
  return {
    nextFrame: () => {
      const t0 = t[0] + pt[0];
      const t1 = t[1] + pt[1];
      const t2 = t[2] + pt[2]; // scale + scaleX
      const t3 = t[2] + pt[3]; // scale + scaleY;

      if (ft[0] !== t0 || ft[1] !== t1 || ft[2] !== t2 || ft[3] !== t3) {
        // matrix(scaleX, skewY, skewX, scaleY, translateX, translateY);
        paperStyle.transform = `matrix(${t2}, 0, 0, ${t3}, ${t0}, ${t1})`;
        ft[0] = t0;
        ft[1] = t1;
        ft[2] = t2;
        ft[3] = t3;
      }
    },

    updateViewport: (data: dia.Size): void => {
      viewport[0] = 0;
      viewport[1] = 0;
      viewport[2] = data.width;
      viewport[3] = data.height;
    },

    updateExtentArea: (data: dia.Size): void => {
      extent[0] = 0;
      extent[1] = 0;
      extent[2] = data.width;
      extent[3] = data.height;
    },
  };
}
