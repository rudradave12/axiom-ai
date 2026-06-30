'use client';

import React, { useEffect, useState } from 'react';
import { useKnowledgeStore } from '@/shared/stores/knowledge-store';
import { useFileStore } from '@/shared/stores/file-store';
import { KnowledgeDepth } from '@/features/knowledge/domain/entities/knowledge';

interface KnowledgeTabViewProps {
  missionId: string;
}

export function KnowledgeTabView({ missionId }: KnowledgeTabViewProps): React.JSX.Element {
  const {
    concepts,
    createConcept,
    deleteConcept,
    initializeKnowledge,
  } = useKnowledgeStore();
  
  const {
    files,
    uploadQueue,
    initializeFiles,
    uploadFile,
    deleteFile,
  } = useFileStore();

  const [dragActive, setDragActive] = useState(false);
  const [conceptQuery, setConceptQuery] = useState('');
  const [selectedDepth, setSelectedDepth] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal triggers
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDepth, setNewDepth] = useState<KnowledgeDepth>('SURFACE');
  const [newCategory, setNewCategory] = useState('Definition');
  const [newTagsStr, setNewTagsStr] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  // Sync concepts & files on mount
  useEffect(() => {
    const unsubKnowledge = initializeKnowledge(missionId);
    const unsubFiles = initializeFiles(missionId);
    return (): void => {
      if (unsubKnowledge) unsubKnowledge();
      if (unsubFiles) unsubFiles();
    };
  }, [missionId, initializeKnowledge, initializeFiles]);

  const handleDrag = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropFiles = Array.from(e.dataTransfer.files);
      for (const file of dropFiles) {
        try {
          await uploadFile(missionId, file);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'File upload failed';
          alert(msg);
        }
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (e.target.files && e.target.files[0]) {
      const selectedFiles = Array.from(e.target.files);
      for (const file of selectedFiles) {
        try {
          await uploadFile(missionId, file);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'File upload failed';
          alert(msg);
        }
      }
    }
  };

  const handleCreateConcept = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    try {
      const tags = newTagsStr
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const sourceFileIds = selectedFileId ? [selectedFileId] : [];
      const parentConceptId = selectedParentId || null;

      await createConcept(missionId, {
        label: newLabel,
        description: newDesc,
        depth: newDepth,
        category: newCategory,
        tags,
        sourceFileIds,
        parentConceptId,
      });

      // Reset
      setNewLabel('');
      setNewDesc('');
      setNewDepth('SURFACE');
      setNewCategory('Definition');
      setNewTagsStr('');
      setSelectedFileId('');
      setSelectedParentId('');
      setShowAddModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add concept');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter concepts list
  const filteredConcepts = concepts.filter((c) => {
    const matchesSearch =
      c.label.toLowerCase().includes(conceptQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(conceptQuery.toLowerCase());
    const matchesDepth = selectedDepth === 'ALL' || c.depth === selectedDepth;
    return matchesSearch && matchesDepth;
  });

  return (
    <div style={styles.container}>
      {/* File Upload Section at top */}
      <section style={styles.uploadSection}>
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          style={dragActive ? styles.uploadZoneActive : styles.uploadZone}
        >
          <p style={styles.uploadText}>
            Drag & drop resource documents here, or{' '}
            <label style={styles.uploadLink}>
              browse files
              <input type="file" multiple onChange={handleFileInput} style={{ display: 'none' }} />
            </label>
          </p>
          <span style={styles.uploadHint}>Supports PDF, DOCX, PPTX, TXT</span>
        </div>

        {/* Active Uploads or Files Queue list */}
        <div style={styles.filesCard}>
          <strong style={styles.cardHeaderTitle}>Mission Files ({files.length})</strong>
          
          {/* Active upload queue loaders */}
          {uploadQueue.length > 0 && (
            <div style={styles.queueContainer}>
              {uploadQueue.map((item) => (
                <div key={item.id} style={styles.queueItem}>
                  <span style={styles.queueName}>{item.name}</span>
                  <div style={styles.progressBarWrapper}>
                    <div style={{ ...styles.progressBar, width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {files.length === 0 ? (
            <p style={styles.emptyFilesText}>No files uploaded. Drag files to register context.</p>
          ) : (
            <div style={styles.filesList}>
              {files.map((file) => (
                <div key={file.id} style={styles.fileRow}>
                  <div style={styles.fileMeta}>
                    <span style={styles.fileName}>{file.name}</span>
                    <span style={styles.fileSize}>{formatBytes(file.size)}</span>
                  </div>
                  <button onClick={() => deleteFile(missionId, file.id)} style={styles.fileRemoveBtn}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Concepts Header controls */}
      <div style={styles.header}>
        <h3 style={styles.sectionTitle}>Processed Knowledge Ontologies</h3>
        <div style={styles.controls}>
          <input
            type="text"
            placeholder="Search concepts..."
            value={conceptQuery}
            onChange={(e) => setConceptQuery(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={selectedDepth}
            onChange={(e) => setSelectedDepth(e.target.value)}
            style={styles.select}
          >
            <option value="ALL">All Depths</option>
            <option value="SURFACE">Surface Level</option>
            <option value="MODERATE">Moderate Level</option>
            <option value="DEEP">Deep Level</option>
          </select>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={styles.viewModeBtn}
          >
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </button>
          <button onClick={() => setShowAddModal(true)} style={styles.addBtn}>
            + Add Concept
          </button>
        </div>
      </div>

      {/* Grid or List list render */}
      {filteredConcepts.length === 0 ? (
        <div style={styles.emptyState}>
          No knowledge concepts defined yet. Copilot will extract concepts from files, or click Add Concept to create one manually.
        </div>
      ) : viewMode === 'grid' ? (
        <div style={styles.grid}>
          {filteredConcepts.map((c) => (
            <div key={c.id} style={styles.conceptCard}>
              <div style={styles.cardHeader}>
                <span style={styles.cardCategory}>{c.category}</span>
                <span style={styles.cardDepthBadge}>{c.depth}</span>
              </div>
              <h4 style={styles.cardTitle}>{c.label}</h4>
              <p style={styles.cardDesc}>{c.description}</p>

              {c.tags.length > 0 && (
                <div style={styles.tagsRow}>
                  {c.tags.map((t) => (
                    <span key={t} style={styles.tag}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div style={styles.cardMeta}>
                <span>Confidence: {c.confidence}%</span>
                {c.sourceFileIds.length > 0 && (
                  <span style={styles.sourceCitation}>
                    📄 Citation: {files.find((f) => f.id === c.sourceFileIds[0])?.name || 'File'}
                  </span>
                )}
              </div>
              <div style={styles.cardActions}>
                <button onClick={() => deleteConcept(missionId, c.id)} style={styles.deleteBtn}>
                  Delete Concept
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.list}>
          {filteredConcepts.map((c) => (
            <div key={c.id} style={styles.listItem}>
              <div style={styles.listItemMeta}>
                <div style={styles.listTextCol}>
                  <h4 style={styles.listTitle}>{c.label}</h4>
                  <p style={styles.listDesc}>{c.description}</p>
                  <div style={styles.listTagsRow}>
                    <span style={styles.listCategory}>{c.category}</span>
                    <span style={styles.listDepth}>{c.depth}</span>
                    {c.tags.map((t) => (
                      <span key={t} style={styles.tag} role="none">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => deleteConcept(missionId, c.id)} style={styles.deleteBtn}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Manual creation form dialog modal */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <header style={styles.modalHeader}>
              <h4 style={styles.modalTitle}>Add Manual Knowledge Concept</h4>
              <button onClick={() => setShowAddModal(false)} style={styles.closeBtn}>
                ✕
              </button>
            </header>

            <form onSubmit={handleCreateConcept} style={styles.modalForm}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Concept Label</label>
                <input
                  type="text"
                  placeholder="e.g. Memory Leak or Heap Allocation"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  style={styles.modalInput}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Detailed Description</label>
                <textarea
                  placeholder="Explain the definition or formula..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={styles.modalTextarea}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Complexity Depth</label>
                  <select
                    value={newDepth}
                    onChange={(e) => setNewDepth(e.target.value as KnowledgeDepth)}
                    style={styles.modalSelect}
                  >
                    <option value="SURFACE">Surface Level</option>
                    <option value="MODERATE">Moderate Level</option>
                    <option value="DEEP">Deep Level</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Category Classification</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={styles.modalInput}
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Parent Concept (Optional)</label>
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  style={styles.modalSelect}
                >
                  <option value="">None (Top Level)</option>
                  {concepts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Source Document Reference (Optional)</label>
                <select
                  value={selectedFileId}
                  onChange={(e) => setSelectedFileId(e.target.value)}
                  style={styles.modalSelect}
                >
                  <option value="">None</option>
                  {files.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="rust, systems, memory"
                  value={newTagsStr}
                  onChange={(e) => setNewTagsStr(e.target.value)}
                  style={styles.modalInput}
                />
              </div>

              <button type="submit" style={styles.submitBtn}>
                Register Concept Node
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '1.5rem',
  } as React.CSSProperties,
  uploadSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '2rem',
  } as React.CSSProperties,
  uploadZone: {
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    backgroundColor: '#f9fafb',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  uploadZoneActive: {
    border: '2px dashed #1a56db',
    borderRadius: '12px',
    backgroundColor: '#eff6ff',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    cursor: 'pointer',
  } as React.CSSProperties,
  uploadText: {
    fontSize: '0.875rem',
    color: '#4b5563',
    margin: '0 0 0.5rem 0',
  } as React.CSSProperties,
  uploadLink: {
    color: '#1a56db',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
  } as React.CSSProperties,
  uploadHint: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  } as React.CSSProperties,
  filesCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: '180px',
    overflowY: 'auto',
  } as React.CSSProperties,
  cardHeaderTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#374151',
  } as React.CSSProperties,
  queueContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    backgroundColor: '#eff6ff',
    padding: '0.5rem',
    borderRadius: '8px',
  } as React.CSSProperties,
  queueItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
  } as React.CSSProperties,
  queueName: {
    color: '#1e40af',
    fontWeight: 500,
  } as React.CSSProperties,
  progressBarWrapper: {
    width: '80px',
    height: '6px',
    backgroundColor: '#bfdbfe',
    borderRadius: '3px',
    overflow: 'hidden',
  } as React.CSSProperties,
  progressBar: {
    height: '100%',
    backgroundColor: '#1a56db',
  } as React.CSSProperties,
  emptyFilesText: {
    fontSize: '0.8125rem',
    color: '#9ca3af',
    margin: '1rem 0',
    textAlign: 'center',
  } as React.CSSProperties,
  filesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  fileRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
  } as React.CSSProperties,
  fileMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  } as React.CSSProperties,
  fileName: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#374151',
  } as React.CSSProperties,
  fileSize: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
  } as React.CSSProperties,
  fileRemoveBtn: {
    border: 'none',
    background: 'none',
    color: '#ef4444',
    fontSize: '0.8125rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#111827',
  } as React.CSSProperties,
  controls: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  searchInput: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.75rem',
    width: '160px',
  } as React.CSSProperties,
  select: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    fontSize: '0.75rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  viewModeBtn: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
  } as React.CSSProperties,
  addBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    border: 'none',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.25rem',
  } as React.CSSProperties,
  conceptCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  cardCategory: {
    fontSize: '0.625rem',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    fontWeight: 700,
  } as React.CSSProperties,
  cardDepthBadge: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
    fontWeight: 600,
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#111827',
  } as React.CSSProperties,
  cardDesc: {
    fontSize: '0.75rem',
    color: '#6b7280',
    lineHeight: 1.4,
    margin: 0,
  } as React.CSSProperties,
  tagsRow: {
    display: 'flex',
    gap: '0.25rem',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  tag: {
    fontSize: '0.6875rem',
    color: '#4b5563',
  } as React.CSSProperties,
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '0.5rem',
    marginTop: '0.25rem',
    fontSize: '0.6875rem',
    color: '#9ca3af',
  } as React.CSSProperties,
  sourceCitation: {
    color: '#059669',
    fontWeight: 600,
  } as React.CSSProperties,
  cardActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '0.25rem',
  } as React.CSSProperties,
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '0.6875rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  } as React.CSSProperties,
  listItemMeta: {
    display: 'flex',
    gap: '1rem',
  } as React.CSSProperties,
  listTextCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  } as React.CSSProperties,
  listTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#111827',
  } as React.CSSProperties,
  listDesc: {
    fontSize: '0.75rem',
    color: '#6b7280',
    margin: 0,
  } as React.CSSProperties,
  listTagsRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    fontSize: '0.6875rem',
    color: '#9ca3af',
  } as React.CSSProperties,
  listCategory: {
    color: '#1a56db',
    fontWeight: 600,
  } as React.CSSProperties,
  listDepth: {
    fontWeight: 600,
  } as React.CSSProperties,
  emptyState: {
    padding: '3rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  } as React.CSSProperties,
  modalContent: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  modalTitle: {
    fontSize: '0.925rem',
    fontWeight: 700,
    color: '#111827',
  } as React.CSSProperties,
  closeBtn: {
    border: 'none',
    background: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    color: '#9ca3af',
  } as React.CSSProperties,
  modalForm: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  modalInput: {
    padding: '0.625rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.8125rem',
    outline: 'none',
  } as React.CSSProperties,
  modalTextarea: {
    padding: '0.625rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.8125rem',
    minHeight: '80px',
    resize: 'vertical',
    outline: 'none',
  } as React.CSSProperties,
  modalSelect: {
    padding: '0.625rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.8125rem',
    backgroundColor: '#ffffff',
    outline: 'none',
  } as React.CSSProperties,
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  } as React.CSSProperties,
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  } as React.CSSProperties,
  label: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#4b5563',
  } as React.CSSProperties,
  submitBtn: {
    padding: '0.75rem',
    borderRadius: '6px',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    border: 'none',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    marginTop: '0.5rem',
  } as React.CSSProperties,
};
