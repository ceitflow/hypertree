import './styles.css';
import { dia } from '@joint/core';
import { Screen } from './screen';
import { createTestUI } from './toolbar-test-ui';
import { CreateNodeShape } from './util/shapes.ts';
import { loadPixelsFromImage } from './util/load-pixels-image';

(async function init() {
  const container = document.getElementById('viewport')!;
  const paperContainer = document.getElementById('paper')!;
  const graph = new dia.Graph();
  const paper = new dia.Paper({
    el: paperContainer,
    model: graph,
    autoFreeze: true,
    width: 2500,
    height: 1700,
    async: true,
    defaultRouter: {
      name: 'manhattan',
    },
  });
  createTestUI(container);
  const screen = Screen(paper, container);
  console.log(screen);
  CreateNodeShape().addTo(graph);
  await loadPixelsFromImage(graph, paper);
  screen.inputTransformer.zoomToFit([100, 100]);
})();
