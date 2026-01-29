import { FileEnum, IdPath } from '../../analyzer';

export type OtherFile = {
  type: FileEnum.Other,
  id: IdPath;
  name: string;
  loc: number; // invalid for binary files
  bigFile: boolean;
}
