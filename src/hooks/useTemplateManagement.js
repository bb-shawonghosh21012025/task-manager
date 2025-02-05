import React, { useState, useCallback } from 'react';

export const useTemplateManagement = () => {
  const [templates, setTemplates] = useState([]);

  const saveTemplate = useCallback((reactFlowInstance) => {
    if (!reactFlowInstance) {
      console.warn('ReactFlow instance not initialized');
      return null;
    }

    const nodes = reactFlowInstance.getNodes();
    const edges = reactFlowInstance.getEdges();

    if (nodes.length === 0) {
      alert('Cannot save empty template');
      return null;
    }

    const flowState = reactFlowInstance.toObject();
    const template = {
      id: Date.now().toString(),
      ...flowState,
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        createdAt: new Date().toISOString(),
      },
    };

    setTemplates(prev => [...prev, template]);
    return template;
  }, []);

  const loadTemplate = useCallback((reactFlowInstance, template) => {
    if (!reactFlowInstance) return;

    reactFlowInstance.setNodes(template.nodes);
    reactFlowInstance.setEdges(template.edges);

    if (template.viewport) {
      reactFlowInstance.setViewport(template.viewport);
    }
  }, []);

  const deleteTemplate = useCallback((templateId) => {
    setTemplates(prev => 
      prev.filter(template => template.id !== templateId)
    );
  }, []);

  return {
    templates,
    saveTemplate,
    loadTemplate,
    deleteTemplate
  };
};