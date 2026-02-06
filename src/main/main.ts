import { ipcMain } from 'electron';
import { readFile } from 'fs/promises';
import { AstGen } from './astgen/astgen';

export function main() {
  ipcMain.handle('api:readFile', async (_, filePath: string): Promise<string> => {
    return readFile(filePath, 'utf-8');
  });

  ipcMain.handle('api:readGraph', async (): Promise<Record<string, unknown>> => {
    return {};
  });
  // AstGen();
}
