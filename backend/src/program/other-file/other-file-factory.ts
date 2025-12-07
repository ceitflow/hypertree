import { OtherFile } from './other-file.type';
import { Analyzer, FileEnum, IdPath, IO } from '../../analyzer';

export const CreateOtherFile = (path: IdPath, analyzer: Analyzer): OtherFile => {
  const id = analyzer.getRelativePath(path);
  const loc = IO.readLOC(path);
  const limit = 1000;
  return {
    id,
    name: id.split(IO.separator).pop()!,
    type: FileEnum.Other,
    loc: loc > limit ? 10 : loc,
    bigFile: loc > limit,
  }
};
