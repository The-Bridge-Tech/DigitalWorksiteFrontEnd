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
          <p style={{ color: '#666', margin: 0 }}>Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login message
  if (!isAuthenticated) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '60px 40px',
        textAlign: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef',
        maxWidth: '400px',
        margin: '50px auto'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#495057' }}>Authentication Required</h3>
        <p style={{ margin: '0 0 24px 0', color: '#6c757d' }}>Please sign in to access this feature.</p>
        <button 
          onClick={() => redirectToAuth()}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          🔑 Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600' }}>
          📋 {isEditing ? 'Edit Template' : 'Create New Inspection Template'}
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>
          {isEditing ? 'Update template questions and settings' : 'Design a new inspection template with custom questions'}
        </p>
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
      
      {/* Success Message */}
      {pdfGenerated && (
        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '15px 20px',
          borderRadius: '8px',
          border: '1px solid #c3e6cb',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span><strong>Success:</strong> PDF generated and uploaded successfully</span>
          <button 
            onClick={() => setPdfGenerated(false)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#155724',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Form Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef',
        marginBottom: '20px'
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Template Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter template name"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
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

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Category:</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="">-- Select a Category --</option>
              <option value="Safety Inspections">Safety Inspections</option>
              <option value="Quality Inspections">Quality Inspections</option>
              <option value="Compliance Inspections">Compliance Inspections</option>
              <option value="Progress Inspections">Progress Inspections</option>
              <option value="Specialised Inspections">Specialised Inspections</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter template description"
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6f42c1'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>

          {!isEditing && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Save Location:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleFolderSelect}
                  style={{
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#5a32a3'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#6f42c1'}
                >
                  📁 Select Folder
                </button>
                {selectedFolder && (
                  <div style={{
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #bbdefb',
                    fontSize: '14px'
                  }}>
                    Folder: <code style={{ backgroundColor: 'rgba(255,255,255,0.7)', padding: '2px 4px', borderRadius: '3px' }}>{selectedFolder}</code>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '16px', color: '#495057', fontWeight: '600', fontSize: '18px' }}>Questions:</label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formData.questions.map((question, index) => (
                <div key={index} style={{
                  backgroundColor: '#f8f9fa',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'border-color 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ color: '#6f42c1', fontWeight: '600', fontSize: '16px' }}>❓ Question {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      disabled={formData.questions.length <= 1}
                      style={{
                        backgroundColor: formData.questions.length <= 1 ? '#ccc' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: formData.questions.length <= 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      🗑️ Remove
                    </button>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#495057', fontWeight: '500' }}>Question:</label>
                    <input
                      type="text"
                      value={question.question}
                      onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                      placeholder="Enter question"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '150px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', color: '#495057', fontWeight: '500' }}>Type:</label>
                      <select
                        value={question.type}
                        onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          fontSize: '14px',
                          backgroundColor: 'white',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="select">Select</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="radio">Radio</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#495057', fontWeight: '500', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => handleQuestionChange(index, 'required', e.target.checked)}
                          style={{ marginRight: '4px' }}
                        />
                        Required
                      </label>
                    </div>
                  </div>

                  {['select', 'radio', 'checkbox'].includes(question.type) && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '500' }}>Options:</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(question.options || ['']).map((option, optIndex) => (
                          <div key={optIndex} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(question.options || [''])];
                                newOptions[optIndex] = e.target.value;
                                handleQuestionChange(index, 'options', newOptions);
                              }}
                              placeholder={`Option ${optIndex + 1}`}
                              style={{
                                flex: 1,
                                padding: '8px 10px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = (question.options || ['']).filter((_, i) => i !== optIndex);
                                handleQuestionChange(index, 'options', newOptions.length > 0 ? newOptions : ['']);
                              }}
                              disabled={(question.options || ['']).length <= 1}
                              style={{
                                backgroundColor: (question.options || ['']).length <= 1 ? '#ccc' : '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: (question.options || ['']).length <= 1 ? 'not-allowed' : 'pointer'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = [...(question.options || ['']), ''];
                            handleQuestionChange(index, 'options', newOptions);
                          }}
                          style={{
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            alignSelf: 'flex-start'
                          }}
                        >
                          ➕ Add Option
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addQuestion}
                style={{
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: '2px dashed rgba(111, 66, 193, 0.3)',
                  padding: '16px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  alignSelf: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#5a32a3';
                  e.target.style.borderColor = '#5a32a3';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#6f42c1';
                  e.target.style.borderColor = 'rgba(111, 66, 193, 0.3)';
                }}
              >
                ➕ Add Question
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isSaving || isLoading}
              style={{
                backgroundColor: 'transparent',
                color: '#6c757d',
                border: '2px solid #6c757d',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: (isSaving || isLoading) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!(isSaving || isLoading)) {
                  e.target.style.backgroundColor = '#6c757d';
                  e.target.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!(isSaving || isLoading)) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6c757d';
                }
              }}
            >
              {isEditing ? 'Cancel' : 'Discard'}
            </button>
            
            <button
              type="button"
              onClick={generatePDF}
              disabled={isSaving || isLoading || !formData.name.trim()}
              style={{
                backgroundColor: (isSaving || isLoading || !formData.name.trim()) ? '#ccc' : '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: (isSaving || isLoading || !formData.name.trim()) ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => !(isSaving || isLoading || !formData.name.trim()) && (e.target.style.backgroundColor = '#138496')}
              onMouseLeave={(e) => !(isSaving || isLoading || !formData.name.trim()) && (e.target.style.backgroundColor = '#17a2b8')}
            >
              📄 Generate PDF
            </button>

            <button
              type="submit"
              disabled={isSaving || isLoading}
              style={{
                backgroundColor: (isSaving || isLoading) ? '#ccc' : '#6f42c1',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: (isSaving || isLoading) ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => !(isSaving || isLoading) && (e.target.style.backgroundColor = '#5a32a3')}
              onMouseLeave={(e) => !(isSaving || isLoading) && (e.target.style.backgroundColor = '#6f42c1')}
            >
              {isSaving ? '⏳ Saving...' : (isEditing ? '✏️ Update Template' : '💾 Save Template')}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TemplateForm;