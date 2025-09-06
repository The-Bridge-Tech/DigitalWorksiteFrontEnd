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

  // Render QR code modal
  const renderQRModal = () => {
    if (!showQRModal || !selectedSite) return null;

    const url = selectedSite.folderLink || '';
    const title = selectedSite.name || 'Unnamed Site';

    return (
      <div className="qr-modal-overlay" onClick={closeQRModal}>
        <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
          <div className="qr-modal-header">
            <h3>{title} QR Code</h3>
            <button className="close-button" onClick={closeQRModal}>×</button>
          </div>
          
          <div className="qr-modal-content">
            <div className="qr-code-container">
              <QRCode
                id="qr-code-svg"
                value={url}
                size={256}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
            
            <div className="qr-code-info">
              <p><strong>Site:</strong> {title}</p>
              <p><strong>Location:</strong> {selectedSite.location || 'No location specified'}</p>
              <p className="qr-url">
                <strong>URL:</strong> 
                <span className="url-text">{url}</span>
                <button 
                  className="copy-button"
                  onClick={() => handleCopy(url)}
                  title="Copy URL"
                >
                  Copy
                </button>
              </p>
              
              <button 
                className="download-button" 
                onClick={downloadQRCode}
              >
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="site-list">

      <div className="site-list-header">
        <h2>Construction Sites</h2>
        <div className="header-actions">
          <button 
            className="refresh-button" 
            onClick={loadSites}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button 
            className="create-button"
            onClick={() => window.location.href = '/site/new'}
          >
            + Create Site
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="dismiss-button">
            Dismiss
          </button>
        </div>
      )}

      <div className="site-search">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search sites by name, location, or ID..."
          className="search-input"
        />
      </div>

      {isLoading && sites.length === 0 ? (
        <div className="loading-indicator">
          <p>Loading sites...</p>
        </div>
      ) : sortedSites.length === 0 ? (
        <div className="empty-message">
          <p>
            {searchQuery
              ? 'No sites match your search query.'
              : 'No construction sites found. Create your first site!'}
          </p>
        </div>
      ) : (
        <div className="sites-table-container">
          <table className="sites-table">
            <thead>
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  className={sortField === 'name' ? `sorted-${sortDirection}` : ''}
                >
                  Site Name
                </th>
                <th 
                  onClick={() => handleSort('location')}
                  className={sortField === 'location' ? `sorted-${sortDirection}` : ''}
                >
                  Location
                </th>
                <th>QR Code</th>
                <th 
                  onClick={() => handleSort('folderType')}
                  className={sortField === 'folderType' ? `sorted-${sortDirection}` : ''}
                >
                  Storage Type
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSites.map((site) => (
                <tr key={site.id}>
                  <td>{site.name || '—'}</td>
                  <td>{site.location || '—'}</td>
                  <td className="site-qr">
                    {site.folderLink ? (
                      <div 
                        className="site-qr-thumbnail"
                        onClick={() => openQRModal(site)}
                        title="Click to view and download QR code"
                      >
                        <QRCode
                          value={site.folderLink}
                          size={64}
                          level="M"
                          bgColor="#FFFFFF"
                          fgColor="#000000"
                        />
                      </div>
                    ) : (
                      <span>No link</span>
                    )}
                  </td>
                  <td>{site.folderType}</td>
                  <td className="site-actions">
                    <div className="action-buttons">
                      {site.folderLink && (
                        <a 
                          href={site.folderLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="view-folder-button"
                        >
                          View Folder
                        </a>
                      )}
                      
                      {onViewDocuments && (
                        <button 
                          onClick={() => onViewDocuments(site)}
                          className="view-documents-button"
                        >
                          Documents
                        </button>
                      )}
                      
                      {site.folderLink && (
                        <button 
                          onClick={() => openQRModal(site)}
                          className="qr-button"
                        >
                          QR Code
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleEdit(site)}
                        className="edit-button"
                      >
                        Edit
                      </button>
                      
                      <button 
                        onClick={() => handleDelete(site.id, site.name)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Code Modal */}
      {renderQRModal()}
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