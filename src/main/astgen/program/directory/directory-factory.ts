import { Directory } from '@lib/ast';

export const CreateDirectory = (path: string, depth: number): Directory => {
  return {
    name: path[path.length - 1],
    depth,
    path,
    files: [],
    dirs: [],
  }
};
