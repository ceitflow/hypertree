import { ipcMain } from 'electron';
import { readFile } from 'fs/promises';
import { IO } from './astgen/analyzer';
import { AstGen } from './astgen/astgen';

export function main() {
  ipcMain.handle('api:readFile', async (_, [rootPath, relPath]: [string, string]): Promise<string> => {
    return readFile(rootPath + IO.separator + relPath, 'utf-8');
  });

  ipcMain.handle('api:readGraph', async (): Promise<Record<string, unknown>> => {
    return {};
  });
  // AstGen();
}
