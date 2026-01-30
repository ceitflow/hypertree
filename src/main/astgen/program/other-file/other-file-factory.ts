import { Analyzer, IO } from '../../analyzer';
import { NodeEnum, IdPath, OtherFile } from '@lib/ast';

export const CreateOtherFile = (path: IdPath, analyzer: Analyzer): OtherFile => {
  const id = analyzer.getRelativePath(path);
  const loc = IO.readLOC(path);
  const limit = 1000;
  return {
    id,
    name: id.split(IO.separator).pop()!,
    depth: id.split(IO.separator).length - 1,
    type: NodeEnum.Other,
    loc,
    bigFile: loc > limit,
  }
};
