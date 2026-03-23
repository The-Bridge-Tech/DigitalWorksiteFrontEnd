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

const SiteList = ({ onViewDocuments, refreshTrigger, onCreateNew }) => {
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
    <div style={{ padding: 'clamp(0.75rem, 3vw, 1.25rem)', maxWidth: '100%', margin: '0 auto', overflow: 'hidden' }}>
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
        borderRadius: '8px',
        padding: 'clamp(0.75rem, 3vw, 1.25rem)',
        marginBottom: 'clamp(0.75rem, 3vw, 1.25rem)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', maxWidth: '100%' }}>
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6c757d',
            fontSize: 'clamp(0.875rem, 3vw, 1rem)'
          }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sites..."
            style={{
              width: '100%',
              padding: 'clamp(0.75rem, 3vw, 1rem) clamp(0.75rem, 3vw, 1rem) clamp(0.75rem, 3vw, 1rem) clamp(2.5rem, 8vw, 3rem)',
              border: '2px solid #e9ecef',
              borderRadius: '6px',
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              transition: 'border-color 0.3s ease',
              outline: 'none',
              boxSizing: 'border-box'
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 'clamp(0.75rem, 3vw, 1.25rem)', maxWidth: '100%' }}>
          {sortedSites.map(site => (
            <div key={site.id} style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: 'clamp(1rem, 4vw, 1.5rem)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}>
              
              {/* Site Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'clamp(0.75rem, 3vw, 1rem)', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: '600', color: '#2c3e50', lineHeight: '1.2', wordBreak: 'break-word', flex: 1 }}>
                  {site.name || 'Unnamed Site'}
                </h3>
                <span style={{
                  padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.5rem, 2vw, 0.75rem)',
                  borderRadius: '12px',
                  fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                  fontWeight: '500',
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  border: '1px solid #bbdefb',
                  whiteSpace: 'nowrap'
                }}>
                  {site.folderType}
                </span>
              </div>
              
              {/* Location */}
              <div style={{ marginBottom: 'clamp(0.75rem, 3vw, 1rem)' }}>
                <p style={{ margin: '0 0 0.25rem 0', color: '#6c757d', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>📍 Location</p>
                <p style={{ margin: 0, color: '#495057', fontSize: 'clamp(0.875rem, 3vw, 1rem)', wordBreak: 'break-word' }}>
                  {site.location || 'No location specified'}
                </p>
              </div>

              {/* QR Code Preview */}
              {site.folderLink && (
                <div style={{ marginBottom: 'clamp(1rem, 4vw, 1.25rem)', textAlign: 'center' }}>
                  <div 
                    onClick={() => openQRModal(site)}
                    style={{
                      display: 'inline-block',
                      padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  >
                    <QRCode
                      value={JSON.stringify({
                        id: site.qr_id || site.id,
                        site: site.name,
                        location: site.location
                      })}
                      size={Math.min(80, window.innerWidth * 0.15)}
                      level="M"
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                    />
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#6c757d', fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
                    Click to view full QR code
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 'clamp(0.25rem, 1vw, 0.5rem)', flexWrap: 'wrap' }}>
                {site.folderLink && (
                  <a 
                    href={site.folderLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="theme-bg-primary"
                    style={{
                      color: 'white',
                      padding: 'clamp(0.5rem, 2vw, 0.625rem) clamp(0.75rem, 3vw, 1rem)',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      display: 'inline-block',
                      textAlign: 'center',
                      minHeight: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    📁 Folder
                  </a>
                )}
                
                {onViewDocuments && (
                  <button 
                    onClick={() => onViewDocuments(site)}
                    className="theme-bg-secondary"
                    style={{
                      color: 'black',
                      border: 'none',
                      padding: 'clamp(0.5rem, 2vw, 0.625rem) clamp(0.75rem, 3vw, 1rem)',
                      borderRadius: '4px',
                      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: '36px'
                    }}
                  >
                    📄 Docs
                  </button>
                )}
                
                {site.folderLink && (
                  <button 
                    onClick={() => openQRModal(site)}
                    className="theme-bg-primary"
                    style={{
                      color: 'white',
                      border: 'none',
                      padding: 'clamp(0.5rem, 2vw, 0.625rem) clamp(0.75rem, 3vw, 1rem)',
                      borderRadius: '4px',
                      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: '36px'
                    }}
                  >
                    📱 QR
                  </button>
                )}
                
                <button 
                  onClick={() => handleEdit(site)}
                  className="theme-bg-secondary"
                  style={{
                    color: 'black',
                    border: 'none',
                    padding: 'clamp(0.5rem, 2vw, 0.625rem) clamp(0.75rem, 3vw, 1rem)',
                    borderRadius: '4px',
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minHeight: '36px'
                  }}
                >
                  ✏️ Edit
                </button>
                
                <button 
                  onClick={() => handleDelete(site.id, site.name)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: 'clamp(0.5rem, 2vw, 0.625rem) clamp(0.75rem, 3vw, 1rem)',
                    borderRadius: '4px',
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    minHeight: '36px'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                >
                  🗑️ Del
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
                value={JSON.stringify({
                  id: selectedSite.qr_id || selectedSite.id,
                  site: selectedSite.name,
                  location: selectedSite.location
                })}
                size={256}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
            
            <button 
              onClick={downloadQRCode}
              className="theme-bg-primary"
              style={{
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
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