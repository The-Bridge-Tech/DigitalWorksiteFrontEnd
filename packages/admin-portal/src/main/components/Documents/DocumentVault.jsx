// DocumentVault.jsx
// Document Vault Component for managing permits, inspection requests, and reports

import React, { useState, useEffect } from 'react';
import { getDocuments, updateDocumentStatus, createDocument } from '../../services/document.service';
import { getSites } from '../../services/site.service';
import FileList from './FileList';
import FileUpload from './FileUpload';

const DocumentVault = ({ siteId = null }) => {
  const [documents, setDocuments] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedSiteId, setSelectedSiteId] = useState(siteId);
  
  // UI State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [audioNotes, setAudioNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter, selectedSiteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load documents with filters
      const filters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (typeFilter !== 'all') filters.type = typeFilter;
      if (selectedSiteId) filters.site_id = selectedSiteId;
      
      const [docsData, sitesData] = await Promise.all([
        getDocuments(filters),
        getSites()
      ]);
      
      setDocuments(Array.isArray(docsData) ? docsData : []);
      setSites(Array.isArray(sitesData) ? sitesData : []);
    } catch (err) {
      console.error('Error loading document vault data:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (docId, newStatus) => {
    try {
      await updateDocumentStatus(docId, newStatus);
      loadData(); // Refresh data
    } catch (err) {
      console.error('Error updating document status:', err);
      setError('Failed to update document status');
    }
  };

  // Handle file upload with document metadata
  const handleFileUpload = async (fileData) => {
    if (!showUploadModal.documentType || !showUploadModal.siteId) return;
    
    try {
      // Create document record with audio notes
      await createDocument({
        name: fileData.name,
        document_type: showUploadModal.documentType,
        site_id: showUploadModal.siteId,
        file_id: fileData.id,
        audio_notes: audioNotes, // Include voice-to-text transcription
        status: 'pending'
      });
      
      // Reset form
      setShowUploadModal(false);
      setAudioNotes('');
      setIsRecording(false);
      if (recognition) {
        recognition.stop();
        setRecognition(null);
      }
      
      loadData(); // Refresh data
    } catch (err) {
      console.error('Error creating document record:', err);
      setError('Failed to create document record');
    }
  };

  // Voice recording with start/stop controls
  const [recognition, setRecognition] = useState(null);
  
  const startRecording = () => {
    if ('webkitSpeechRecognition' in window) {
      const newRecognition = new window.webkitSpeechRecognition();
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      
      newRecognition.onstart = () => setIsRecording(true);
      newRecognition.onend = () => {
        setIsRecording(false);
        setRecognition(null);
      };
      newRecognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setAudioNotes(transcript);
      };
      
      setRecognition(newRecognition);
      newRecognition.start();
    } else {
      alert('Speech recognition not supported in this browser');
    }
  };
  
  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
      setIsRecording(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'pending': return '#ffc107';
      case 'expired': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // Get selected site folder ID
  const getSelectedSiteFolderId = () => {
    if (!selectedSiteId) return null;
    
    const site = sites.find(s => s.id === selectedSiteId);
    if (!site?.folder_link) return null;
    
    const folderLink = site.folder_link.trim();
    
    // If it's already just an ID (no slashes or special chars except dash/underscore)
    if (/^[a-zA-Z0-9_-]+$/.test(folderLink)) {
      return folderLink;
    }
    
    // Extract folder ID from various Google Drive URL formats
    const patterns = [
      /\/folders\/([a-zA-Z0-9_-]+)/,  // Standard folder URL
      /id=([a-zA-Z0-9_-]+)/,          // URL parameter format
      /\/drive\/folders\/([a-zA-Z0-9_-]+)/, // Alternative format
    ];
    
    for (const pattern of patterns) {
      const match = folderLink.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // If no pattern matches, return the original (might be a direct ID)
    return folderLink;
  };

  // Handle document preview
  const handlePreview = (doc) => {
    if (doc.file_id) {
      // Set selected document for modal preview
      setSelectedDocument(doc);
    }
  };

  // Handle document download
  const handleDownload = async (doc) => {
    if (doc.file_id) {
      try {
        // Use direct Google Drive download link
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${doc.file_id}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = doc.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Download failed:', err);
        alert(`Download failed: ${err.message}`);
      }
    }
  };

  // Handle document print
  const handlePrint = (doc) => {
    if (doc.file_id) {
      // Open Google Drive view in new window for printing
      const printUrl = `https://drive.google.com/file/d/${doc.file_id}/view`;
      window.open(printUrl, '_blank');
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading documents...</div>;
  }

  return (
    <div style={{ padding: 'clamp(0.75rem, 3vw, 1.25rem)', overflow: 'hidden' }}>
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.25rem)', 
          borderRadius: '6px', 
          marginBottom: 'clamp(0.75rem, 3vw, 1.25rem)',
          border: '1px solid #f5c6cb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 'clamp(0.875rem, 3vw, 1rem)',
          wordBreak: 'break-word'
        }}>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#721c24',
              fontSize: 'clamp(1rem, 4vw, 1.125rem)',
              cursor: 'pointer',
              padding: '0 0.25rem',
              minWidth: '24px',
              minHeight: '24px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Filters Card */}
      <div style={{
        backgroundColor: 'white',
        padding: 'clamp(0.75rem, 3vw, 1.25rem)',
        borderRadius: '8px',
        marginBottom: 'clamp(0.75rem, 3vw, 1.25rem)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef',
        overflow: 'hidden'
      }}>
        <h3 style={{ margin: '0 0 clamp(0.75rem, 3vw, 1rem) 0', color: '#495057', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>Filters & Actions</h3>
        <div style={{ 
          display: 'flex', 
          gap: 'clamp(0.5rem, 2vw, 0.75rem)', 
          flexWrap: 'wrap',
          alignItems: 'flex-end'
        }}>
          {/* Status Filter */}
          <div style={{ minWidth: 'min(120px, 100%)' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '0.25rem',
              fontWeight: '500',
              color: '#495057',
              fontSize: 'clamp(0.75rem, 3vw, 0.875rem)'
            }}>Status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ 
                padding: 'clamp(0.5rem, 2vw, 0.625rem) clamp(0.75rem, 3vw, 1rem)',
                borderRadius: '4px',
                border: '1px solid #ced4da',
                fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                width: '100%',
                minHeight: '36px',
                boxSizing: 'border-box'
              }}
            >
              <option value="all">All Status</option>
              <option value="approved">✅ Approved</option>
              <option value="pending">🟡 Pending</option>
              <option value="expired">🔴 Expired</option>
            </select>
          </div>

          {/* Type Filter */}
          <div style={{ minWidth: 'min(140px, 100%)' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '0.25rem',
              fontWeight: '500',
              color: '#495057',
              fontSize: 'clamp(0.75rem, 3vw, 0.875rem)'
            }}>Type:</label>
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ 
                padding: 'clamp(0.5rem, 2vw, 0.625rem) clamp(0.75rem, 3vw, 1rem)',
                borderRadius: '4px',
                border: '1px solid #ced4da',
                fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                width: '100%',
                minHeight: '36px',
                boxSizing: 'border-box'
              }}
            >
              <option value="all">All Types</option>
              <option value="inspection_report">📋 Inspection Reports</option>
              <option value="permit">📋 Permits</option>
              <option value="inspection_request">🔍 Inspection</option>
              <option value="report">📊 Reports</option>
              <option value="general">📄 General</option>
            </select>
          </div>

          {/* Site Filter */}
          {!siteId && (
            <div style={{ minWidth: 'min(120px, 100%)' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '0.25rem',
                fontWeight: '500',
                color: '#495057',
                fontSize: 'clamp(0.75rem, 3vw, 0.875rem)'
              }}>Site:</label>
              <select 
                value={selectedSiteId || ''} 
                onChange={(e) => setSelectedSiteId(e.target.value || null)}
                style={{ 
                  padding: 'clamp(0.5rem, 2vw, 0.625rem) clamp(0.75rem, 3vw, 1rem)',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                  width: '100%',
                  minHeight: '36px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">All Sites</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Upload Button */}
          <div style={{ marginLeft: 'auto', minWidth: 'min(140px, 100%)' }}>
            <button
              onClick={() => {
                const targetSiteId = selectedSiteId || sites[0]?.id;
                setShowUploadModal({ 
                  show: true, 
                  documentType: 'general', 
                  siteId: targetSiteId
                });
                if (!selectedSiteId && sites[0]?.id) {
                  setSelectedSiteId(sites[0].id);
                }
              }}
              className="theme-bg-primary"
              style={{
                color: 'white',
                border: 'none',
                padding: 'clamp(0.625rem, 2.5vw, 0.75rem) clamp(1rem, 4vw, 1.25rem)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                fontWeight: '500',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease',
                width: '100%',
                minHeight: '44px',
                whiteSpace: 'nowrap'
              }}
            >
              📤 Upload
            </button>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        overflow: 'hidden', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem)', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', fontWeight: '600', whiteSpace: 'nowrap' }}>Document</th>
                <th style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem)', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', fontWeight: '600', whiteSpace: 'nowrap' }}>Type</th>
                <th style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem)', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', fontWeight: '600', whiteSpace: 'nowrap' }}>Site</th>
                <th style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem)', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', fontWeight: '600', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem)', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', fontWeight: '600', whiteSpace: 'nowrap' }}>Version</th>
                <th style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem)', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', fontWeight: '600', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: 'clamp(1rem, 4vw, 1.25rem)', textAlign: 'center', color: '#6c757d', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>
                    No documents found
                  </td>
                </tr>
              ) : (
                documents.map(doc => {
                  return (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.name}>{doc.name}</td>
                      <td style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', whiteSpace: 'nowrap' }}>
                        {doc.document_type === 'permit' && '📋 Permit'}
                        {doc.document_type === 'inspection_request' && '🔍 Inspection'}
                        {doc.document_type === 'inspection_report' && '📋 Inspection Report'}
                        {doc.document_type === 'report' && '📊 Report'}
                        {doc.document_type === 'general' && '📄 General'}
                      </td>
                      <td style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.site_name || 'Unknown'}>{doc.site_name || 'Unknown'}</td>
                      <td style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
                        <span style={{
                          backgroundColor: doc.hazard_flag ? '#dc3545' : getStatusColor(doc.status),
                          color: 'white',
                          padding: 'clamp(0.125rem, 1vw, 0.25rem) clamp(0.25rem, 2vw, 0.5rem)',
                          borderRadius: '8px',
                          fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          maxWidth: 'fit-content'
                        }}>
                          {doc.hazard_flag && '⚠️'}
                          {doc.status}
                        </span>
                      </td>
                      <td style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', whiteSpace: 'nowrap' }}>v{doc.version}</td>
                      <td style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
                        <div style={{ display: 'flex', gap: 'clamp(0.125rem, 1vw, 0.25rem)', flexWrap: 'wrap', minWidth: '200px' }}>
                          {/* Only show status selector for non-inspection documents */}
                          {!doc.id.startsWith('inspection_') && (
                            <select
                              value={doc.status}
                              onChange={(e) => handleStatusUpdate(doc.id, e.target.value)}
                              style={{ 
                                padding: 'clamp(0.125rem, 1vw, 0.25rem)', 
                                fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                                borderRadius: '3px',
                                border: '1px solid #ced4da',
                                minWidth: '80px'
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="expired">Expired</option>
                            </select>
                          )}
                          
                          {/* Preview button - works for both regular docs and inspections */}
                          <button
                            onClick={() => {
                              if (doc.id.startsWith('inspection_')) {
                                window.open(doc.view_url, '_blank');
                              } else {
                                handlePreview(doc);
                              }
                            }}
                            className="theme-bg-secondary"
                            style={{
                              color: 'black',
                              border: 'none',
                              padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.375rem, 1.5vw, 0.5rem)',
                              borderRadius: '3px',
                              fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                              cursor: 'pointer',
                              minWidth: '28px',
                              minHeight: '28px'
                            }}
                            title="Preview"
                          >
                            👁️
                          </button>
                          
                          {/* Download button - works for both regular docs and inspections */}
                          <button
                            onClick={() => {
                              if (doc.id.startsWith('inspection_')) {
                                const link = document.createElement('a');
                                link.href = doc.pdf_url;
                                link.download = doc.name;
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              } else {
                                handleDownload(doc);
                              }
                            }}
                            className="theme-bg-primary"
                            style={{
                              color: 'white',
                              border: 'none',
                              padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.375rem, 1.5vw, 0.5rem)',
                              borderRadius: '3px',
                              fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                              cursor: 'pointer',
                              minWidth: '28px',
                              minHeight: '28px'
                            }}
                            title="Download"
                          >
                            📥
                          </button>
                          
                          {/* Print button - works for both regular docs and inspections */}
                          <button
                            onClick={() => {
                              if (doc.id.startsWith('inspection_')) {
                                window.open(doc.view_url, '_blank');
                              } else {
                                handlePrint(doc);
                              }
                            }}
                            className="theme-bg-secondary"
                            style={{
                              color: 'black',
                              border: 'none',
                              padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.375rem, 1.5vw, 0.5rem)',
                              borderRadius: '3px',
                              fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                              cursor: 'pointer',
                              minWidth: '28px',
                              minHeight: '28px'
                            }}
                            title="Print"
                          >
                            🖨️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '90%',
            height: '90%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>{selectedDocument.name}</h3>
              <button
                onClick={() => setSelectedDocument(null)}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
            {selectedDocument.file_id ? (
              <iframe
                src={`https://drive.google.com/file/d/${selectedDocument.file_id}/preview`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={selectedDocument.name}
                onError={() => {
                  console.error('Preview failed for file:', selectedDocument.file_id);
                }}
              />
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#6c757d'
              }}>
                No file available for preview
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)',
          padding: 'clamp(0.5rem, 2vw, 1rem)',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '100%',
            maxWidth: 'min(600px, 95vw)',
            maxHeight: '95vh',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div className="theme-gradient-primary" style={{
              padding: 'clamp(1rem, 4vw, 1.5625rem) clamp(1.25rem, 5vw, 1.875rem)',
              color: 'white',
              flexShrink: 0
            }}>
              <h2 style={{ margin: '0', fontSize: 'clamp(1.25rem, 5vw, 1.5rem)', fontWeight: '600' }}>
                📤 Upload Document
              </h2>
              <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                Add a new document to the vault
              </p>
            </div>
            
            {/* Modal Content - Scrollable */}
            <div style={{ 
              padding: 'clamp(1rem, 4vw, 1.875rem)', 
              overflowY: 'auto',
              flex: 1,
              WebkitOverflowScrolling: 'touch'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>Document Type:</label>
                <select
                  value={showUploadModal.documentType}
                  onChange={(e) => setShowUploadModal({
                    ...showUploadModal,
                    documentType: e.target.value
                  })}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '8px',
                    border: '2px solid #e9ecef',
                    fontSize: '14px',
                    backgroundColor: '#f8f9fa',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  <option value="general">📄 General</option>
                  <option value="permit">📋 Permit</option>
                  <option value="inspection_request">🔍 Inspection Request</option>
                  <option value="report">📊 Report</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>Site:</label>
                <select
                  value={showUploadModal.siteId || ''}
                  onChange={(e) => {
                    const newSiteId = e.target.value;
                    setShowUploadModal({
                      ...showUploadModal,
                      siteId: newSiteId
                    });
                    // Update the main site selection too
                    setSelectedSiteId(newSiteId);
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '8px',
                    border: '2px solid #e9ecef',
                    fontSize: '14px',
                    backgroundColor: '#f8f9fa',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              {/* Voice Notes (Optional) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>Audio Notes (Voice-to-Text) - Optional:</label>
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}>
                  <button
                    onClick={startRecording}
                    disabled={isRecording}
                    style={{
                      background: isRecording ? '#6c757d' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      cursor: isRecording ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    🎤 Start Recording
                  </button>
                  <button
                    onClick={stopRecording}
                    disabled={!isRecording}
                    style={{
                      background: !isRecording ? '#6c757d' : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      cursor: !isRecording ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ⏹️ Stop Recording
                  </button>
                  {isRecording && (
                    <div style={{ 
                      color: '#dc3545', 
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#dc3545',
                        borderRadius: '50%',
                        animation: 'pulse 1s infinite'
                      }}></div>
                      Recording...
                    </div>
                  )}
                </div>
                <textarea
                  value={audioNotes}
                  onChange={(e) => setAudioNotes(e.target.value)}
                  placeholder="Audio notes will appear here... (Optional)"
                  style={{ 
                    width: '100%', 
                    height: '100px', 
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '2px solid #e9ecef',
                    fontSize: '14px',
                    backgroundColor: '#f8f9fa',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>


            
            <FileUpload
              folderId={getSelectedSiteFolderId()}
              onUploadComplete={handleFileUpload}
            />

              <div style={{ 
                display: 'flex', 
                gap: 'clamp(0.5rem, 2vw, 0.75rem)', 
                justifyContent: 'flex-end', 
                marginTop: 'clamp(1rem, 4vw, 1.875rem)',
                paddingTop: 'clamp(0.75rem, 3vw, 1.25rem)',
                borderTop: '1px solid #e9ecef',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setAudioNotes('');
                    setIsRecording(false);
                    if (recognition) {
                      recognition.stop();
                      setRecognition(null);
                    }
                  }}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1.5rem)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    minHeight: '44px',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default DocumentVault;