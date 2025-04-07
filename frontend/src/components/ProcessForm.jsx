import React, { useState } from 'react';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    padding: '24px',
    borderRadius: '8px',
    width: '600px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontWeight: '500',
    color: '#666',
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  jsonEditor: {
    width: '100%',
    height: '150px',
    fontFamily: 'monospace',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  error: {
    color: 'red',
    fontSize: '12px',
    marginTop: '4px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    cursor: 'pointer',
    fontSize: '14px',
  },
  primaryButton: {
    background: '#1a73e8',
    color: 'white',
  },
  secondaryButton: {
    background: '#f5f5f5',
    color: '#333',
  },
};

const ProcessForm = ({ node, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: node.data.name || '',
    process_slug: node.data.process_slug || '',
    input_format: typeof node.data.input_format === 'string' ? node.data.input_format : JSON.stringify(node.data.input_format || {}, null, 2),
    header: typeof node.data.header === 'string' ? node.data.header : JSON.stringify(node.data.header || {}, null, 2),
    email_id: node.data.email_id || '',
  });

  const [jsonErrors, setJsonErrors] = useState({
    input_format: false,
    header: false,
  });

  const validateJson = (value, field) => {
    try {
      JSON.parse(value);
      setJsonErrors(prev => ({ ...prev, [field]: false }));
      return true;
    } catch (e) {
      setJsonErrors(prev => ({ ...prev, [field]: 'Invalid JSON format' }));
      return false;
    }
  };

  const handleJsonChange = (e, field) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    validateJson(value, field);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate JSON fields
    const isInputFormatValid = validateJson(formData.input_format, 'input_format');
    const isHeaderValid = validateJson(formData.header, 'header');

    if (!isInputFormatValid || !isHeaderValid) {
      return;
    }

    onSave({
      ...node.data,
      ...formData,
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Edit Process</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Process Slug</label>
            <input
              type="text"
              value={formData.process_slug}
              onChange={(e) => setFormData({ ...formData, process_slug: e.target.value })}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Input Format (JSON)</label>
            <textarea
              value={formData.input_format}
              onChange={(e) => handleJsonChange(e, 'input_format')}
              style={styles.jsonEditor}
            />
            {jsonErrors.input_format && (
              <div style={styles.error}>{jsonErrors.input_format}</div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Header (JSON)</label>
            <textarea
              value={formData.header}
              onChange={(e) => handleJsonChange(e, 'header')}
              style={styles.jsonEditor}
            />
            {jsonErrors.header && (
              <div style={styles.error}>{jsonErrors.header}</div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email ID</label>
            <input
              type="email"
              value={formData.email_id}
              onChange={(e) => setFormData({ ...formData, email_id: e.target.value })}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessForm;