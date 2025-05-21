import { dia } from '@joint/core';
import { DeviceType } from './types.ts';
import { ScreenController } from '../screen';

export type MouseConfig = {
  // map?: Partial ListenerMap
};

// todo what about multiselect?
//  paper restrictTranslate


// (user code)
// paper.on('element:pointerclick', () => mouse.addSelection(view)) ? DragController is needed
//
//
// mouse.mousedown -> if (view) screen.addSelection
//
// then autoscroll (if enabled) reads selection-controller and compares with viewport

// SelectionController config
// - mode: single|multi|custom

export function Mouse({ drag, zoom, inertia, invert }: ScreenController, paper: dia.Paper): DeviceType {
  let isDragging = false;
  const pointerCaptureId = 1;
  const wheelStrength = 0.2;
  const dblClickStrength = 1;
  // todo extendability
  //  mousedown: ...
  //  - beforeCallback()
  //  - ...
  //  - afterCallback()
  // or a map with user fn overwriting default one

  return {
    id: 'mouse',
    listeners: {
      mousedown: (e: MouseEvent) => {
        if (e.buttons !== 1) return;
        paper.el.setPointerCapture(pointerCaptureId);
        if (paper.findView(e.target)) {
          // todo Graph.findAtPoint() // todo move devices up?
          inertia.stop();
        } else {
          isDragging = true;
          inertia.stop();
          drag.start(e.clientX, e.clientY);
        }
      },
      mousemove: (e: MouseEvent) => {
        if (isDragging) drag.move(e.clientX, e.clientY);
        // todo if isCellDragging: autoscroll
        /*
          if cell dragging near Viewport border (screen.isViewportBorder(point))
          screen.scroll()
         */
      },
      mouseup: (e: MouseEvent) => {
        paper.el.releasePointerCapture(pointerCaptureId);
        if (isDragging) {
          drag.stop();
          inertia.start();
        }
        isDragging = false;
      },
      dblclick: (e: MouseEvent) => {
        zoom.zoomStep(invert(e.clientX, e.clientY), dblClickStrength);
      },
      wheel: (e: WheelEvent) => {
        const delta = -e.deltaY;
        if (delta !== 0) {
          zoom.zoomStep(invert(e.clientX, e.clientY), wheelStrength * Math.sign(delta));
        }
      },
    }
  };
}
