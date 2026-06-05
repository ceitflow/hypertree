import styles from './Inspector.module.css';
import { ApiService } from '../../api.service';
import { EditorState } from '@codemirror/state';
import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { Graph, GraphNode, GraphNodeEnum } from '../graph';

function getLabel(node: GraphNode): string {
  if (node.type === GraphNodeEnum.Virtual) return node.parent!['ast'].name + ' virtual';
  return `${node.ast.id} ${node.ast['loc'] ? node.ast['loc'] : ''} loc`
}

function getFilePath(node: GraphNode): string | null {
  switch (node.type) {
    case GraphNodeEnum.Code:
    case GraphNodeEnum.Other:
      return node.ast.id;
    case GraphNodeEnum.Declaration:
      return node.parent.ast.id;
    default:
      return null;
  }
}

function getChildName(child: GraphNode): string {
  return child.type === GraphNodeEnum.Virtual ? 'virtual' : child.ast.name;
}

type Props = {
  graph: Graph;
}

export const Inspector = ({ graph }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [children, setChildren] = useState<GraphNode[] | null>(null);

  useEffect(() => {
    const onSelect = async (node: GraphNode | null) => {
      setLabel(node ? getLabel(node) : null);
      setChildren(node && (node.type === GraphNodeEnum.Directory || node.type === GraphNodeEnum.Virtual) ? (node.children as GraphNode[]) : null);

      const view = viewRef.current;
      if (!view) return;

      const filePath = node ? getFilePath(node) : null;
      if (!filePath) {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: '' } });
        return;
      }

      try {
        const content = await ApiService.readFile(graph.model.root.ast.id, filePath);
        if (viewRef.current === view) {
          view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: content } });
        }
      } catch {
        if (viewRef.current === view) {
          view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: `// Failed to load ${filePath}` } });
        }
      }
    };
    graph.emit.on('select', onSelect);
    return () => graph.emit.off('select', onSelect);
  }, []);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const view = new EditorView({
      parent,
      doc: '',
      extensions: [
        basicSetup,
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        EditorView.lineWrapping,
      ],
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  return (
    <div className={styles.inspectorContainer}>
      <span className={styles.selectedId}>{label || '—'}</span>
      {children && (
        <div className={styles.childrenList}>
          {children.map((child) => (
            <span key={child.id} className={styles.childItem}>
              {getChildName(child)} <em className={styles.childType}>({child.type})</em>
            </span>
          ))}
          {children.length === 0 && <span className={styles.childItem}>(empty)</span>}
        </div>
      )}
      <div ref={containerRef} className={styles.editorWrapper} />
    </div>
  );
};
