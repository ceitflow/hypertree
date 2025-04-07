import { dia } from '@joint/core';
import { State } from './types.ts';

export type StoreType = ReturnType<typeof Store>;

export function Store() {
  const state: State = {
    transform: [0, 0, 1],
    currentTransform: [0, 0, 1], // for comparing dirty state
    viewport: [0, 0, 1700, 800],
    extent: [-500, -500, 3000, 2000],

    frameStart: {
      time: 0,
      deltaTime: 0,
    },

    motion: {
      cache: [],
      cacheSize: 5,

      mouse: {
        target: [0, 0],
        active: false,
      },

      inertia: {
        velocity: [0, 0],
        strength: 0.5,
        friction: 0.93,
        brakeFriction: 0.78,
        minVelocity: 0.5,
        active: false,
      },

      touch: {
        touchDelay: 500,
        tapDistance: 10,

        touch0: null,
        touch1: null,
        prevScale: null,
        taps: 0,
        prevTouchTimeout: null,
        endMultitouchTimeout: null,
        firstTouch: null,
        active: false,
      },
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

  const addMotion = (x: number, y: number, reset?: boolean): void => {
    const { cache, cacheSize } = state.motion;
    if (reset) cache.splice(0, cache.length, [x, y]);
    else cache.push([x, y]);
    if (cache.length > cacheSize) cache.shift();
  };

  const updateViewport = (data: dia.Size): void => {
    const { viewport } = state;
    viewport[0] = 0;
    viewport[1] = 0;
    viewport[2] = data.width;
    viewport[3] = data.height;
  };

  const updateContentArea = (data: dia.Size): void => {
    const { extent } = state;
    extent[0] = 0;
    extent[1] = 0;
    extent[2] = data.width;
    extent[3] = data.height;
  };

  return {
    state,
    addMotion,
    updateViewport,
    updateContentArea,
  };
}
