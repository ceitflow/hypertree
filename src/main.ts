import './styles.css';
import { dia } from '@joint/core';
import { Diagram } from './diagram';
import { createTestUI } from './toolbar-test-ui';
import { CreateNodeShape } from './util/shapes.ts';
import { loadPixelsFromImage } from './util/load-pixels-image';

(async function init() {
  const container = document.getElementById('viewport')!;
  const paperContainer = document.getElementById('paper')!;
  const graph = new dia.Graph({  });
  const paper = new dia.Paper({
    el: paperContainer,
    model: graph,
    autoFreeze: true,
    width: 2500,
    height: 1700,
    async: true,
    restrictTranslate: true,
    defaultRouter: {
      name: 'manhattan',
    },
  });
  createTestUI(container);
  const diagram = Diagram(new dia.Graph(), paper, container);
  CreateNodeShape().addTo(graph);
  await loadPixelsFromImage(graph, paper);
  diagram.screen.controller.zoom.zoomToFit([100, 100]);
  console.log(diagram);
})();
