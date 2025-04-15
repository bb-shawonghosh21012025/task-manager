import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Dialog, DialogContent, DialogTitle, DialogActions } from '@mui/material';

const ProcessForm = ({ node, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: node.data.name || '',
    process_slug: node.data.process_slug || '',
    process_description: node.data.process_description || '',
    input_format: typeof node.data.input_format === 'string' ? node.data.input_format : JSON.stringify(node.data.input_format || {}, null, 2),
    header: typeof node.data.header === 'string' ? node.data.header : JSON.stringify(node.data.header || {}, null, 2),
    email_id: node.data.email_id || '',
    owner_group_ids: node.data.owner_group_ids || '',
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
      type: 'process'
    });
  };

  return (
    <Dialog 
      open={true} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
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
          />
          <TextField 
            id="slug" 
            label="Enter Process Slug" 
            value={formData.process_slug}
            variant="outlined"
            margin="normal"
            onChange={(e) => setFormData({ ...formData, process_slug: e.target.value })}
            fullWidth
            required
          />
          <TextField
            multiline
            id="description" 
            label="Enter Process Description"
            value={formData.process_description}
            variant="outlined"
            margin="normal"
            onChange={(e) => setFormData({ ...formData, process_description: e.target.value })}
            minRows={5}
            maxRows={20}
            fullWidth
          />
          <TextField
            multiline 
            id="input_format"
            label="Enter Process Template Input Format"  
            value={formData.input_format}
            variant="outlined"
            margin="normal" 
            onChange={(e) => handleJsonChange(e, 'input_format')}
            minRows={20}
            maxRows={40}
            fullWidth
            error={!!jsonErrors.input_format}
            helperText={jsonErrors.input_format || ''}
          />
          <TextField
            multiline 
            id="process_headers"
            label="Enter Process Headers"  
            value={formData.header}
            variant="outlined"
            margin="normal"
            onChange={(e) => handleJsonChange(e, 'header')}
            minRows={20}
            maxRows={40}
            fullWidth
            error={!!jsonErrors.header}
            helperText={jsonErrors.header || ''}
          />
          <TextField
            id="email_list"
            label="Enter Email List"
            value={formData.email_id}
            variant="outlined"
            margin="normal"
            onChange={(e) => setFormData({ ...formData, email_id: e.target.value })}
            fullWidth
            required
          />
          <TextField
            id="owner_group_id"
            label="Enter Owner Group Ids"
            value={formData.owner_group_ids}
            variant="outlined"
            margin="normal"
            onChange={(e) => setFormData({ ...formData, owner_group_ids: e.target.value })}
            fullWidth
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
          sx={{ bgcolor: '#500472'}}
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