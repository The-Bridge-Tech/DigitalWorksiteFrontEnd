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
    questions: [{ question: '', type: 'text', required: false }]
  });

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

      setFormData({
        name: template.name || '',
        category: template.category || '',
        description: template.description || '',
        questions: template.questions && template.questions.length > 0
          ? template.questions
          : [{ question: '', type: 'text', required: false }]
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
      questions: [...formData.questions, { question: '', type: 'text', required: false }]
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
      
      // Generate PDF blob
      const pdfBlob = generateTemplatePDF(formData);
      
      // Upload PDF to Drive
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const pdfName = `${formData.name}_${timestamp}.pdf`;
      
      // Get parent folder from template
      let parentFolder = null;
      if (templateId) {
        try {
          const template = await getTemplate(templateId);
          if (template.parentFolderId) {
            parentFolder = template.parentFolderId;
          }
        } catch (err) {
          console.warn('Could not get parent folder from template:', err);
        }
      }
      
      // Create file in Drive
      await createFile({
        name: pdfName,
        mimeType: 'application/pdf',
        parents: parentFolder ? [parentFolder] : [],
        content: pdfBlob
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
        questions: [{ question: '', type: 'text', required: false }]
      });
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
        // Create new template
        result = await createTemplate(formData);
      }
      
      // Also generate PDF
      try {
        const pdfBlob = generateTemplatePDF(formData);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const pdfName = `${formData.name}_${timestamp}.pdf`;
        
        // Upload PDF to Drive
        await createFile({
          name: pdfName,
          mimeType: 'application/pdf',
          parents: result.fileId ? [result.fileId] : [],
          content: pdfBlob
        });
        
        console.log('PDF generated and uploaded successfully');
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
    <style>{`
  .template-form {
    padding: 2rem;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    color: #343a40;
  }

  .template-form h2 {
    font-size: 1.8rem;
    font-weight: 600;
    color: #007bff;
    margin-bottom: 2rem;
    border-bottom: 2px solid #e0e0e0;
    padding-bottom: 0.5rem;
    text-align: center;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #495057;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }

  .cancel-button {
    background: none;
    border: none;
    color: #6c757d;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .cancel-button:hover:not(:disabled) {
    color: #343a40;
  }

  .save-button,
  .pdf-button {
    background-color: #007bff;
    color: #fff;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 50px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .save-button:hover:not(:disabled),
  .pdf-button:hover:not(:disabled) {
    background-color: #0056b3;
    transform: translateY(-2px);
  }

  .save-button:disabled,
  .pdf-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .form-error,
  .form-success {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    font-weight: 500;
  }

  .form-error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .form-success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .dismiss-button {
    background: none;
    border: none;
    color: inherit;
    font-weight: bold;
    cursor: pointer;
    margin-left: 1rem;
  }

  .questions-container {
    border-top: 1px solid #e0e0e0;
    padding-top: 1rem;
  }

  .question-item {
    padding: 1rem;
    margin-bottom: 1rem;
    background-color: #f9f9f9;
    border-radius: 8px;
    border: 1px solid #dee2e6;
  }

  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .remove-question-button {
    background-color: #ffebee;
    color: #c62828;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    cursor: pointer;
  }

  .remove-question-button:hover:not(:disabled) {
    background-color: #ffcdd2;
  }

  .question-content input,
  .question-content select,
  .question-content textarea {
    width: 100%;
    padding: 0.5rem;
    margin-top: 0.25rem;
    margin-bottom: 0.5rem;
    border-radius: 6px;
    border: 1px solid #dee2e6;
    font-size: 0.95rem;
  }

  .options-help {
    font-size: 0.85rem;
    color: #6c757d;
  }

  .add-question-button {
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: #28a745;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }

  .add-question-button:hover {
    background-color: #218838;
  }
`}</style>

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
                      <label htmlFor={`question-options-${index}`}>Options:</label>
                      <textarea
                        id={`question-options-${index}`}
                        value={question.options || ''}
                        onChange={(e) => handleQuestionChange(index, 'options', e.target.value)}
                        placeholder="Enter options, one per line"
                        rows={3}
                      />
                      <small className="options-help">Enter each option on a new line</small>
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