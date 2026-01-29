import { Directory } from './files/directory.type';

export type ProgramGraph = {
  name: string;
  // referencedExternalPackages: string[]
  root: Directory;
  stats: {
    filesCount: number;
    externalFilesCount: number;
    totalLoc: number;
  }
}
