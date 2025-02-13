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
    padding: '20px',
    borderRadius: '8px',
    width: '800px',
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
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
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
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    fontFamily:'Ubuntu',
    borderRadius: '4px',
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
  error: {
    color: 'red',
    fontSize: '12px',
    marginTop: '4px',
  }
};

const TaskForm = ({ node, onClose, onSave, onSaveTemplate}) => {
  const [formData, setFormData] = useState({
    name: node.data.name || '',
    slug: node.data.slug || '',
    description: node.data.description || '',
    help_text: node.data.help_text || '',
    input_format: JSON.stringify(node.data.input_format) ? "" + JSON.stringify(node.data.input_format) + "" : '{}',
    output_format: JSON.stringify(node.data.output_format) ? "" + JSON.stringify(node.data.output_format) + "" : '{}',
    dependent_task_slug: node.data.dependent_task_slug || '',
    repeats_on: node.data.repeats_on,
    bulk_input: node.data.bulk_input || false,
    input_http_method: node.data.input_http_method,
    api_endpoint: node.data.api_endpoint || '',
    api_timeout_in_ms: node.data.api_timeout_in_ms || 30000,
    response_type: node.data.response_type ,
    is_json_input_needed: node.data.is_json_input_needed || false,
    task_type: node.data.task_type,
    is_active: node.data.is_active || true,
    is_optional: node.data.is_optional || false,
    eta: JSON.stringify(node.data.eta) ? "" + JSON.stringify(node.data.eta) + "" : '{}',
    service_id: node.data.service_id || '',
    email_list: node.data.email_list || '',
    action: node.data.action || '',
  });

  const [jsonErrors, setJsonErrors] = useState({
    input_format: false,
    output_format: false,
    eta: false,
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
    
    // Validate all JSON fields
    const isInputFormatValid = validateJson(formData.input_format, 'input_format');
    const isOutputFormatValid = validateJson(formData.output_format, 'output_format');
    const isEtaValid = validateJson(formData.eta, 'eta');

    formData.input_format =  JSON.parse(formData.input_format);
    // formData.output_format = "" +JSON.parse(formData.output_format) +"";
    // formData.eta = "" + JSON.parse(formData.eta) +"";
    console.log(formData.input_format);

    if (!isInputFormatValid || !isOutputFormatValid || !isEtaValid) {
      return;
    }

    onSave(formData);
    onClose();
  };
  
  const handleSaveTemplate = () => {
    // console.log(node)
    // Create a template object from the current form data
    const template = {
      id: `${"task"}-${Date.now()}-${Math.random()}`,
      type: 'task',
      timestamp: new Date().toISOString(),
      data: { 
        ...formData,
        label: formData.name || node.data.label // Ensure we have a label for display
      }
    };
    onSaveTemplate(template);
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>
          Edit {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.form}>
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
              <label style={styles.label}>Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={styles.input}
                rows="3"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Help Text</label>
              <textarea
                value={formData.help_text}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                style={styles.input}
                rows="3"
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
              <label style={styles.label}>Output Format (JSON)</label>
              <textarea
                value={formData.output_format}
                onChange={(e) => handleJsonChange(e, 'output_format')}
                style={styles.jsonEditor}
              />
              {jsonErrors.output_format && (
                <div style={styles.error}>{jsonErrors.output_format}</div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Dependent Task Slug</label>
              <input
                type="text"
                value={formData.dependent_task_slug}
                onChange={(e) => setFormData({ ...formData, dependent_task_slug: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Repeats On</label>
              <input
                type="number"
                value={formData.repeats_on}
                onChange={(e) => setFormData({ ...formData, repeats_on: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={formData.bulk_input}
                  onChange={(e) => setFormData({ ...formData, bulk_input: e.target.checked })}
                /> Bulk Input
              </label>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>HTTP Method</label>
              <input
                type="number"
                value={formData.input_http_method}
                onChange={(e) => setFormData({ ...formData, input_http_method: e.target.value })}
                style={styles.input}
              />
                {/* <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select> */}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>API Endpoint</label>
              <input
                type="text"
                value={formData.api_endpoint}
                onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>API Timeout (ms)</label>
              <input
                type="number"
                value={formData.api_timeout_in_ms}
                onChange={(e) => setFormData({ ...formData, api_timeout_in_ms: parseInt(e.target.value) })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Response Type</label>
              <input
                type='number'
                value={formData.response_type}
                onChange={(e) => setFormData({ ...formData, response_type: e.target.value })}
                style={styles.input}
              />
                {/* <option value="JSON">JSON</option>
                <option value="XML">XML</option>
                <option value="TEXT">TEXT</option>
              </select> */}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={formData.is_json_input_needed}
                  onChange={(e) => setFormData({ ...formData, is_json_input_needed: e.target.checked })}
                /> JSON Input Needed
              </label>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Task Type</label>
              <input
                type='number'
                value={formData.task_type}
                onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                style={styles.input}
              />
                {/* <option value="API">API</option>
                <option value="FUNCTION">FUNCTION</option>
                <option value="SCRIPT">SCRIPT</option>
              </select> */}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                /> Active
              </label>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={formData.is_optional}
                  onChange={(e) => setFormData({ ...formData, is_optional: e.target.checked })}
                /> Optional
              </label>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>ETA (JSON)</label>
              <textarea
                value={formData.eta}
                onChange={(e) => handleJsonChange(e, 'eta')}
                style={styles.jsonEditor}
              />
              {jsonErrors.eta && (
                <div style={styles.error}>{jsonErrors.eta}</div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Service ID</label>
              <input
                type="text"
                value={formData.service_id}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email List</label>
              <input
                type="text"
                value={formData.email_list}
                onChange={(e) => setFormData({ ...formData, email_list: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Action</label>
              <input
                type="text"
                value={formData.action}
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Cancel
            </button>
            <div>
              <button
                type="button"
                onClick={handleSaveTemplate}
                style={{ 
                  ...styles.button, 
                  ...styles.primaryButton,
                  marginRight: '10px',
                  background: '#34a853' 
                }}
              >
                Save as Template
              </button>
              <button
                type="submit"
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;