import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Video, Music, Image, Download, Trash2, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';

interface Document {
  id: string;
  uploadedBy: string;
  sharedWith: string;
  type: 'document' | 'audio' | 'video' | 'image';
  filename: string;
  originalFilename: string;
  size: number;
  mimeType: string;
  description?: string;
  scanned: boolean;
  encrypted: boolean;
  signedUrl?: string;
  urlExpiresAt?: string;
  createdAt: string;
  uploader?: {
    id: string;
    name: string;
    yorubaName?: string;
  };
  sharer?: {
    id: string;
    name: string;
    yorubaName?: string;
  };
}

interface DocumentsPortalProps {
  userId: string;
  userRole: string;
}

/**
 * Documents Portal Component
 * Secure document sharing between Babalawo and client
 * NOTE: Access control enforced - only assigned client can view documents
 */
interface Client {
  id: string;
  name: string;
  yorubaName?: string;
}

const DocumentsPortal: React.FC<DocumentsPortalProps> = ({ userId, userRole }) => {
  const queryClient = useQueryClient();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument] = useState<Document | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    sharedWith: '',
    type: 'document' as Document['type'],
    description: '',
  });

  const isBabalawo = userRole === 'BABALAWO';

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['documents', userId],
    queryFn: async () => {
      const response = await api.get(`/documents/user/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });

  // Fetch clients (for Babalawo only)
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients', userId],
    queryFn: async () => {
      const response = await api.get(`/babalawo-client/${userId}`);
      return response.data;
    },
    enabled: isBabalawo,
  });

  // Get signed URL mutation
  const getSignedUrlMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await api.get(`/documents/${documentId}/signed-url/${userId}`);
      return response.data;
    },
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('filename', selectedFile.name);
      formData.append('type', uploadData.type);
      formData.append('sharedWith', uploadData.sharedWith);
      formData.append('mimeType', selectedFile.type);
      if (uploadData.description) {
        formData.append('description', uploadData.description);
      }

      const response = await api.post(`/documents/upload/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', userId] });
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadData({
        sharedWith: '',
        type: 'document',
        description: '',
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await api.delete(`/documents/${documentId}/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', userId] });
    },
  });

  const handleDownload = async (document: Document) => {
    try {
      const data = await getSignedUrlMutation.mutateAsync(document.id);
      if (data.signedUrl) {
        // In production, this would be the S3 signed URL
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      logger.error('Download failed:', error);
    }
  };

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'audio':
        return Music;
      case 'video':
        return Video;
      case 'image':
        return Image;
      default:
        return FileText;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);

      // Auto-detect type based on MIME type
      if (file.type.startsWith('audio/')) {
        setUploadData((prev) => ({ ...prev, type: 'audio' }));
      } else if (file.type.startsWith('video/')) {
        setUploadData((prev) => ({ ...prev, type: 'video' }));
      } else if (file.type.startsWith('image/')) {
        setUploadData((prev) => ({ ...prev, type: 'image' }));
      } else {
        setUploadData((prev) => ({ ...prev, type: 'document' }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }
    if (!uploadData.sharedWith) {
      alert('Please select a client to share with');
      return;
    }
    await uploadDocumentMutation.mutateAsync();
  };

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold brand-font text-highlight">Documents</h1>
            <p className="text-muted text-lg">
              {isBabalawo ? 'Share documents with your clients' : 'Documents from your Personal Awo'}
            </p>
          </div>
          {isBabalawo && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 bg-highlight hover:bg-highlight/90 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-xl"
            >
              <Upload size={20} />
              Upload Document
            </button>
          )}
        </div>

        {/* Documents List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No documents yet.</p>
            {isBabalawo && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 text-highlight hover:text-highlight/80 underline"
              >
                Upload your first document
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((document) => {
              const Icon = getDocumentIcon(document.type);
              const isUploadedByMe = document.uploadedBy === userId;

              return (
                <div
                  key={document.id}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-highlight transition-all"
                >
                  {/* Icon and Actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-highlight/20 flex items-center justify-center text-highlight">
                      <Icon size={24} />
                    </div>
                    {isUploadedByMe && (
                      <button
                        type="button"
                        onClick={() => deleteDocumentMutation.mutate(document.id)}
                        disabled={deleteDocumentMutation.isPending}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        aria-label="Delete document"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  {/* Document Info */}
                  <div className="space-y-2 mb-4">
                    <h3 className="font-bold text-white line-clamp-2">{document.filename}</h3>
                    {document.description && (
                      <p className="text-muted text-sm line-clamp-2">
                        {document.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{formatFileSize(document.size)}</span>
                      <span className="uppercase">{document.type}</span>
                    </div>
                    <p className="text-xs text-muted">
                      {new Date(document.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownload(document)}
                    disabled={getSignedUrlMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all border border-white/20"
                  >
                    {getSignedUrlMutation.isPending && selectedDocument?.id === document.id ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Download
                      </>
                    )}
                  </button>

                  {/* Security Badges */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                    {document.encrypted && (
                      <span className="text-xs text-green-400">🔒 Encrypted</span>
                    )}
                    {document.scanned && (
                      <span className="text-xs text-blue-400">✓ Scanned</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-background border border-white/20 rounded-2xl p-8 max-w-lg w-full space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold brand-font text-white">Upload Document</h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                >
                  ✕
                </button>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted">
                  Select File <span className="text-red-400">*</span>
                </label>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-highlight transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept="*/*"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {selectedFile ? (
                      <>
                        <FileText size={32} className="text-highlight" />
                        <p className="text-white font-medium">{selectedFile.name}</p>
                        <p className="text-muted text-sm">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload size={32} className="text-muted" />
                        <p className="text-white">Click to select file</p>
                        <p className="text-muted text-xs">
                          Max size: 50MB
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Select Client */}
              <div className="space-y-2">
                <label htmlFor="client-select" className="block text-sm font-medium text-muted">
                  Share With Client <span className="text-red-400">*</span>
                </label>
                <select
                  id="client-select"
                  value={uploadData.sharedWith}
                  onChange={(e) =>
                    setUploadData((prev) => ({ ...prev, sharedWith: e.target.value }))
                  }
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-highlight focus:outline-none"
                  aria-label="Select client to share document with"
                >
                  <option value="" className="bg-background">
                    Select a client...
                  </option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id} className="bg-background">
                      {client.yorubaName || client.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Type */}
              <div className="space-y-2">
                <label htmlFor="document-type" className="block text-sm font-medium text-muted">
                  Document Type
                </label>
                <select
                  id="document-type"
                  value={uploadData.type}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      type: e.target.value as Document['type'],
                    }))
                  }
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-highlight focus:outline-none"
                  aria-label="Select document type"
                >
                  <option value="document" className="bg-background">Document</option>
                  <option value="audio" className="bg-background">Audio</option>
                  <option value="video" className="bg-background">Video</option>
                  <option value="image" className="bg-background">Image</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted">
                  Description (Optional)
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Add a description for this document..."
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-highlight focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition-all"
                  disabled={uploadDocumentMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploadDocumentMutation.isPending || !selectedFile}
                  className="flex-1 bg-highlight hover:bg-highlight/90 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadDocumentMutation.isPending ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Upload
                    </>
                  )}
                </button>
              </div>

              {/* Error Display */}
              {uploadDocumentMutation.isError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
                  Upload failed. Please try again or check your connection.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPortal;
