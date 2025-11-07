import path from 'node:path';
import { IdPath } from './analyzer.type';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';

export class IO {
  static separator = path.sep;

  static readAllFiles(rootDir: IdPath): Set<IdPath> {
    const stack: IdPath[] = [rootDir];
    const result = new Set<IdPath>();

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current.replace(rootDir + path.sep, '').startsWith('.')
        || current.includes('node_modules')
        || current.includes('.DS_Store')) {
        continue;
      }
      const stat = statSync(current);

      if (stat.isDirectory()) {
        stack.push(...readdirSync(current).map(e => path.join(current, e)));
      } else if (stat.isFile()) {
        result.add(current);
      }
    }
    return result;
  }

  static readSourceFile(filePath: IdPath): string {
    return readFileSync(filePath, 'utf8');
  }

  static writeOutput(json: string) {
    writeFileSync('/Users/ceitflow/WebstormProjects/prototypes/graphkit/backend/dist' + '/output.json', json);
  }
}
