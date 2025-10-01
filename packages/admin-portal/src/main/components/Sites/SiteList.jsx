import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { getSites, deleteSite } from '../../services/site.service';
import EditSite from './EditSite';

// Normalize site data from various API formats
function normalizeSite(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = raw.id || raw.site_id || raw.siteId || '';
  const name = raw.name || raw.site_name || '';
  const location = raw.location || raw.site_location || '';
  const folderLink = raw.folder_link || raw.resource_url || '';
  const folderType = raw.folder_type || raw.storage_type || 'GoogleDrive';

  return {
    __raw: raw, // Keep original for reference
    id,
    site_id: id,
    name,
    location,
    folderLink,
    folderType
  };
}

const SiteList = ({ onViewDocuments, refreshTrigger }) => {
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // State for QR code modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [siteToEdit, setSiteToEdit] = useState(null);

  // Load sites
  useEffect(() => {
    loadSites();
  }, [refreshTrigger]);

  const loadSites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedSites = await getSites();
      const normalized = Array.isArray(loadedSites) 
        ? loadedSites.map(normalizeSite).filter(Boolean) 
        : [];
      setSites(normalized);
    } catch (err) {
      console.error('Error loading sites:', err);
      setError('Failed to load sites. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort sites
  const filteredSites = sites.filter((site) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (site.name || '').toLowerCase().includes(q) ||
      (site.location || '').toLowerCase().includes(q) ||
      (site.id || '').toLowerCase().includes(q)
    );
  });

  const sortedSites = [...filteredSites].sort((a, b) => {
    let va = a[sortField];
    let vb = b[sortField];
    if (typeof va === 'string') {
      va = va.toLowerCase();
      vb = (vb || '').toLowerCase();
    }
    if (va < vb) return sortDirection === 'asc' ? -1 : 1;
    if (va > vb) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle sort column click
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle delete site
  const handleDelete = async (siteId, siteName) => {
    if (!window.confirm(`Delete "${siteName}"? This cannot be undone.`)) return;
    try {
      setIsLoading(true);
      await deleteSite(siteId);
      setSites((prev) => prev.filter((s) => s.id !== siteId));
    } catch (err) {
      console.error('Error deleting site:', err);
      setError(`Failed to delete site: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle opening QR modal
  const openQRModal = (site) => {
    setSelectedSite(site);
    setShowQRModal(true);
  };

  // Handle closing QR modal
  const closeQRModal = () => {
    setShowQRModal(false);
    setSelectedSite(null);
  };

  // Handle download QR code
  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg || !selectedSite) return;

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Create an image from the SVG
    const image = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    image.onload = () => {
      // Set canvas dimensions to match the SVG but scaled up for better quality
      canvas.width = image.width * 3;
      canvas.height = image.height * 3;
      
      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the image
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      
      // Create a download link
      const link = document.createElement('a');
      link.download = `${selectedSite.name.replace(/\s+/g, '_') || 'site'}_QR.png`;
      
      // Convert canvas to blob and create URL
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.click();
        
        // Clean up
        URL.revokeObjectURL(url);
      });
      
      // Clean up SVG URL
      URL.revokeObjectURL(url);
    };
    
    image.src = url;
  };

  // Handle edit site
  const handleEdit = (site) => {
    setSiteToEdit(site.__raw || site);
    setIsEditing(true);
  };

  // Handle save completion
  const handleSaveComplete = () => {
    setSiteToEdit(null);
    setIsEditing(false);
    loadSites(); // Refresh the list
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setSiteToEdit(null);
    setIsEditing(false);
  };

  // Copy link to clipboard
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Link copied to clipboard");
    } catch {
      // Silent fail for browsers that block clipboard in HTTP context
    }
  };

  // If in edit mode, show the EditSite component
  if (isEditing && siteToEdit) {
    return (
      <EditSite 
        site={siteToEdit}
        onSave={handleSaveComplete}
        onCancel={handleCancelEdit}
      />
    );
  }



  if (isLoading && sites.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #667eea', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px'
          }}></div>
          <p style={{ color: '#666', margin: 0 }}>Loading sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600' }}>🏗️ Construction Sites</h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>Manage construction sites and generate QR codes</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={loadSites}
              disabled={isLoading}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '12px 20px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
            >
              {isLoading ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
            <button 
              onClick={() => window.location.href = '/site/new'}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '12px 24px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
            >
              ➕ Create Site
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px 20px',
          borderRadius: '8px',
          border: '1px solid #f5c6cb',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span><strong>Error:</strong> {error}</span>
          <button 
            onClick={() => setError(null)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#721c24',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Search Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6c757d',
            fontSize: '16px'
          }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sites by name, location, or ID..."
            style={{
              width: '100%',
              padding: '12px 12px 12px 40px',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '16px',
              transition: 'border-color 0.3s ease',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          />
        </div>
      </div>

      {/* Sites Grid */}
      {sortedSites.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#495057' }}>
            {searchQuery ? 'No sites found' : 'No construction sites found'}
          </h3>
          <p style={{ margin: 0, color: '#6c757d' }}>
            {searchQuery 
              ? 'Try adjusting your search terms.' 
              : 'Create your first site to get started!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {sortedSites.map(site => (
            <div key={site.id} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
            }}>
              
              {/* Site Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
                  {site.name || 'Unnamed Site'}
                </h3>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  border: '1px solid #bbdefb'
                }}>
                  {site.folderType}
                </span>
              </div>
              
              {/* Location */}
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px 0', color: '#6c757d', fontSize: '14px' }}>📍 Location</p>
                <p style={{ margin: 0, color: '#495057', fontSize: '16px' }}>
                  {site.location || 'No location specified'}
                </p>
              </div>

              {/* QR Code Preview */}
              {site.folderLink && (
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <div 
                    onClick={() => openQRModal(site)}
                    style={{
                      display: 'inline-block',
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  >
                    <QRCode
                      value={site.folderLink}
                      size={80}
                      level="M"
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                    />
                  </div>
                  <p style={{ margin: '8px 0 0 0', color: '#6c757d', fontSize: '12px' }}>
                    Click to view full QR code
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {site.folderLink && (
                  <a 
                    href={site.folderLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      padding: '8px 12px',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                  >
                    📁 View Folder
                  </a>
                )}
                
                {onViewDocuments && (
                  <button 
                    onClick={() => onViewDocuments(site)}
                    style={{
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#138496'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#17a2b8'}
                  >
                    📄 Documents
                  </button>
                )}
                
                {site.folderLink && (
                  <button 
                    onClick={() => openQRModal(site)}
                    style={{
                      backgroundColor: '#6f42c1',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#5a32a3'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#6f42c1'}
                  >
                    📱 QR Code
                  </button>
                )}
                
                <button 
                  onClick={() => handleEdit(site)}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#1e7e34'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                >
                  ✏️ Edit
                </button>
                
                <button 
                  onClick={() => handleDelete(site.id, site.name)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedSite && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }} onClick={closeQRModal}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '1px solid #e9ecef'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '24px' }}>📱 QR Code</h2>
              <button 
                onClick={closeQRModal}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#495057' }}>{selectedSite.name}</h3>
              <p style={{ margin: 0, color: '#6c757d' }}>{selectedSite.location || 'No location specified'}</p>
            </div>
            
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              display: 'inline-block'
            }}>
              <QRCode
                id="qr-code-svg"
                value={selectedSite.folderLink || ''}
                size={256}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
            
            <div style={{ marginBottom: '24px', textAlign: 'left', backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6c757d' }}>
                <strong>URL:</strong>
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#495057', 
                  wordBreak: 'break-all',
                  flex: 1
                }}>
                  {selectedSite.folderLink}
                </span>
                <button 
                  onClick={() => handleCopy(selectedSite.folderLink)}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
            
            <button 
              onClick={downloadQRCode}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              📥 Download QR Code
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Helper to format date
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  if (today.getFullYear() === date.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

export default SiteList;