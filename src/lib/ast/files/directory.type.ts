import { IdPath } from './id.type';
import { CodeFile } from './code-file.type';
import { OtherFile } from './other-file.type';

export type File = CodeFile | OtherFile;

export type Directory = {
  name: string,
  dirs: Directory[];
  files: File[];
  path: IdPath;
  depth: number;
};
