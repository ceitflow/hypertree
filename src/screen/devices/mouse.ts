import { dia } from '@joint/core';
import { DeviceType } from './types.ts';
import { InputTransformerType } from '../transformers';

export type MouseConfig = {};

export function Mouse(): DeviceType<MouseConfig> {
  let isDragging = false;
  const pointerCaptureId = 1;
  const wheelStrength = 0.2;
  const dblClickStrength = 1;

  return {
    type: 'mouse',
    init: (input: InputTransformerType, paper: dia.Paper) => ({
      mousedown: (e: MouseEvent) => {
        if (e.buttons !== 1) return;
        paper.el.setPointerCapture(pointerCaptureId);
        if (paper.findView(e.target)) {
          input.inertia.stop();
        }
        else {
          isDragging = true;
          input.inertia.stop();
          input.drag.start(e.clientX, e.clientY);
        }
      },
      mousemove: (e: MouseEvent) => {
        if (isDragging) input.drag.move(e.clientX, e.clientY);
      },
      mouseup: (e: MouseEvent) => {
        paper.el.releasePointerCapture(pointerCaptureId);
        if (isDragging) {
          input.drag.stop();
          input.inertia.start();
        }
        isDragging = false;
      },
      dblclick: (e: MouseEvent) => {
        input.zoom.zoomStep(input.invert(e.clientX, e.clientY), dblClickStrength);
      },
      wheel: (e: WheelEvent) => {
        const delta = -e.deltaY;
        if (delta !== 0) {
          input.zoom.zoomStep(input.invert(e.clientX, e.clientY), wheelStrength * Math.sign(delta));
        }
      },
    }),
    toggle: on => {
      //
    },
    setConfig: config => {
      //
    },
  };
}
