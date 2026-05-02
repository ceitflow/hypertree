import { ipcMain } from 'electron';
import { IO } from './astgen/analyzer';
import { readFile } from 'fs/promises';
import { AstGen } from './astgen/astgen';

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
  // /Users/ceitflow/WebstormProjects/hypertree/graphkit-test-repos/pixijs-dev
  // /Users/ceitflow/WebstormProjects/worldbank/ets-original
  const ast = new AstGen();
  // ast.run('/Users/ceitflow/WebstormProjects/koia-adminflow/adminflow');
}
