import { dia } from '@joint/core';
import { Ease } from './ease.ts';
import { State } from './types.ts';
import { paperPatch } from './paper-patch';
import { InputController } from './inputs';
import { DeviceController } from './devices';

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
        durationMs: 200,
        easeFn: Ease.outQuint,
      },
      limiter: {
        forces: [0, 0, 0, 0],
        toViewport: true,
      },
    },
    zoom: {
      input: [0, 0, 0],
      inputEaseFn: Ease.linear,
      min: 0.1,
      max: 5,
      animation: {
        active: false,
        timeStart: 0,
        output: [0, 0, 0],
        durationMs: 200,
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
  const input = InputController(state);
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
