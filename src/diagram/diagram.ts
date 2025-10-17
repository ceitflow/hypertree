import { Mouse } from './devices';
import { Paper } from './paper/paper.ts';
import { Layout } from './layout/layout.ts';
import { RawProgramGraph } from './graph/types.ts';

export async function Diagram(host: HTMLElement) {
  const paper = await Paper.Create(host);
  const mouse = Mouse(paper.scroller.controller);
  paper.background.on('mousedown', mouse.mousedown);
  paper.background.on('mousemove', mouse.mousemove);
  paper.background.on('mouseup', mouse.mouseup);
  paper.background.on('wheel', mouse.wheel);

  return {
    load: (json: RawProgramGraph) => {
      paper.graph.parseJson(json);
      Layout(paper.graph.model.root!);
      paper.reloadPaper();
      paper.scroller.controller.zoom.zoomToFit();
    },
  };
}
