import { GraphData } from '../index';
import { clusteredBubblesLayout } from './nodes/pack';

export class Layout {
  constructor(graphModel: GraphData) {
    clusteredBubblesLayout(graphModel.root);
    // Router.init(graphModel);
  }
}
