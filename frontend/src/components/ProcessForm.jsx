import React, { useState } from 'react';
import { TextField, Button, Box, Dialog, DialogContent, DialogTitle, DialogActions } from '@mui/material';

const ProcessForm = ({ node, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: node.data.name || '',
    slug: node.data.slug || '',
    description: node.data.description || '',
    input_format: typeof node.data.input_format === 'string' ? node.data.input_format : JSON.stringify(node.data.input_format || {}, null, 2),
    header: typeof node.data.header === 'string' ? node.data.header : JSON.stringify(node.data.header || {}, null, 2),
    email_list: node.data.email_list || '',
    owner_group_ids: node.data.owner_group_ids || '',
  });

  const [errors, setErrors] = useState({
    name: false,
    slug: false,
    description: false,
    input_format: false,
    header: false,
    email_list: false,
    owner_group_ids: false,
  });

  const validateJson = (value, field) => {
    try {
      JSON.parse(value);
      setErrors((prev) => ({ ...prev, [field]: false }));
      return true;
    } catch (e) {
      setErrors((prev) => ({ ...prev, [field]: 'Invalid JSON format' }));
      return false;
    }
  };

  const handleValidation = () => {
    const newErrors = {
      name: !formData.name.trim() ? 'Name is required' : false,
      slug: !formData.slug.trim() ? 'Slug is required' : false,
      description: !formData.description.trim() ? 'Description is required' : false,
      input_format: !formData.input_format.trim() ? 'Input format is required' : !validateJson(formData.input_format, 'input_format'),
      header: !formData.header.trim() ? 'Header is required' : !validateJson(formData.header, 'header'),
      email_list: !formData.email_list.trim() ? 'Email list is required' : false,
      owner_group_ids: !formData.owner_group_ids.trim() ? 'Owner group IDs are required' : false,
    };

    setErrors(newErrors);

    // Return true if no errors
    return Object.values(newErrors).every((error) => !error);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!handleValidation()) {
      return;
    }

    onSave({
      ...node.data,
      ...formData,
      type: 'process',
    });
  };

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle variant="h5">Edit Process</DialogTitle>
      <DialogContent className="custom-form">
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            id="name"
            label="Enter Process Name"
            value={formData.name}
            variant="outlined"
            margin="normal"
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
            error={!!errors.name}
            helperText={errors.name || ''}
          />
          <TextField
            id="slug"
            label="Enter Process Slug"
            value={formData.slug}
            variant="outlined"
            margin="normal"
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            fullWidth
            required
            error={!!errors.slug}
            helperText={errors.slug || ''}
          />
          <TextField
            multiline
            id="description"
            label="Enter Process Description"
            value={formData.description}
            variant="outlined"
            margin="normal"
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            minRows={5}
            maxRows={20}
            fullWidth
            required
            error={!!errors.description}
            helperText={errors.description || ''}
          />
          <TextField
            multiline
            id="input_format"
            label="Enter Process Template Input Format"
            value={formData.input_format}
            variant="outlined"
            margin="normal"
            onChange={(e) => setFormData({ ...formData, input_format: e.target.value })}
            minRows={5}
            maxRows={20}
            fullWidth
            required
            error={!!errors.input_format}
            helperText={errors.input_format || ''}
          />
          <TextField
            multiline
            id="process_headers"
            label="Enter Process Headers"
            value={formData.header}
            variant="outlined"
            margin="normal"
            onChange={(e) => setFormData({ ...formData, header: e.target.value })}
            minRows={5}
            maxRows={20}
            fullWidth
            required
            error={!!errors.header}
            helperText={errors.header || ''}
          />
          <TextField
            id="email_list"
            label="Enter Email List"
            value={formData.email_list}
            variant="outlined"
            margin="normal"
            onChange={(e) => setFormData({ ...formData, email_list: e.target.value })}
            fullWidth
            required
            error={!!errors.email_list}
            helperText={errors.email_list || ''}
          />
          <TextField
            id="owner_group_id"
            label="Enter Owner Group Ids"
            value={formData.owner_group_ids}
            variant="outlined"
            margin="normal"
            onChange={(e) => setFormData({ ...formData, owner_group_ids: e.target.value })}
            fullWidth
            required
            error={!!errors.owner_group_ids}
            helperText={errors.owner_group_ids || ''}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          sx={{ color: '#500472', borderColor: '#500472' }}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          sx={{ bgcolor: '#500472' }}
          variant="contained"
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProcessForm;