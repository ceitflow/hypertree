import mitt from 'mitt';
import { ProgramGraph } from '@lib/ast/program-graph.type';

export class Store {
  model!: {
    program: ProgramGraph;
    selection: null;
  };
  readonly emit = mitt<{ select: null }>();

  constructor(program: ProgramGraph) {
    this.loadProgram(program);
  }

  loadProgram(program: ProgramGraph) {
    console.log(`file count: ${program.stats.filesCount}, tloc: ${program.stats.totalLoc}`);
    this.model = {
      program,
      selection: null,
    }
  }

  select(node: null) {
    this.emit.emit('select', node);
    this.model.selection = node;
  }
}
