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
    <div style={{ padding: '2rem' }}>
      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600' }}>
          📁 Document Vault
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>
          Manage permits, inspection requests, reports and documentation
        </p>
      </div>
      
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '15px 20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #f5c6cb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#721c24',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0 5px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Filters Card */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057', fontSize: '18px' }}>Filters & Actions</h3>
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Status Filter */}
          <div>
            <label style={{ 
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500',
              color: '#495057',
              fontSize: '14px'
            }}>Status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ 
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '14px',
                minWidth: '140px'
              }}
            >
              <option value="all">All Status</option>
              <option value="approved">✅ Approved</option>
              <option value="pending">🟡 Pending</option>
              <option value="expired">🔴 Expired</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label style={{ 
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500',
              color: '#495057',
              fontSize: '14px'
            }}>Type:</label>
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ 
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '14px',
                minWidth: '160px'
              }}
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
              <label style={{ 
                display: 'block',
                marginBottom: '5px',
                fontWeight: '500',
                color: '#495057',
                fontSize: '14px'
              }}>Site:</label>
              <select 
                value={selectedSiteId || ''} 
                onChange={(e) => setSelectedSiteId(e.target.value || null)}
                style={{ 
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ced4da',
                  fontSize: '14px',
                  minWidth: '140px'
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
          <div style={{ marginLeft: 'auto' }}>
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
                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(0,123,255,0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(0,123,255,0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,123,255,0.3)';
              }}
            >
              📤 Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        overflow: 'hidden', 
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef'
      }}>
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
                return (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>{doc.name}</td>
                    <td style={{ padding: '12px' }}>
                      {doc.document_type === 'permit' && '📋 Permit'}
                      {doc.document_type === 'inspection_request' && '🔍 Inspection Request'}
                      {doc.document_type === 'report' && '📊 Report'}
                      {doc.document_type === 'general' && '📄 General'}
                    </td>
                    <td style={{ padding: '12px' }}>{doc.site_name || 'Unknown'}</td>
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
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '0',
            borderRadius: '16px',
            minWidth: '600px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
              padding: '25px 30px',
              color: 'white'
            }}>
              <h2 style={{ margin: '0', fontSize: '24px', fontWeight: '600' }}>
                📤 Upload Document
              </h2>
              <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                Add a new document to the vault
              </p>
            </div>
            
            {/* Modal Content */}
            <div style={{ padding: '30px' }}>
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
                gap: '12px', 
                justifyContent: 'flex-end', 
                marginTop: '30px',
                paddingTop: '20px',
                borderTop: '1px solid #e9ecef'
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
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
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