import { timer, Timer } from 'd3';

export type ZoomOptions = {
  callback: (delta: number) => void;
};

export const createZoom = (opt: ZoomOptions) => {
  let targetZoom = 1;
  let currentZoom = 1;
  const frameLoop: Timer = timer(() => {
    if (Math.abs(targetZoom - currentZoom) < 0.01) {
      currentZoom = targetZoom;
      return;
    }
    currentZoom += currentZoom * 0.02 * (targetZoom - currentZoom >= 0 ? 1 : -1);
    opt.callback(currentZoom);
  });

  function zoom(target: number) {
    targetZoom = target;

    // todo timer run until currZoom === targetZoom

    // if (!isZooming) {
    // 	// start loop
    // 	frameLoop = new timer(() => {
    //
    // 	});
    // }
  }

  function interrupt() {
    // frameLoop?.stop();
  }

  return { zoom, interrupt };
};
