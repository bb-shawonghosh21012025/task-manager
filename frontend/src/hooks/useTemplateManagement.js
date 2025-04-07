import React, { useState, useCallback, useEffect } from 'react';

export const useTemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  
  const fetchData = async () => {
    const response = await fetch("http://localhost:8080/state");
    const data = await response.json();

    
    data.forEach(item=>{
      item.nodes.forEach(node=>{
        node.data.input_format = JSON.stringify(node.data.input_format || {});

        if("header" in node.data){
          node.data.header = JSON.stringify(node.data.header || {});
        }

        if("eta" in node.data){
          node.data.eta = JSON.stringify(node.data.eta || {});
        }

        if("output_format" in node.data){
          node.data.output_format = JSON.stringify(node.data.output_format || {});
        }
      });
    });

    setTemplates(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateNewIds = useCallback((flowObject) => {
    const timestamp = Date.now();
    
    // Create a mapping of old node IDs to new nodes
    const nodeMapping = {};
    const newNodes = flowObject.nodes.map(node => {
      const newNode = {
        ...node,
        id: `${node.type}-${timestamp}-${Math.random()}`,
        data: {
          ...node.data,
          state_id: `state-${timestamp}-${Math.random()}`
        }
      };
      nodeMapping[node.id] = newNode;
      return newNode;
    });
  
    // Update edges using the node mapping
    const newEdges = flowObject.edges.map(edge => {
      return {
        ...edge,
        id: `edge-${timestamp}-${Math.random()}`,
        source: nodeMapping[edge.source].id,
        target: nodeMapping[edge.target].id
      };
    });
  
    return {
      ...flowObject,
      nodes: newNodes,
      edges: newEdges
    };
  }, []);

  const saveTemplate = useCallback(async (reactFlowInstance) => {
    if (!reactFlowInstance) {
      console.warn('ReactFlow instance not initialized');
      return null;
    }

    const flowState = reactFlowInstance.toObject();
    const nodes = flowState.nodes;
    const edges = flowState.edges;

    if (nodes.length === 0) {
      alert('Cannot save empty template');
      return null;
    }

    // Generate new IDs for the entire flow
    const updatedFlowState = generateNewIds(flowState);

    const template = {
      id: `template-${Date.now()}-${Math.random()}`,
      ...updatedFlowState,
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        createdAt: new Date().toISOString(),
      },
    };

    const response = await fetch("http://localhost:8080/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
      
      
    });
    if (response.ok) {
      alert('Template saved succesfully');
    }else{
      throw new Error('Failed to save template');
    }

    
    setTemplates(prev => [...prev, template]);
    return template;
  }, [generateNewIds]);

  const loadTemplate = useCallback((reactFlowInstance, template) => {
    if (!reactFlowInstance) return;

    // Generate new IDs when loading a template as well
    const updatedTemplate = generateNewIds(template);

    reactFlowInstance.setNodes(updatedTemplate.nodes);
    reactFlowInstance.setEdges(updatedTemplate.edges);

    if (updatedTemplate.viewport) {
      reactFlowInstance.setViewport(updatedTemplate.viewport);
    }
  }, [generateNewIds]);

  const deleteTemplate = useCallback(async (templateId) => {
    try {
      const response = await fetch(`http://localhost:8080/state/${templateId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      setTemplates(prev => prev.filter(template => template.id !== templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  }, []);

  return {
    templates,
    saveTemplate,
    loadTemplate,
    deleteTemplate
  };
};