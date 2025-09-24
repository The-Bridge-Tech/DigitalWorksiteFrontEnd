// TemplateForm.jsx
// Template Form Component for Admin Portal with PDF generation

import React, { useState, useEffect } from 'react';
import { createTemplate, updateTemplate, getTemplate } from '../../services/templates.service';
import { checkAuthStatus, redirectToAuth } from '../../services/auth.service';
import { generateTemplatePDF } from '../../utils/pdf';
import { createFile } from '../../services/drive.service';

const TemplateForm = ({ templateId, onSave, onCancel }) => {
  // Add authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Template state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    questions: [{ question: '', type: 'text', required: false, options: [] }]
  });
  const [selectedFolder, setSelectedFolder] = useState('');

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthed = await checkAuthStatus();
        setIsAuthenticated(isAuthed);
        
        // If not authenticated, redirect to login
        if (!isAuthed) {
          redirectToAuth();
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
      } finally {
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, []);

  // If templateId is provided, load template data
  useEffect(() => {
    if (templateId && isAuthenticated) {
      setIsEditing(true);
      loadTemplate(templateId);
    }
  }, [templateId, isAuthenticated]);

  // Load template data from Google Drive
  const loadTemplate = async (id) => {
    try {
      setIsLoading(true);
      setError(null);

      const template = await getTemplate(id);

      // Ensure questions have proper structure
      const processedQuestions = template.questions && template.questions.length > 0
        ? template.questions.map((q) => ({
            question: q.question || '',
            type: q.type || 'text',
            required: q.required || false,
            options: Array.isArray(q.options) ? q.options : (q.options ? q.options.split('\n').filter(opt => opt.trim()).map(opt => opt.trim()) : [''])
          }))
        : [{ question: '', type: 'text', required: false, options: [''] }];

      setFormData({
        name: template.name || '',
        category: template.category || '',
        description: template.description || '',
        questions: processedQuestions
      });
    } catch (error) {
      console.error('Error loading template:', error);
      
      // If authentication error, redirect to login
      if (error.message && error.message.includes('Authentication required')) {
        redirectToAuth();
        return;
      }
      
      setError(`Failed to load template: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle folder selection
  const handleFolderSelect = () => {
    const folderId = prompt('Enter Google Drive folder ID where templates will be saved:');
    if (folderId && folderId.trim()) {
      setSelectedFolder(folderId.trim());
    }
  };

  // Handle question field changes
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setFormData({ ...formData, questions: updatedQuestions });
  };

  // Add a new question
  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { 
        question: '', 
        type: 'text', 
        required: false, 
        options: [''] 
      }]
    });
  };

  // Remove a question
  const removeQuestion = (index) => {
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: updatedQuestions });
  };

  // Generate PDF and upload to Drive
  const generatePDF = async () => {
    try {
      setIsLoading(true);
      
      // Validate form data
      if (!formData.name.trim()) {
        setError('Template name is required to generate PDF');
        setIsLoading(false);
        return;
      }
      
      // Ask for folder ID
      const folderId = prompt('Enter Google Drive folder ID (leave empty for root folder):');
      
      // Generate PDF blob
      const pdfBlob = generateTemplatePDF(formData);
      
      // Convert blob to base64 for proper binary handling
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
          resolve(base64);
        };
        reader.readAsDataURL(pdfBlob);
      });
      
      // Upload PDF to Drive
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const pdfName = `${formData.name}_${timestamp}.pdf`;
      
      // Create file in Drive with base64 content
      await createFile({
        name: pdfName,
        mimeType: 'application/pdf',
        parents: folderId ? [folderId.trim()] : [],
        contentBase64: base64Data
      });
      
      setPdfGenerated(true);
      setError(null);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setPdfGenerated(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError(`Failed to generate PDF: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Discard changes
  const handleDiscard = () => {
    // Clear form data if creating new template
    if (!isEditing) {
      setFormData({
        name: '',
        category: '',
        description: '',
        questions: [{ question: '', type: 'text', required: false, options: [''] }]
      });
      setSelectedFolder('');
    }

    // Call onCancel callback if provided
    if (onCancel) {
      onCancel();
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if authenticated
    if (!isAuthenticated) {
      redirectToAuth();
      return;
    }

    // Validate form
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }

    if (!formData.category.trim()) {
      setError('Please select a category for this template');
      return;
    }

    if (!selectedFolder.trim() && !isEditing) {
      setError('Please select a folder to save the template');
      return;
    }

    if (formData.questions.some(q => !q.question.trim())) {
      setError('All questions must have content');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      let result;

      if (isEditing) {
        // Update existing template
        result = await updateTemplate(templateId, formData);
      } else {
        // Create new template with folder
        result = await createTemplate(formData, selectedFolder);
      }
      
      // Also generate PDF
      try {
        const shouldGeneratePdf = confirm('Generate PDF for this template?');
        if (shouldGeneratePdf) {
          const folderId = prompt('Enter Google Drive folder ID for PDF (leave empty for root folder):');
          
          const pdfBlob = generateTemplatePDF(formData);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const pdfName = `${formData.name}_${timestamp}.pdf`;
          
          // Convert blob to base64
          const base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              resolve(base64);
            };
            reader.readAsDataURL(pdfBlob);
          });
          
          console.log('PDF base64 length:', base64Data.length);
          
          // Upload PDF to Drive
          const uploadResult = await createFile({
            name: pdfName,
            mimeType: 'application/pdf',
            parents: folderId ? [folderId.trim()] : [],
            contentBase64: base64Data
          });
          
          console.log('PDF upload result:', uploadResult);
          
          console.log('PDF generated and uploaded successfully');
        }
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        // Don't fail the whole save if PDF generation fails
      }

      // Notify parent component
      if (onSave) {
        onSave(result);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      
      // If authentication error, redirect to login
      if (error.message && error.message.includes('Authentication required')) {
        redirectToAuth();
        return;
      }
      
      setError(`Failed to save template: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // If checking authentication or loading, show loading state
  if (!authChecked || (templateId && isLoading && !error)) {
    return <div className="loading">Loading...</div>;
  }

  // If not authenticated, show login message (though redirectToAuth should handle this)
  if (!isAuthenticated) {
    return (
      <div className="auth-required">
        <h3>Authentication Required</h3>
        <p>Please sign in to access this feature.</p>
        <button 
          onClick={() => redirectToAuth()}
          className="sign-in-button"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <>
  

    <div className="template-form">
      <h2>{isEditing ? 'Edit Template' : 'Create New Inspection Template'}</h2>

      {error && (
        <div className="form-error">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="dismiss-button">
            Dismiss
          </button>
        </div>
      )}
      
      {pdfGenerated && (
        <div className="form-success">
          <p>PDF generated and uploaded successfully</p>
          <button onClick={() => setPdfGenerated(false)} className="dismiss-button">
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="template-name">Template Name:</label>
          <input
            id="template-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter template name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="template-category">Category:</label>
          <select
            id="template-category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">-- Select a Category --</option>
            <option value="Safety Inspections">Safety Inspections</option>
            <option value="Quality Inspections">Quality Inspections</option>
            <option value="Compliance Inspections">Compliance Inspections</option>
            <option value="Progress Inspections">Progress Inspections</option>
            <option value="Specialised Inspections">Specialised Inspections</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="template-description">Description:</label>
          <textarea
            id="template-description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter template description"
            rows={3}
          />
        </div>

        {!isEditing && (
          <div className="form-group">
            <label>Save Location:</label>
            <div className="folder-selection">
              <button
                type="button"
                onClick={handleFolderSelect}
                className="folder-select-button"
              >
                📁 Select Folder
              </button>
              {selectedFolder && (
                <div className="selected-folder">
                  <span>Folder: <code>{selectedFolder}</code></span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Questions:</label>

          <div className="questions-container">
            {formData.questions.map((question, index) => (
              <div key={index} className="question-item">
                <div className="question-header">
                  <span className="question-number">Question {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="remove-question-button"
                    disabled={formData.questions.length <= 1}
                  >
                    Remove
                  </button>
                </div>

                <div className="question-content">
                  <div className="question-text">
                    <label htmlFor={`question-${index}`}>Question:</label>
                    <input
                      id={`question-${index}`}
                      type="text"
                      value={question.question}
                      onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                      placeholder="Enter question"
                      required
                    />
                  </div>

                  <div className="question-settings">
                    <div className="question-type">
                      <label htmlFor={`question-type-${index}`}>Type:</label>
                      <select
                        id={`question-type-${index}`}
                        value={question.type}
                        onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="select">Select</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="radio">Radio</option>
                      </select>
                    </div>

                    <div className="question-required">
                      <label>
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => handleQuestionChange(index, 'required', e.target.checked)}
                        />
                        Required
                      </label>
                    </div>
                  </div>

                  {/* Options for select, radio, or checkbox types */}
                  {['select', 'radio', 'checkbox'].includes(question.type) && (
                    <div className="question-options">
                      <label>Options:</label>
                      <div className="options-list">
                        {(question.options || ['']).map((option, optIndex) => (
                          <div key={optIndex} className="option-item">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(question.options || [''])];
                                newOptions[optIndex] = e.target.value;
                                handleQuestionChange(index, 'options', newOptions);
                              }}
                              placeholder={`Option ${optIndex + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = (question.options || ['']).filter((_, i) => i !== optIndex);
                                handleQuestionChange(index, 'options', newOptions.length > 0 ? newOptions : ['']);
                              }}
                              className="remove-option-button"
                              disabled={(question.options || ['']).length <= 1}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = [...(question.options || ['']), ''];
                            handleQuestionChange(index, 'options', newOptions);
                          }}
                          className="add-option-button"
                        >
                          Add Option
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addQuestion}
              className="add-question-button"
            >
              Add Question
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleDiscard}
            className="cancel-button"
            disabled={isSaving || isLoading}
          >
            {isEditing ? 'Cancel' : 'Discard'}
          </button>
          
          <button
            type="button"
            onClick={generatePDF}
            className="pdf-button"
            disabled={isSaving || isLoading || !formData.name.trim()}
          >
            Generate PDF
          </button>

          <button
            type="submit"
            className="save-button"
            disabled={isSaving || isLoading}
          >
            {isSaving ? 'Saving...' : (isEditing ? 'Update Template' : 'Save Template')}
          </button>
        </div>
      </form>
    </div>
    </>
  );
};

export default TemplateForm;