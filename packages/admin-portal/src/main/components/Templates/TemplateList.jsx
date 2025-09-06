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

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Fetch templates from Google Drive
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsRefreshing(true);

      const fetchedTemplates = await getTemplates();
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

  return (
    <div className="template-list">
  

      <div className="template-list-header">
        <h2>Inspection Templates</h2>
        <button 
          onClick={fetchTemplates} 
          disabled={isLoading} 
          className="refresh-button"
        >
          <span className="refresh-icon">
            {/* Simple refresh icon using unicode */}
            {isRefreshing ? '↻' : '⟳'}
          </span>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="template-filters">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by name, category, or content..."
            className="search-input"
          />
        </div>

        <div className="category-filter">
          <label htmlFor="category-select">Category:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && templates.length === 0 ? (
        <div className="loading-indicator">
          <p>Loading templates...</p>
        </div>
      ) : sortedTemplates.length === 0 ? (
        <div className="empty-message">
          <p>
            {searchQuery || selectedCategory !== 'all'
              ? 'No templates match your filters. Try changing your search criteria.'
              : 'No templates found. Create your first template to get started!'}
          </p>
        </div>
      ) : (
        <div className="templates-table-container">
          <table className="templates-table">
            <thead>
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className={`sortable ${sortField === 'name' ? `sorted-${sortDirection}` : ''}`}
                >
                  Name
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className={`sortable ${sortField === 'category' ? `sorted-${sortDirection}` : ''}`}
                >
                  Category
                </th>
                <th
                  onClick={() => handleSort('questions')}
                  className={`sortable ${sortField === 'questions' ? `sorted-${sortDirection}` : ''}`}
                >
                  Questions
                </th>
                <th
                  onClick={() => handleSort('modifiedTime')}
                  className={`sortable ${sortField === 'modifiedTime' ? `sorted-${sortDirection}` : ''}`}
                >
                  Last Modified
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTemplates.map((template) => {
                // Determine category class for styling
                const categoryClass = template.category 
                  ? `category-${template.category.toLowerCase().replace(/\s+/g, '-')}` 
                  : 'category-uncategorized';
                
                // Fallback to a known category if custom one doesn't have styling
                const hasCustomCategory = ['safety', 'quality', 'compliance', 'general', 'uncategorized']
                  .includes(template.category?.toLowerCase());
                
                const finalCategoryClass = hasCustomCategory 
                  ? categoryClass 
                  : 'category-general';
                
                return (
                  <tr key={template.fileId}>
                    <td className="template-name">{template.name}</td>
                    <td>
                      <span className={`category-pill ${finalCategoryClass}`}>
                        {template.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="template-questions">
                      {Array.isArray(template.questions) ? template.questions.length : 0}
                    </td>
                    <td className="template-modified">
                      {formatDate(template.modifiedTime || template.updatedAt || template.createdAt)}
                    </td>
                    <td className="template-actions">
                      <div className="action-buttons">
                        {onEdit && (
                          <button onClick={() => onEdit(template.fileId)} className="edit-button">
                            Edit
                          </button>
                        )}

                        {onSelect && (
                          <button onClick={() => onSelect(template)} className="select-button">
                            Select
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(template.fileId, template.name)}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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