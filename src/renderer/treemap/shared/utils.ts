export function eachAfter<T extends { children: T[] }>(root: T, callback: (node: T) => void): void {
  const nodes: T[] = [root];
  const next: T[] = [];
  let node: T | undefined;

  while (nodes.length) {
    node = nodes.pop()!;
    next.push(node);
    for (let i = 0; i < node.children.length; i++) nodes.push(node.children[i]);
  }
  while (next.length) callback(next.pop()!);
}

export function eachBefore<T extends { children: T[] }>(root: T, callback: (node: T) => void): void {
  const nodes: T[] = [root];
  let node: T | undefined;

  while (nodes.length) {
    node = nodes.pop()!;
    callback(node);
    for (let i = node.children.length - 1; i >= 0; i--) nodes.push(node.children[i]);
  }
}
