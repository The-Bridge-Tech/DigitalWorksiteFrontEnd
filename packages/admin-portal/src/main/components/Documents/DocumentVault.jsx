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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>📁 Document Vault</h2>
      
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none' }}>×</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Status Filter */}
        <div>
          <label style={{ marginRight: '5px' }}>Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '5px' }}
          >
            <option value="all">All Status</option>
            <option value="approved">✅ Approved</option>
            <option value="pending">🟡 Pending</option>
            <option value="expired">🔴 Expired</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label style={{ marginRight: '5px' }}>Type:</label>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '5px' }}
          >
            <option value="all">All Types</option>
            <option value="permit">📋 Permits</option>
            <option value="inspection_request">🔍 Inspection Requests</option>
            <option value="report">📊 Reports</option>
            <option value="general">📄 General</option>
          </select>
        </div>

        {/* Site Filter */}
        {!siteId && (
          <div>
            <label style={{ marginRight: '5px' }}>Site:</label>
            <select 
              value={selectedSiteId || ''} 
              onChange={(e) => setSelectedSiteId(e.target.value || null)}
              style={{ padding: '5px' }}
            >
              <option value="">All Sites</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={() => {
            const targetSiteId = selectedSiteId || sites[0]?.id;
            setShowUploadModal({ 
              show: true, 
              documentType: 'general', 
              siteId: targetSiteId
            });
            // Auto-select the site if none is selected
            if (!selectedSiteId && sites[0]?.id) {
              setSelectedSiteId(sites[0].id);
            }
          }}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📤 Upload Document
        </button>
      </div>

      {/* Documents Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Document</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Type</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Site</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Version</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                  No documents found
                </td>
              </tr>
            ) : (
              documents.map(doc => {
                const site = sites.find(s => s.id === doc.site_id);
                return (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>{doc.name}</td>
                    <td style={{ padding: '12px' }}>
                      {doc.document_type === 'permit' && '📋 Permit'}
                      {doc.document_type === 'inspection_request' && '🔍 Inspection Request'}
                      {doc.document_type === 'report' && '📊 Report'}
                      {doc.document_type === 'general' && '📄 General'}
                    </td>
                    <td style={{ padding: '12px' }}>{site?.name || 'Unknown'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        backgroundColor: getStatusColor(doc.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>v{doc.version}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <select
                          value={doc.status}
                          onChange={(e) => handleStatusUpdate(doc.id, e.target.value)}
                          style={{ padding: '4px', fontSize: '12px' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="expired">Expired</option>
                        </select>
                        {doc.file_id && (
                          <>
                            <button
                              onClick={() => handlePreview(doc)}
                              style={{
                                backgroundColor: '#17a2b8',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '3px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                              title="Preview"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleDownload(doc)}
                              style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '3px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                              title="Download"
                            >
                              📥
                            </button>
                            <button
                              onClick={() => handlePrint(doc)}
                              style={{
                                backgroundColor: '#6f42c1',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '3px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                              title="Print"
                            >
                              🖨️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            minWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3>Upload Document</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label>Document Type:</label>
              <select
                value={showUploadModal.documentType}
                onChange={(e) => setShowUploadModal({
                  ...showUploadModal,
                  documentType: e.target.value
                })}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              >
                <option value="general">📄 General</option>
                <option value="permit">📋 Permit</option>
                <option value="inspection_request">🔍 Inspection Request</option>
                <option value="report">📊 Report</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Site:</label>
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
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              >
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>

            {/* Voice Notes (Optional) */}
            <div style={{ marginBottom: '15px' }}>
              <label>Audio Notes (Voice-to-Text) - Optional:</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <button
                  onClick={startRecording}
                  disabled={isRecording}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: isRecording ? 'not-allowed' : 'pointer',
                    opacity: isRecording ? 0.6 : 1
                  }}
                >
                  🎤 Start Recording
                </button>
                <button
                  onClick={stopRecording}
                  disabled={!isRecording}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: !isRecording ? 'not-allowed' : 'pointer',
                    opacity: !isRecording ? 0.6 : 1
                  }}
                >
                  ⏹️ Stop Recording
                </button>
                {isRecording && (
                  <span style={{ color: '#dc3545', alignSelf: 'center' }}>
                    🔴 Recording...
                  </span>
                )}
              </div>
              <textarea
                value={audioNotes}
                onChange={(e) => setAudioNotes(e.target.value)}
                placeholder="Audio notes will appear here... (Optional)"
                style={{ width: '100%', height: '80px', marginTop: '10px', padding: '8px' }}
              />
            </div>


            
            <FileUpload
              folderId={getSelectedSiteFolderId()}
              onUploadComplete={handleFileUpload}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
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
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentVault;