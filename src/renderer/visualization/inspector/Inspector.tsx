import styles from './Inspector.module.css';
import { EditorState } from '@codemirror/state';
import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { ApiService } from '../../api.service';
import { CodeGraphNode, Graph, GraphNode, GraphNodeEnum, VirtualGraphNode } from '../graph';
import {
  describeCode,
  describeDirectory,
  getChildName,
  getLabel,
  inspectorLanguage,
  inspectorSyntaxHighlighting,
  lineHighlighter,
  loadFile,
  setDoc
} from './inspector.utils';
import { Decoder, FileType } from './decoder';

type Props = {
  graph: Graph;
};

export const Inspector = ({ graph }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [inspectorVisible, setInspectorVisible] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [children, setChildren] = useState<GraphNode[] | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const view = new EditorView({
      parent,
      doc: '',
      extensions: [
        basicSetup,
        inspectorLanguage,
        inspectorSyntaxHighlighting,
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        EditorView.lineWrapping,
        lineHighlighter
      ]
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    setInspectorVisible(false);
    setLabel(null);
    setChildren(null);
    setDescription(null);
    setSelectedNode(null);
    setPreviewUrl(null);
    setAnalyzing(false);
    if (viewRef.current) {
      setDoc(viewRef.current, '');
    }

    const onSelect = async (node: GraphNode | null) => {
      setInspectorVisible(true);
      setDescription(null);
      setSelectedNode(node);
      setPreviewUrl(null);
      const view = viewRef.current!;
      const rootId = graph.model.root.ast.id;

      if (!node) {
        setLabel(null);
        setChildren(null);
        setDoc(view, '');
        return;
      }

      setLabel(getLabel(node));

      switch (node.type) {
        case GraphNodeEnum.Virtual:
        case GraphNodeEnum.Directory: {
          const flattenColumns = (nodes: GraphNode[]): GraphNode[] =>
            nodes.flatMap((child) =>
              child.type === GraphNodeEnum.Virtual && (child as VirtualGraphNode).flags.isColumn
                ? flattenColumns(child.children as GraphNode[])
                : [child]
            );
          setChildren(flattenColumns(node.children as GraphNode[]));
          setDoc(view, '');
          break;
        }

        case GraphNodeEnum.Code:
          setChildren(null);
          await loadFile(view, rootId, node.ast.id);
          break;

        case GraphNodeEnum.Other: {
          setChildren(null);
          const decoded = await loadFile(view, rootId, node.ast.id);
          if (decoded.type === FileType.Image && decoded.dataUrl) {
            setPreviewUrl(decoded.dataUrl);
          }
          break;
        }

        case GraphNodeEnum.Declaration:
          setChildren(null);
          await loadFile(view, rootId, node.parent!.ast.id, { start: node.ast.startLine, end: node.ast.endLine });
          break;
      }
    };
    graph.emit.on('select', onSelect);
    return () => graph.emit.off('select', onSelect);
  }, [graph]);

  const handleAnalyze = async () => {
    if (!selectedNode) return;
    const rootId = graph.model.root.ast.id;

    setAnalyzing(true);
    setDescription('Analyzing…');
    const start = performance.now();
    try {
      if (selectedNode.type === GraphNodeEnum.Code || selectedNode.type === GraphNodeEnum.Other) {
        const raw = await ApiService.readFile(rootId, selectedNode.ast.id);
        const { text } = Decoder.decode(raw, selectedNode.ast.id);
        const result = await describeCode(selectedNode.id, text);
        console.log(`describeCode took ${(performance.now() - start).toFixed(0)}ms`);
        console.log(result);
        setDescription(result);
      } else if (selectedNode.type === GraphNodeEnum.Directory || selectedNode.type === GraphNodeEnum.Virtual) {
        const codeNodes = (selectedNode.children as GraphNode[]).filter(
          (child): child is CodeGraphNode => child.type === GraphNodeEnum.Code
        );

        const summaries = new Map<string, string>();
        for (const codeNode of codeNodes) {
          const raw = await ApiService.readFile(rootId, codeNode.ast.id);
          const { text } = Decoder.decode(raw, codeNode.ast.id);
          summaries.set(codeNode.name, await describeCode(codeNode.name, text));
        }

        const result = await describeDirectory(selectedNode.id, summaries);
        console.log(`describeDirectory took ${(performance.now() - start).toFixed(0)}ms`);
        console.log(result);
        setDescription(result);
      } else {
        setDescription(null);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className={styles.inspectorContainer} style={inspectorVisible ? {} : { pointerEvents: 'none', opacity: 0 }}>
      <button
        type="button"
        className={styles.closeButton}
        aria-label="Close inspector"
        onClick={() => setInspectorVisible(false)}
      >
        ×
      </button>
      <span className={styles.selectedId}>{label || '—'}</span>
      <button
        type="button"
        className={styles.analyzeButton}
        disabled={analyzing || !selectedNode}
        onClick={handleAnalyze}
      >
        {analyzing ? 'Analyzing…' : 'Analyze'}
      </button>
      {children && (
        <div className={styles.childrenListContainer}>
          <span style={{ paddingLeft: '8px' }}>{children.length} items</span>
          <div className={styles.childrenList}>
            {children.map((child) => (
              <span key={child.id} className={styles.childItem}>
                {getChildName(child)} <em className={styles.childType}>({child.type})</em>
              </span>
            ))}
            {children.length === 0 && <span className={styles.childItem}>(empty)</span>}
          </div>
        </div>
      )}
      {description && <div className={styles.description}>{description}</div>}
      {previewUrl && (
        <div className={styles.preview}>
          <img src={previewUrl} alt="" className={styles.previewImage} />
        </div>
      )}
      <div ref={containerRef} className={styles.editorWrapper} />
    </div>
  );
};
