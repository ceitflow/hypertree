import { dia } from '@joint/core';
import { Point, TransformType } from './types.ts';

// todo move to transformers
// it ignores any touches above the first 2
export class Touch {
  private gesture: Gesture | null = null;
  private touchfirst: Point | null = null;
  private touchstarting: NodeJS.Timeout | null = null;
  private touchDelay = 500;
  private tapDistance = 10;

  touchStart(evt: TouchEvent, transform: TransformType, paper: dia.Paper): void {
    const touches = evt.touches;
    if (evt.changedTouches.length === touches.length) {
      this.gesture = new Gesture(transform[2]);
    }
    const g: Gesture = this.gesture!;

    for (let i = 0; i < touches.length; ++i) {
      const { clientX, clientY, identifier } = touches[i];
      const { x, y } = paper.clientToLocalPoint(clientX, clientY);
      if (!g.touch0) {
        g.touch0 = [clientX, clientY];
        g.touch0Id = identifier;
        g.touch0Paper = [x, y];
        g.taps = 1 + (this.touchstarting ? 1 : 0);
        if (g.taps < 2) {
          this.touchfirst = [x, y];
          this.touchstarting = setTimeout(() => (this.touchstarting = null), this.touchDelay);
        }
        g.activeTouches++;
      } else if (!g.touch1 && g.touch0[1] !== identifier) {
        g.touch1 = [clientX, clientY];
        g.touch1Id = identifier;
        g.touch1Paper = [x, y];
        g.taps = 0;
      }
    }

    if (this.touchstarting) {
      clearTimeout(this.touchstarting);
      this.touchstarting = null;
    }
  }

  touchMove(evt: TouchEvent, transform: TransformType): void {
    if (!this.gesture) return;
    const g = this.gesture;
    const touches = evt.changedTouches;

    // updates touches state
    for (let i = 0; i < touches.length; ++i) {
      const { clientX, clientY, identifier } = touches[i];
      if (g.touch0 && g.touch0Id === identifier) {
        g.prevT0 = g.touch0;
        g.touch0 = [clientX, clientY]; // if first touch moved
      } else if (g.touch1 && g.touch1Id === identifier) {
        g.touch1 = [clientX, clientY]; // if second touch moved
      }
    }

    // calculate translation and zoom
    if (g.touch1) {
      // PINCH
      // 2 touches can move apart - zoom
      // 2 touches can move together - translate
      // 1 touch can move
      const touch0 = g.touch0!;
      const fixTouch0 = g.touch0Paper!;
      const touch1 = g.touch1;
      const fixTouch1 = g.touch1Paper!;
      console.log(touch0, touch1);

      const xDiff = touch1[0] - touch0[0];
      const yDiff = touch1[1] - touch0[1];
      const currentLength = xDiff * xDiff + yDiff * yDiff;

      const fixXDiff = fixTouch1[0] - fixTouch0[0];
      const fixYDiff = fixTouch1[1] - fixTouch0[1];
      const fixLength = fixXDiff * fixXDiff + fixYDiff * fixYDiff;
      if (fixLength === 0) console.log('0'); // todo 0

      const scale = fixLength
        ? Math.min(Math.max(Math.sqrt(currentLength / fixLength), 0.1), 3)
        : g.scale;
      const midPoint = [(touch0[0] + touch1[0]) / 2, (touch0[1] + touch1[1]) / 2];
      // needed to distinguish between zoom and both touches translating
      const fixedMidPoint = [(fixTouch0[0] + fixTouch1[0]) / 2, (fixTouch0[1] + fixTouch1[1]) / 2];

      const newX = midPoint[0] - fixedMidPoint[0] * transform[2];
      const newY = midPoint[1] - fixedMidPoint[1] * transform[2];
      const dx = newX - g.prevPinch[0];
      const dy = newY - g.prevPinch[1];
      const dscale = scale - g.scale;
      g.prevPinch = [newX, newY];
      g.scale = scale;
      transform[0] += dx;
      transform[1] += dy;
      transform[2] += dscale;
      console.log('transformer', transform);
    } else if (g.touch0) {
      // Just translate
      const x = g.touch0[0] - g.prevT0![0];
      const y = g.touch0[1] - g.prevT0![1];
      transform[0] += x;
      transform[1] += y;
    } else {
      return;
    }
  }

  touchEnd(evt: TouchEvent, paper: dia.Paper): void {
    const g = this.gesture;
    if (!g) return;
    const touches = evt.changedTouches;

    for (let i = 0; i < touches.length; ++i) {
      const { identifier } = touches[i];
      if (g.touch0 && g.touch0[1] === identifier)
        g.touch0 = null; // if touch0 released
      else if (g.touch1 && g.touch1[1] === identifier) g.touch1 = null; // if touch1 released
    }

    if (g.touch1 && !g.touch0) {
      // make touch1 to touch0 if first touch was released
      g.touch0 = g.touch1;
      g.touch1 = null;
    }
    if (g.touch0) {
      const up = paper.clientToLocalPoint(g.touch0[0], g.touch0[1]);
      g.touch0Paper = [up.x, up.y];
      return;
    }

    g.activeTouches--;
    if (g.activeTouches === 0) {
      this.gesture = null;
    }

    // If this was a dbltap
    if (g.taps === 2) {
      const lastTouch = touches[touches.length - 1];
      const t = [lastTouch.clientX, lastTouch.clientY];
      if (Math.hypot(this.touchfirst![0] - t[0], this.touchfirst![1] - t[1]) < this.tapDistance) {
        console.log('DBL Tap'); // call dblclick fn
      }
    }
  }
}

class Gesture {
  activeTouches = 0;
  taps = 0;
  scale = 0;
  prevT0: Point = [0, 0]; // for single touch translating
  prevPinch: Point = [0, 0];

  touch0: Point | null = null;
  touch0Id: number | null = null;
  touch0Paper: Point | null = null; // fixed point created in touchstart

  touch1: Point | null = null;
  touch1Id: number | null = null;
  touch1Paper: Point | null = null; // fixed point created in touchstart

  constructor(scale: number) {
    this.scale = scale;
  }
}
