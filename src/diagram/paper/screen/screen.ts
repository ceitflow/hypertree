import { Ease } from './plugins';
import { InputController } from './inputs';
import { State, UpdateTransform } from './types.ts';
import { ScreenTransformer } from './screen-transformer.ts';

export type ScreenType = ReturnType<typeof Screen>;

export function Screen(updateTransform: UpdateTransform) {
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
        limitToViewport: false,
        animDurationMs: 0,
        animEaseFn: Ease.outQuint,
      },
      zoom: {
        inputEaseFn: Ease.inLog,
        min: 0.01,
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

  const transformer = ScreenTransformer(state, updateTransform);
  const controller = InputController(state);
  const transformers = [
    controller.physics.nextFrame,
    controller.drag.nextFrame,
    controller.zoom.nextFrame,
    controller.inertia.nextFrame,
    transformer.nextFrame,
  ];

  // for screen refresh rate testing
  // requestAnimationFrame(() =>
  //   setInterval(() => {
  //     const currentTime = Date.now();
  //     frameStart.deltaTime = currentTime - frameStart.time;
  //     frameStart.time = currentTime;
  //     transformers.forEach(fn => fn());
  //   }, 8)
  // );

  const { frameStart } = state;
  console.log(state);

  return {
    controller,
    transformer,
    nextFrame: (currentTime: number) => {
      frameStart.deltaTime = currentTime - frameStart.time;
      frameStart.time = currentTime;
      transformers.forEach(fn => fn());
    },
  };
}
