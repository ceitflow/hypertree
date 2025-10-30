import { OtherFile } from './other-file.type';
import { Analyzer, FileEnum, IdPath, IO } from '../../analyzer';

export const CreateOtherFile = (path: IdPath, analyzer: Analyzer): OtherFile => {
  const id = analyzer.getRelativePath(path);
  return {
    id,
    name: id.split(IO.separator).pop()!,
    type: FileEnum.Other,
  }
};
