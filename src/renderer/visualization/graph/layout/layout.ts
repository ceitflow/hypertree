import { GraphData } from '../index';
import { QuantizedTreemap } from './nodes/quantized-treemap';

export class Layout {
  constructor(graphModel: GraphData) {
    QuantizedTreemap(graphModel.root);
    // Router.init(graphModel);
  }
}
