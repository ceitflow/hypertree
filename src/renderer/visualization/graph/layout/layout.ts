import { GraphData } from '../index';
import { Treemap } from './nodes/treemap';

export class Layout {
  constructor(graphModel: GraphData) {
    Treemap(graphModel.root);
    // clusteredBubblesLayout(graphModel.root);
    // Router.init(graphModel);
  }
}
