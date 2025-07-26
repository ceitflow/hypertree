import { Mouse } from './devices';
import { Paper } from './paper/paper.ts';
import { RawDir } from './graph/types.ts';

export async function Diagram(host: HTMLElement) {
  const paper = await Paper.Create(host);
  const mouse = Mouse(paper.scroller.controller);
  paper.background.on('mousedown', mouse.mousedown);
  paper.background.on('mousemove', mouse.mousemove);
  paper.background.on('mouseup', mouse.mouseup);
  paper.background.on('wheel', mouse.wheel);

  return {
    load: (json: RawDir) => {
      paper.graph.parseJson(json);
      paper.reloadPaper();
      paper.scroller.controller.zoom.zoomToFit();
    },
  };
}
