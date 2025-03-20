import { Point, TransformType } from './types.ts';
import { dia } from '@joint/core';

export class Touch {
  touch0: { id: number; point: Point; fixed: Point } | null = null;
  touch1: { id: number; point: Point; fixed: Point } | null = null;

  touchStart(evt: TouchEvent, paper: dia.Paper): void {
    const touches = evt.touches;

    for (let i = 0; i < touches.length; i++) {
      const { clientX, clientY, identifier } = touches[i];
      if (!this.touch0) {
        const { x, y } = paper.clientToLocalPoint(clientX, clientY);
        this.touch0 = { point: [clientX, clientY], id: identifier, fixed: [x, y] };
      } else if (!this.touch1 && identifier !== this.touch0.id) {
        const { x, y } = paper.clientToLocalPoint(clientX, clientY);
        this.touch1 = { point: [clientX, clientY], id: identifier, fixed: [x, y] };
      }
    }
  }

  touchMove(evt: TouchEvent, transform: TransformType): void {
    const touches = evt.changedTouches;
    const { touch0, touch1 } = this;
    let updated0: Point | undefined;
    let updated1: Point | undefined;

    for (let i = 0; i < touches.length; i++) {
      const { clientX, clientY, identifier } = touches[i];
      if (touch0?.id === identifier) {
        updated0 = [clientX, clientY];
      } else if (touch1?.id === identifier) {
        updated1 = [clientX, clientY];
      }
    }

    if (touch1 && touch0) {
      // pinch
      updated0 = updated0 ?? touch0.point;
      updated1 = updated1 ?? touch1.point;

      const dp =
        (updated1[0] - updated0[0]) * (updated1[0] - updated0[0]) +
        (updated1[1] - updated0[1]) * (updated1[1] - updated0[1]);
      const dl =
        (touch1.fixed[0] - touch0.fixed[0]) * (touch1.fixed[0] - touch0.fixed[0]) +
        (touch1.fixed[1] - touch0.fixed[1]) * (touch1.fixed[1] - touch0.fixed[1]);
      const dScale = Math.sqrt(dp / dl) - 1; // this is ratio of current dst / prev dst
      const currentMidPoint = [updated0[0] + updated1[0] / 2, updated0[1] + updated1[1] / 2];
      const prevMidPoint = [
        touch0.fixed[0] + touch1.fixed[0] / 2,
        touch0.fixed[1] + touch1.fixed[1] / 2,
      ];
      const scale = transform[2] + dScale;
      const x = currentMidPoint[0] - prevMidPoint[0] * scale;
      const y = currentMidPoint[1] - prevMidPoint[1] * scale;
      console.log(x, y, scale);
      touch0.point = updated0;
      touch1.point = updated1;
    } else if (touch0) {
      // translate only
      if (!updated0) return; // if no movement then skip
      const diff = [updated0[0] - touch0.point[0], updated0[1] - touch0.point[1]];
      touch0.point = updated0;
      transform[0] += diff[0];
      transform[1] += diff[1];
    }
  }

  touchEnd(evt: TouchEvent, paper: dia.Paper): void {
    const touches = evt.changedTouches;
    const { touch0, touch1 } = this;
    for (let i = 0; i < touches.length; i++) {
      const { identifier } = touches[i];
      if (touch0?.id === identifier) {
        this.touch0 = null;
      } else if (touch1?.id === identifier) {
        this.touch1 = null;
      }
    }
    if (touch1 && !touch0) {
      this.touch0 = this.touch1;
      this.touch1 = null;
    }
    // updates ref point
    if (touch0) {
      const { x, y } = paper.clientToLocalPoint(touch0.point[0], touch0.point[1]);
      touch0.fixed = [x, y];
    }
  }
}
