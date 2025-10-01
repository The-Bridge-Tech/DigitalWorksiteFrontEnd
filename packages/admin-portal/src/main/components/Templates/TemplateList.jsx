import React, { useState, useEffect } from 'react';
import { getTemplates, deleteTemplate } from '../../services/templates.service';

const TemplateList = ({ onEdit, onSelect, refreshTrigger }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('modifiedTime');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');

  // Fetch templates on refresh trigger
  useEffect(() => {
    if (selectedFolder) {
      fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Fetch templates from Google Drive
  const fetchTemplates = async () => {
    if (!selectedFolder) {
      setTemplates([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setIsRefreshing(true);

      const fetchedTemplates = await getTemplates(selectedFolder);
      setTemplates(Array.isArray(fetchedTemplates) ? fetchedTemplates : []);
      
      // Clear refresh animation after a short delay
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError(`Failed to fetch templates: ${error?.message || 'Unknown error'}`);
      setIsRefreshing(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle folder selection
  const handleFolderSelect = () => {
    const folderId = prompt('Enter Google Drive folder ID for templates:');
    if (folderId && folderId.trim()) {
      setSelectedFolder(folderId.trim());
    }
  };

  // Fetch templates when folder changes
  useEffect(() => {
    if (selectedFolder) {
      fetchTemplates();
    }
  }, [selectedFolder]);

  // Filter templates by category and search query
  const filteredTemplates = templates.filter((template) => {
    // Filter by category
    if (selectedCategory !== 'all' && template.category !== selectedCategory) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = (template.name || '').toLowerCase();
      const desc = (template.description || '').toLowerCase();
      const category = (template.category || '').toLowerCase();
      const inQuestions =
        Array.isArray(template.questions) &&
        template.questions.some((q) => (q?.question || '').toLowerCase().includes(query));

      return name.includes(query) || desc.includes(query) || category.includes(query) || inQuestions;
    }

    return true;
  });

  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];

    if (sortField === 'name' || sortField === 'category') {
      valueA = (valueA || '').toLowerCase();
      valueB = (valueB || '').toLowerCase();
    } else if (sortField === 'questions') {
      valueA = Array.isArray(a.questions) ? a.questions.length : 0;
      valueB = Array.isArray(b.questions) ? b.questions.length : 0;
    }

    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Get unique categories
  const categories = [
    'all',
    'Safety Inspections',
    'Quality Inspections',
    'Compliance Inspections',
    'Progress Inspections',
    'Specialised Inspections'
  ];

  // Handle sort change
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle template deletion
  const handleDelete = async (templateId, templateName) => {
    if (!window.confirm(`Are you sure you want to delete "${templateName}"?`)) return;

    try {
      setIsLoading(true);
      await deleteTemplate(templateId);
      setTemplates((prev) => prev.filter((t) => t.fileId !== templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
      setError(`Failed to delete template: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && templates.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #6f42c1', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px'
          }}></div>
          <p style={{ color: '#666', margin: 0 }}>Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600' }}>📋 Inspection Templates</h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>Manage inspection templates and forms</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={handleFolderSelect}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '12px 20px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
            >
              📁 Select Folder
            </button>
            <button 
              onClick={fetchTemplates} 
              disabled={isLoading || !selectedFolder}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '12px 20px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: (isLoading || !selectedFolder) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                opacity: (isLoading || !selectedFolder) ? 0.6 : 1
              }}
            >
              {isRefreshing ? '↻' : '🔄'} {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Selected Folder Info */}
      {selectedFolder && (
        <div style={{
          backgroundColor: '#e3f2fd',
          color: '#1976d2',
          padding: '12px 20px',
          borderRadius: '8px',
          border: '1px solid #bbdefb',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0 }}>📁 Templates from folder: <code style={{ backgroundColor: 'rgba(255,255,255,0.7)', padding: '2px 6px', borderRadius: '4px' }}>{selectedFolder}</code></p>
        </div>
      )}

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

      {/* Filters Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '2', minWidth: '300px' }}>
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
              placeholder="Search templates by name, category, or content..."
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6f42c1'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>
          
          {/* Category Filter */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '500' }}>Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {!selectedFolder ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#495057' }}>Select a folder</h3>
          <p style={{ margin: 0, color: '#6c757d' }}>Please select a Google Drive folder to view templates.</p>
        </div>
      ) : sortedTemplates.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#495057' }}>No templates found</h3>
          <p style={{ margin: 0, color: '#6c757d' }}>
            {searchQuery || selectedCategory !== 'all'
              ? 'No templates match your filters. Try changing your search criteria.'
              : 'No templates found in this folder. Create your first template to get started!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {sortedTemplates.map(template => {
            const getCategoryColor = (category) => {
              const colors = {
                'Safety Inspections': { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
                'Quality Inspections': { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
                'Compliance Inspections': { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
                'Progress Inspections': { bg: '#cce5ff', color: '#004085', border: '#b3d7ff' },
                'Specialised Inspections': { bg: '#e2e3e5', color: '#383d41', border: '#d6d8db' }
              };
              return colors[category] || { bg: '#e3f2fd', color: '#1976d2', border: '#bbdefb' };
            };
            
            const categoryStyle = getCategoryColor(template.category);
            
            return (
              <div key={template.fileId} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
              }}>
                
                {/* Template Header */}
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
                    {template.name}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: categoryStyle.bg,
                    color: categoryStyle.color,
                    border: `1px solid ${categoryStyle.border}`
                  }}>
                    {template.category || 'Uncategorized'}
                  </span>
                </div>
                
                {/* Template Stats */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6c757d', fontSize: '14px' }}>❓ Questions:</span>
                    <span style={{ color: '#495057', fontWeight: '500' }}>
                      {Array.isArray(template.questions) ? template.questions.length : 0}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6c757d', fontSize: '14px' }}>🕰️ Modified:</span>
                    <span style={{ color: '#495057', fontSize: '14px' }}>
                      {formatDate(template.modifiedTime || template.updatedAt || template.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(template.fileId)}
                      style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease',
                        flex: 1
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                    >
                      ✏️ Edit
                    </button>
                  )}

                  {onSelect && (
                    <button 
                      onClick={() => onSelect(template)}
                      style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease',
                        flex: 1
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#1e7e34'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                    >
                      ✅ Select
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(template.fileId, template.name)}
                    disabled={!selectedFolder}
                    style={{
                      backgroundColor: !selectedFolder ? '#6c757d' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: !selectedFolder ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.3s ease',
                      flex: 1
                    }}
                    onMouseEnter={(e) => {
                      if (selectedFolder) e.target.style.backgroundColor = '#c82333';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedFolder) e.target.style.backgroundColor = '#dc3545';
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
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

  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (today.getFullYear() === date.getFullYear()) {
    return (
      date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    );
  } else {
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

export default TemplateList;