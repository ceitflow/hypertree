import { Directory, IdPath, NodeEnum } from '@lib/ast';
import { IO } from '../../analyzer';

export const CreateDirectory = (path: IdPath, depth: number): Directory => {
  const osSeparator = IO.separator;
  const name = path.split(osSeparator).pop()!; // unix or windows paths
  return {
    id: path,
    name,
    type: NodeEnum.Directory,
    depth,
    files: [],
    dirs: [],
  }
};
