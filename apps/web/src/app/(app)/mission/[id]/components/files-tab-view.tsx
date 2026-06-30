'use client';

import React, { useEffect, useState } from 'react';
import { useFileStore } from '@/shared/stores/file-store';
import { AxiomFile } from '@/features/file/domain/entities/file';

interface FilesTabViewProps {
  missionId: string;
}

export function FilesTabView({ missionId }: FilesTabViewProps): React.JSX.Element {
  const {
    files,
    uploadQueue,
    uploadFile,
    retryUpload,
    cancelUpload,
    deleteFile,
    toggleFavorite,
    initializeFiles,
  } = useFileStore();

  const [dragActive, setDragActive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'date' | 'size' | 'name'>('date');
  const [selectedFile, setSelectedFile] = useState<AxiomFile | null>(null);

  // Sync files listener on mount
  useEffect(() => {
    const unsubscribe = initializeFiles(missionId);
    return (): void => {
      if (unsubscribe) unsubscribe();
    };
  }, [missionId, initializeFiles]);

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

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter and sort files list
  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortField === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortField === 'size') {
      return b.size - a.size;
    } else {
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    }
  });

  return (
    <div style={styles.container}>
      {/* Upload Drag zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={dragActive ? styles.uploadZoneActive : styles.uploadZone}
      >
        <p style={styles.uploadText}>
          Drag & drop your resource files here, or{' '}
          <label style={styles.uploadLink}>
            browse files
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </label>
        </p>
        <span style={styles.uploadLimit}>PDF, DOCX, PPTX, TXT, MD, CSV, PNG, JPG (Max 50MB)</span>
      </div>

      {/* Upload Queue Task List */}
      {uploadQueue.length > 0 && (
        <div style={styles.queueContainer}>
          <h4 style={styles.queueTitle}>Upload Progress</h4>
          <div style={styles.queueList}>
            {uploadQueue.map((item) => (
              <div key={item.id} style={styles.queueItem}>
                <div style={styles.queueMeta}>
                  <span style={styles.queueName}>{item.name}</span>
                  <span style={styles.queueStatus}>
                    {item.status === 'COMPLETED'
                      ? 'Uploaded'
                      : item.status === 'FAILED'
                      ? 'Failed'
                      : `${Math.round(item.progress)}%`}
                  </span>
                </div>
                <div style={styles.progressBarBg}>
                  <div
                    style={{
                      ...styles.progressBarFill,
                      width: `${item.progress}%`,
                      backgroundColor: item.status === 'FAILED' ? '#ef4444' : '#1a56db',
                    }}
                  />
                </div>
                {item.status === 'FAILED' && (
                  <div style={styles.queueActions}>
                    <button
                      onClick={() => retryUpload(missionId, item.id)}
                      style={styles.retryBtn}
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => cancelUpload(item.id)}
                      style={styles.cancelBtn}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files toolbar filters */}
      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.toolbarActions}>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as 'date' | 'size' | 'name')}
            style={styles.select}
          >
            <option value="date">Upload Date</option>
            <option value="size">File Size</option>
            <option value="name">File Name</option>
          </select>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={styles.viewModeBtn}
          >
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </button>
        </div>
      </div>

      {/* Files render */}
      {sortedFiles.length === 0 ? (
        <div style={styles.emptyState}>No resource documents uploaded yet.</div>
      ) : viewMode === 'grid' ? (
        <div style={styles.grid}>
          {sortedFiles.map((file) => (
            <div key={file.id} style={styles.gridCard}>
              <div style={styles.gridPreview} onClick={() => setSelectedFile(file)}>
                {file.mimeType.startsWith('image/') ? (
                  <img src={file.storageUrl} alt={file.name} style={styles.previewImg} />
                ) : (
                  <div style={styles.docIcon}>📄</div>
                )}
              </div>
              <div style={styles.cardInfo}>
                <h5 style={styles.cardName} title={file.name}>
                  {file.name}
                </h5>
                <span style={styles.cardSize}>{formatBytes(file.size)}</span>
              </div>
              <div style={styles.cardActions}>
                <button
                  onClick={() => toggleFavorite(missionId, file.id)}
                  style={file.metadata.isFavorite ? styles.cardFavBtnActive : styles.cardFavBtn}
                >
                  ★
                </button>
                <button
                  onClick={() => deleteFile(missionId, file.id)}
                  style={styles.cardDeleteBtn}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.list}>
          {sortedFiles.map((file) => (
            <div key={file.id} style={styles.listItem}>
              <div style={styles.listItemMeta} onClick={() => setSelectedFile(file)}>
                <span style={styles.listIcon}>📄</span>
                <div style={styles.listTextCol}>
                  <span style={styles.listName}>{file.name}</span>
                  <span style={styles.listDate}>
                    {new Date(file.uploadedAt).toLocaleDateString()} • {formatBytes(file.size)}
                  </span>
                </div>
              </div>
              <div style={styles.listItemActions}>
                <button
                  onClick={() => toggleFavorite(missionId, file.id)}
                  style={file.metadata.isFavorite ? styles.cardFavBtnActive : styles.cardFavBtn}
                >
                  ★
                </button>
                <button
                  onClick={() => deleteFile(missionId, file.id)}
                  style={styles.cardDeleteBtn}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog Modal Overlay */}
      {selectedFile && (
        <div style={styles.modalOverlay} onClick={() => setSelectedFile(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <header style={styles.modalHeader}>
              <h4 style={styles.modalTitle}>{selectedFile.name}</h4>
              <button onClick={() => setSelectedFile(null)} style={styles.modalClose}>
                ✕
              </button>
            </header>
            <div style={styles.modalBody}>
              {selectedFile.mimeType.startsWith('image/') ? (
                <img
                  src={selectedFile.storageUrl}
                  alt={selectedFile.name}
                  style={styles.modalImg}
                />
              ) : (
                <div style={styles.modalDocPlaceholder}>
                  <div style={styles.modalDocIcon}>📄</div>
                  <p style={styles.modalDocText}>
                    Preview and semantic AI checks will unlock in upcoming integration phases.
                  </p>
                  <a
                    href={selectedFile.storageUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.modalDownloadLink}
                  >
                    Download File Document
                  </a>
                </div>
              )}
            </div>
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
    gap: '1.5rem',
  } as React.CSSProperties,
  uploadZone: {
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    padding: '2.5rem 1.5rem',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  uploadZoneActive: {
    border: '2px dashed #1a56db',
    borderRadius: '12px',
    padding: '2.5rem 1.5rem',
    textAlign: 'center',
    backgroundColor: '#eff6ff',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  uploadText: {
    fontSize: '0.875rem',
    color: '#374151',
    fontWeight: 500,
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  uploadLink: {
    color: '#1a56db',
    textDecoration: 'underline',
    cursor: 'pointer',
  } as React.CSSProperties,
  uploadLimit: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  } as React.CSSProperties,
  queueContainer: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '1.25rem',
  } as React.CSSProperties,
  queueTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#374151',
    marginBottom: '0.75rem',
  } as React.CSSProperties,
  queueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  queueItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  } as React.CSSProperties,
  queueMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#4b5563',
  } as React.CSSProperties,
  queueName: {
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '80%',
  } as React.CSSProperties,
  queueStatus: {
    fontWeight: 500,
  } as React.CSSProperties,
  progressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: '#f3f4f6',
    borderRadius: '3px',
    overflow: 'hidden',
  } as React.CSSProperties,
  progressBarFill: {
    height: '100%',
    transition: 'width 0.2s',
  } as React.CSSProperties,
  queueActions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.25rem',
  } as React.CSSProperties,
  retryBtn: {
    fontSize: '0.75rem',
    background: 'none',
    border: 'none',
    color: '#1a56db',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  cancelBtn: {
    fontSize: '0.75rem',
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  searchInput: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    outline: 'none',
    maxWidth: '240px',
    width: '100%',
  } as React.CSSProperties,
  toolbarActions: {
    display: 'flex',
    gap: '0.75rem',
  } as React.CSSProperties,
  select: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    fontSize: '0.875rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  viewModeBtn: {
    padding: '0.5rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  } as React.CSSProperties,
  emptyState: {
    padding: '3rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '1.25rem',
  } as React.CSSProperties,
  gridCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
  } as React.CSSProperties,
  gridPreview: {
    height: '110px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
  } as React.CSSProperties,
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  } as React.CSSProperties,
  docIcon: {
    fontSize: '2.5rem',
  } as React.CSSProperties,
  cardInfo: {
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  } as React.CSSProperties,
  cardName: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  cardSize: {
    fontSize: '0.75rem',
    color: '#6b7280',
  } as React.CSSProperties,
  cardActions: {
    padding: '0.5rem 0.75rem 0.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid #f9fafb',
  } as React.CSSProperties,
  cardFavBtn: {
    background: 'none',
    border: 'none',
    color: '#d1d5db',
    fontSize: '1rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  cardFavBtnActive: {
    background: 'none',
    border: 'none',
    color: '#f59e0b',
    fontSize: '1rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  cardDeleteBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  listItem: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  listItemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
  listIcon: {
    fontSize: '1.5rem',
  } as React.CSSProperties,
  listTextCol: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  } as React.CSSProperties,
  listName: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  listDate: {
    fontSize: '0.75rem',
    color: '#6b7280',
  } as React.CSSProperties,
  listItemActions: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
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
    zIndex: 9999,
  } as React.CSSProperties,
  modalContent: {
    width: '100%',
    maxWidth: '500px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    border: '1px solid #e5e7eb',
  } as React.CSSProperties,
  modalHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  modalTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '80%',
  } as React.CSSProperties,
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: '1rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  modalBody: {
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    maxHeight: '70vh',
    overflowY: 'auto',
  } as React.CSSProperties,
  modalImg: {
    maxWidth: '100%',
    maxHeight: '60vh',
    objectFit: 'contain',
    borderRadius: '8px',
  } as React.CSSProperties,
  modalDocPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    textAlign: 'center',
  } as React.CSSProperties,
  modalDocIcon: {
    fontSize: '4rem',
  } as React.CSSProperties,
  modalDocText: {
    fontSize: '0.875rem',
    color: '#4b5563',
    lineHeight: 1.5,
    maxWidth: '280px',
  } as React.CSSProperties,
  modalDownloadLink: {
    padding: '0.5rem 1.5rem',
    borderRadius: '6px',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
  } as React.CSSProperties,
};
