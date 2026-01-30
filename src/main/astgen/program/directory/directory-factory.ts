import { Directory, NodeEnum } from '@lib/ast';

export const CreateDirectory = (path: string, depth: number): Directory => {
  return {
    id: path,
    name: path[path.length - 1],
    type: NodeEnum.Directory,
    depth,
    files: [],
    dirs: [],
  }
};
