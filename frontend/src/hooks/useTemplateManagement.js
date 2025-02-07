import React, { useState, useCallback, useEffect } from 'react';

export const useTemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  
  const fetchData = async()=>{
    const response = await fetch("http://localhost:8080/state");
    
    const data = await response.json();
    // console.log(data);
    // data.forEach(el=>{console.log(el)});
    setTemplates(data);
  };

  useEffect(()=>{
    fetchData();
  },[]);



  const saveTemplate = useCallback(async (reactFlowInstance) => {
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

    // console.log(template);

    const response = await fetch("http://localhost:8080/state",{
      method:"POST",
      headers:{ "Content-Type": "application/json"},
      body: JSON.stringify(template),
      }
    );

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