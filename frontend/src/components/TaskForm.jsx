import React, { useState } from 'react';
import axios from 'axios';
import {
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Box,
  Dialog, DialogContent, DialogTitle, DialogActions,
  Grid
} from '@mui/material';

import { ErrorModal } from '../hooks/ErrorModal';

const TaskForm = ({ node, onClose, onSave, onSaveTemplate, onDeleteTemplate }) => {
  // Check if this node came from a template
  const isFromTemplate = node.isFromTemplate;
  const templateId = node.data.templateId;
  const nodeType = node.type; // Get the node type to apply correct validation

  const [formData, setFormData] = useState({
    name: node.data.name || '',
    slug: node.data.slug || '',
    description: node.data.description || '',
    help_text: node.data.help_text || '',
    input_format: typeof node.data.input_format === 'string' ? node.data.input_format : JSON.stringify(node.data.input_format || {}, null, 2),
    output_format: typeof node.data.output_format === 'string' ? node.data.output_format : JSON.stringify(node.data.output_format || {}, null, 2),
    dependent_task_slug: node.data.dependent_task_slug || '',
    repeats_on: node.data.repeats_on || '',
    bulk_input: node.data.bulk_input || '',
    input_http_method: node.data.input_http_method || '',
    api_endpoint: node.data.api_endpoint || '',
    api_timeout_in_ms: node.data.api_timeout_in_ms || 30000,
    response_type: node.data.response_type || '',
    is_json_input_needed: node.data.is_json_input_needed || false,
    task_type: node.data.task_type || '',
    is_active: node.data.is_active || true,
    is_optional: node.data.is_optional || false,
    eta: typeof node.data.eta === 'string' ? node.data.eta : JSON.stringify(node.data.eta || {}, null),
    service_id: node.data.service_id || '',
    email_list: node.data.email_list || '',
    action: node.data.action || '',
    host: node.data.host || '',
    delay_in_ms: node.data.delay_in_ms || '',
  });

  // Track field validation errors
  const [validationErrors, setValidationErrors] = useState({});
  
  const [jsonErrors, setJsonErrors] = useState({
    input_format: false,
    output_format: false,
    eta: false,
  });

  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const showError = (message) => {
    console.log("Showing error:", message);
    setError(message);
    setIsOpen(true);
    console.log("isOpen set to:", true);
  };

  const handleCloseErrorModal = () => {
    setError(null);
    setIsOpen(false);
  };

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

  // Validate required fields based on node type
  const validateRequiredFields = () => {
    const errors = {};
    
    // Common required fields for both 'task' and 'master'
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.slug.trim()) errors.slug = 'Slug is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.task_type) errors.task_type = 'Task type is required';
    if (!formData.eta.trim()) errors.eta = 'ETA is required';
    if (!formData.service_id) errors.service_id = 'Service ID is required';
    if (!formData.api_endpoint.trim()) errors.api_endpoint = 'API endpoint is required';
    if (!formData.api_timeout_in_ms) errors.api_timeout_in_ms = 'API timeout is required';
    
    // Fields only required for 'task' type
    if (nodeType === 'task') {
      if (!formData.input_http_method) errors.input_http_method = 'Input HTTP method is required';
      if (!formData.response_type) errors.response_type = 'Response type is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUseAsTask = () => {
    // Validate all JSON fields
    const jsonValid = validateJson(formData.input_format, 'input_format') &&
      validateJson(formData.output_format, 'output_format') &&
      validateJson(formData.eta, 'eta');
    
    if (!jsonValid) return;
    
    // Validate required fields
    if (!validateRequiredFields()) return;

    // Create task data with explicit node type
    const taskData = {
      ...formData,
      type: 'task',
      isFromTemplate: false,
      originalTemplateId: templateId,
      label: formData.name || node.data.label
    };

    onSave(taskData);
    onClose();
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

    if (!isInputFormatValid || !isOutputFormatValid || !isEtaValid) {
      return;
    }
    
    // Validate required fields
    if (!validateRequiredFields()) return;
    
    const data = { ...formData, type: 'task' };
    onSave(data);
    onClose();
  };

  const handleSaveTemplate = async () => {
    // Validate all JSON fields
    const isInputFormatValid = validateJson(formData.input_format, 'input_format');
    const isOutputFormatValid = validateJson(formData.output_format, 'output_format');
    const isEtaValid = validateJson(formData.eta, 'eta');

    if (!isInputFormatValid || !isOutputFormatValid || !isEtaValid) {
      return;
    }
    
    // Validate required fields
    if (!validateRequiredFields()) return;

    const requestBody = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      help_text: formData.help_text,
      input_format: typeof formData.input_format === 'string' ? JSON.parse(formData.input_format) : formData.input_format,
      output_format: typeof formData.output_format === 'string' ? JSON.parse(formData.output_format) : formData.output_format,
      dependent_task_slug: Array.isArray(formData.dependent_task_slug) ? formData.dependent_task_slug : [formData.dependent_task_slug],
      host: formData.host || "",
      bulk_input: typeof formData.bulk_input === 'boolean' ? formData.bulk_input : false,
      input_http_method: parseInt(formData.input_http_method, 10), // Convert to number
      api_endpoint: formData.api_endpoint,
      api_timeout_in_ms: parseInt(formData.api_timeout_in_ms, 10), // Convert to number
      responseType: parseInt(formData.response_type, 10), // Convert to number
      is_json_input_needed: formData.is_json_input_needed,
      task_type: parseInt(formData.task_type, 10), // Convert to number
      is_active: formData.is_active,
      is_optional: formData.is_optional,
      eta: typeof formData.eta === 'string' ? JSON.parse(formData.eta) : formData.eta,
      service_id: parseInt(formData.service_id, 10), // Convert to number
      email_list: formData.email_list,
    };

    try {
      const response = await axios.post('http://localhost:8011/bb2admin/v2/master-task-templates', requestBody, {
        headers: { 'bb-decoded-uid': localStorage.getItem("bb-decoded-uid") }
      });
      alert("Template Created Successfully");
      console.log('Template saved successfully:', response);
    } catch (error) {
      console.error('Error saving template:', error);
      showError(error.response?.data?.slug?.message || 'An unexpected error occurred.');
    }

    onClose();
  };

  // Add handler for deleting template
  const handleDeleteTemplate = () => {
    if (templateId) {
      onDeleteTemplate(templateId);
      onClose();
    }
  };

  // Add handler for updating template
  const handleUpdateTemplate = async () => {
    // Validate all JSON fields first
    const isInputFormatValid = validateJson(formData.input_format, 'input_format');
    const isOutputFormatValid = validateJson(formData.output_format, 'output_format');
    const isEtaValid = validateJson(formData.eta, 'eta');

    if (!isInputFormatValid || !isOutputFormatValid || !isEtaValid) {
      return;
    }
    
    // Validate required fields
    if (!validateRequiredFields()) return;

    const requestBody = {
      name: formData.name,
      // slug: formData.slug,
      description: formData.description,
      help_text: formData.help_text,
      input_format: typeof formData.input_format === 'string' ? JSON.parse(formData.input_format) : formData.input_format,
      output_format: typeof formData.output_format === 'string' ? JSON.parse(formData.output_format) : formData.output_format,
      // dependent_task_slug: Array.isArray(formData.dependent_task_slug) ? formData.dependent_task_slug : [formData.dependent_task_slug],
      host: formData.host || "",
      // bulk_input: typeof formData.bulk_input === 'boolean' ? formData.bulk_input : false,
      input_http_method: parseInt(formData.input_http_method, 10), // Convert to number
      api_endpoint: formData.api_endpoint,
      api_timeout_in_ms: parseInt(formData.api_timeout_in_ms, 10), // Convert to number
      responseType: parseInt(formData.response_type, 10), // Convert to number
      is_json_input_needed: formData.is_json_input_needed,
      task_type: parseInt(formData.task_type, 10), // Convert to number
      is_active: formData.is_active,
      is_optional: formData.is_optional,
      eta: typeof formData.eta === 'string' ? JSON.parse(formData.eta) : formData.eta,
      service_id: parseInt(formData.service_id, 10), // Convert to number
      email_list: formData.email_list,
    };

    try {
      const response = await axios.put(`http://localhost:8011/bb2admin/v2/master-task-templates/${node.data.id}`, requestBody, {
        headers: { 'bb-decoded-uid': localStorage.getItem("bb-decoded-uid") }
      });
      alert("Template Updated Successfully");
      console.log('Template saved successfully:', response);
    } catch (error) {
      console.error('Error saving template:', error);
      showError(error.response?.data?.message || 'An unexpected error occurred.');
    }

    onClose();
  };

  // Handle field change with validation clearing
  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear validation error when field is edited
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: undefined });
    }
  };

  return (
    <Dialog
      open={true}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle variant="h5">
        {isFromTemplate ? "Edit " : "Edit "}
        {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
      </DialogTitle>

      <DialogContent className="custom-form">
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                id="name"
                label="Enter Task Name"
                value={formData.name}
                variant="outlined"
                fullWidth
                margin="normal"
                required
                error={!!validationErrors.name}
                helperText={validationErrors.name || ""}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="slug"
                label="Enter Task Slug"
                value={formData.slug}
                variant="outlined"
                fullWidth
                margin="normal"
                required
                error={!!validationErrors.slug}
                helperText={validationErrors.slug || ""}
                onChange={(e) => handleFieldChange('slug', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="description"
                label="Enter Task Description"
                value={formData.description}
                variant="outlined"
                fullWidth
                margin="normal"
                multiline
                rows={3}
                required
                error={!!validationErrors.description}
                helperText={validationErrors.description || ""}
                onChange={(e) => handleFieldChange('description', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="help_text"
                label="Enter help text"
                value={formData.help_text}
                variant="outlined"
                fullWidth
                margin="normal"
                multiline
                rows={3}
                onChange={(e) => handleFieldChange('help_text', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="input_format"
                label="Enter task input format"
                value={formData.input_format}
                variant="outlined"
                fullWidth
                margin="normal"
                multiline
                rows={5}
                error={!!jsonErrors.input_format}
                helperText={jsonErrors.input_format || ""}
                onChange={(e) => handleJsonChange(e, 'input_format')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="output_format"
                label="Enter task output format"
                value={formData.output_format}
                variant="outlined"
                fullWidth
                margin="normal"
                multiline
                rows={5}
                error={!!jsonErrors.output_format}
                helperText={jsonErrors.output_format || ""}
                onChange={(e) => handleJsonChange(e, 'output_format')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="dependent_task_slug"
                label="Enter dependent task slug"
                value={formData.dependent_task_slug}
                variant="outlined"
                fullWidth
                margin="normal"
                onChange={(e) => handleFieldChange('dependent_task_slug', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="host"
                label="Enter host"
                value={formData.host}
                variant="outlined"
                fullWidth
                margin="normal"
                onChange={(e) => handleFieldChange('host', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="repeats_on"
                label="Repeats On"
                type="number"
                value={formData.repeats_on}
                variant="outlined"
                fullWidth
                margin="normal"
                onChange={(e) => handleFieldChange('repeats_on', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="bulk_input"
                label="Bulk Input"
                value={formData.bulk_input}
                variant="outlined"
                fullWidth
                margin="normal"
                onChange={(e) => handleFieldChange('bulk_input', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="input_http_method"
                label="Enter input http method"
                value={formData.input_http_method}
                variant="outlined"
                fullWidth
                margin="normal"
                required={nodeType === 'task'}
                error={!!validationErrors.input_http_method}
                helperText={validationErrors.input_http_method || ""}
                onChange={(e) => handleFieldChange('input_http_method', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="api_endpoint"
                label="Enter api endpoint"
                value={formData.api_endpoint}
                variant="outlined"
                fullWidth
                margin="normal"
                required
                error={!!validationErrors.api_endpoint}
                helperText={validationErrors.api_endpoint || ""}
                onChange={(e) => handleFieldChange('api_endpoint', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="api_timeout_in_ms"
                label="Enter api timeout in ms"
                type="number"
                value={formData.api_timeout_in_ms}
                variant="outlined"
                fullWidth
                margin="normal"
                required
                error={!!validationErrors.api_timeout_in_ms}
                helperText={validationErrors.api_timeout_in_ms || ""}
                onChange={(e) => handleFieldChange('api_timeout_in_ms', parseInt(e.target.value))}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="response_type"
                label="Enter response type"
                value={formData.response_type}
                variant="outlined"
                fullWidth
                margin="normal"
                required={nodeType === 'task'}
                error={!!validationErrors.response_type}
                helperText={validationErrors.response_type || ""}
                onChange={(e) => handleFieldChange('response_type', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_json_input_needed}
                    onChange={(e) => handleFieldChange('is_json_input_needed', e.target.checked)}
                  />
                }
                label="Is JSON input needed"
                sx={{ mt: 2 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="task_type"
                label="Enter task type"
                value={formData.task_type}
                variant="outlined"
                fullWidth
                margin="normal"
                required
                error={!!validationErrors.task_type}
                helperText={validationErrors.task_type || ""}
                onChange={(e) => handleFieldChange('task_type', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                  />
                }
                label="Is active"
                sx={{ mt: 2 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="is_optional"
                    checked={formData.is_optional}
                    onChange={(e) => handleFieldChange('is_optional', e.target.checked)}
                  />
                }
                label="Is optional"
                sx={{ mt: 2 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="eta"
                label="Enter ETA (JSON)"
                value={formData.eta}
                variant="outlined"
                fullWidth
                margin="normal"
                multiline
                rows={5}
                required
                error={!!jsonErrors.eta || !!validationErrors.eta}
                helperText={jsonErrors.eta || validationErrors.eta || ""}
                onChange={(e) => handleJsonChange(e, 'eta')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="service_id"
                label="Enter service ID"
                value={formData.service_id}
                variant="outlined"
                fullWidth
                margin="normal"
                required
                error={!!validationErrors.service_id}
                helperText={validationErrors.service_id || ""}
                onChange={(e) => handleFieldChange('service_id', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="email_list"
                label="Enter email list"
                value={formData.email_list}
                variant="outlined"
                fullWidth
                margin="normal"
                onChange={(e) => handleFieldChange('email_list', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="delay_in_ms"
                label="Delay (in ms)"
                value={formData.delay_in_ms}
                variant="outlined"
                fullWidth
                margin="normal"
                onChange={(e) => handleFieldChange('delay_in_ms', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="action"
                label="Enter action"
                value={formData.action}
                variant="outlined"
                fullWidth
                margin="normal"
                onChange={(e) => handleFieldChange('action', e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ color: '#500472', borderColor: '#500472' }}
        >
          Cancel
        </Button>

        {isFromTemplate && (
          <Button
            variant="contained"
            onClick={handleUseAsTask}
            sx={{ bgcolor: '#500472' }}
          >
            Use as Task
          </Button>
        )}

        {node.type === "task" ? (
          <Button
            type="submit"
            variant="contained"
            onClick={handleSubmit}
            sx={{ bgcolor: '#500472' }}
          >
            Save
          </Button>
        ) : (
          <>
            {isFromTemplate && (
              <>
                <Button
                  variant="contained"
                  onClick={handleDeleteTemplate}
                  sx={{ bgcolor: '#500472' }}
                >
                  Delete
                </Button>
                <Button
                  variant="contained"
                  onClick={handleUpdateTemplate}
                  sx={{ bgcolor: '#500472' }}
                >
                  Update
                </Button>
              </>
            )}

            {!isFromTemplate && (
              <Button
                variant="contained"
                onClick={handleSaveTemplate}
                sx={{ bgcolor: '#500472' }}
              >
                Submit
              </Button>
            )}
          </>
        )}
      </DialogActions>
      <ErrorModal
        isOpen={isOpen}
        title="Error"
        message={error}
        onClose={handleCloseErrorModal}
      />
    </Dialog>
  );
};

export default TaskForm;