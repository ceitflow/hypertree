import { IdPath } from '../analyzer';
import { CodeFile } from './code-file';
import { OtherFile } from './other-file';

export type Graph = {
  name: string;
  // referencedExternalPackages: string[]
  root: Directory;
  stats: {
    filesCount: number;
    externalFilesCount: number;
    totalLoc: number;
  }
}

export type File = CodeFile | OtherFile;

export type Directory = {
  name: string,
  dirs?: Directory[];
  files?: File[];
  path: IdPath;
  depth: number;
};