import { Timer, timer } from 'd3';

export type InertiaOptions = {
  friction: number;
  callback: (dx: number, dy: number) => void;
};

export type Inertia = {
  start: (_x: number, _y: number) => void;
  move: (_x: number, _y: number) => void;
  animate: () => void;
  interrupt: () => void;
};
// animates translation over time until it decelerates to 0
export const createInertia = (opt: InertiaOptions): Inertia => {
  let x = 0;
  let y = 0;
  let prevX = 0;
  let prevY = 0;
  let vdx = 0;
  let vdy = 0;
  let frameLoop: Timer | null = null; // runs callback every browser frame (60Hz or more depending on refresh rate)

  function start(_x: number, _y: number): void {
    interrupt();
    x = _x;
    y = _y;
    prevX = _x;
    prevY = _y;
    frameLoop = timer(() => {
      vdx = x - prevX;
      vdy = y - prevY;
      prevX = x;
      prevY = y;
    });
  }

  function move(_x: number, _y: number): void {
    x = _x;
    y = _y;
  }

  function animate(): void {
    frameLoop?.stop();
    frameLoop = timer(() => {
      opt.callback(vdx, vdy);
      vdx *= opt.friction;
      vdy *= opt.friction;
      if (Math.abs(vdx) < 0.1 && Math.abs(vdy) < 0.1) {
        frameLoop?.stop();
      }
    });
  }

  function interrupt(): void {
    frameLoop?.stop();
    x = 0;
    y = 0;
    prevX = 0;
    prevY = 0;
    vdx = 0;
    vdy = 0;
  }

  return { start, move, animate, interrupt };
};
