import ig from 'ignore';
import path from 'node:path';
import { IdPath } from '@lib/ast';
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';

export class IO {
  static separator = path.sep;

  static readAllFiles(rootDir: IdPath): Set<IdPath> {
    const stack: IdPath[] = [rootDir];
    const result = new Set<IdPath>();
    const ignore = ig();
    ignore.add('.git');
    ignore.add('package-lock.json');
    ignore.add('yarn.lock');
    ignore.add('pnpm-lock.yaml');
    const git = this.readGitIgnore(rootDir);
    if (git) ignore.add(git);

    while (stack.length > 0) {
      const current = stack.pop()!;
      const rel = path.relative(rootDir, current);
      if (current !== rootDir && ignore.test(rel).ignored) {
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

  private static readGitIgnore(rootDir: IdPath): string | null {
    const gitignorePath = path.join(rootDir, '.gitignore');
    if (existsSync(gitignorePath)) {
      console.log('.gitignore found');
      return this.readSourceFile(gitignorePath);
    }
    console.log('Missing .gitignore, ignoring');
    return null;
  }

  static readLOC(filePath: IdPath): number {
    try {
      const content = this.readSourceFile(filePath);
      return content.split('\n').length;
    } catch {
      return 0;
    }
  }

  static writeOutput(json: string) {
    writeFileSync('/Users/ceitflow/WebstormProjects/hypertree/hypertree/resources' + '/output.json', json);
  }
}
