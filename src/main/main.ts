import { BrowserWindow, dialog, ipcMain } from 'electron';
import { IO } from './astgen/analyzer';
import { readFile } from 'fs/promises';
import { AstGen } from './astgen/astgen';

export type SelectFolderAnalyzeResult =
  | { canceled: true }
  | { canceled: false; data: Record<string, unknown> }
  | { canceled: false; error: string };

export function main() {
  ipcMain.handle('api:readFile', async (_, [rootPath, relPath]: [string, string]): Promise<string> => {
    return readFile(rootPath + IO.separator + relPath, 'utf-8');
  });

  ipcMain.handle('api:readGraph', async (): Promise<Record<string, unknown>> => {
    return {};
  });

  // /Users/ceitflow/WebstormProjects/koia-adminflow/adminflow
  // /Users/ceitflow/WebstormProjects/m3/coplan-visualizer
  // /Users/ceitflow/WebstormProjects/hypertree/graphkit-test-repos/angular/packages
  // /Users/ceitflow/WebstormProjects/hypertree/graphkit-test-repos/vscode/src
  // /Users/ceitflow/WebstormProjects/medusa/my-medusa-store-storefront
  // /Users/ceitflow/WebstormProjects/hypertree/graphkit-test-repos/vue-main
  // /Users/ceitflow/WebstormProjects/paymentSavvy/chatbot-frontend
  // /Users/ceitflow/WebstormProjects/hypertree/graphkit-test-repos/excalidraw-master
  // /Users/ceitflow/WebstormProjects/hypertree/graphkit-test-repos/pixijs
  // /Users/ceitflow/WebstormProjects/worldbank/ets-original
  const ast = new AstGen();

  ipcMain.handle('api:selectFolderAndAnalyze', async (event): Promise<SelectFolderAnalyzeResult> => {
    const parent = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = parent
      ? await dialog.showOpenDialog(parent, { properties: ['openDirectory'] })
      : await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (canceled || filePaths.length === 0) {
      return { canceled: true };
    }
    const folderPath = filePaths[0]!;
    try {
      ast.run(folderPath);
      const raw = await readFile(IO.outputJsonPath(), 'utf-8');
      return { canceled: false, data: JSON.parse(raw) as Record<string, unknown> };
    } catch (err) {
      return { canceled: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
}
