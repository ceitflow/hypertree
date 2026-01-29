import { FileEnum, IdPath } from './id.type';

export type OtherFile = {
  type: FileEnum.Other,
  id: IdPath;
  name: string;
  depth: number;
  loc: number; // invalid for binary files
  bigFile: boolean;
}
