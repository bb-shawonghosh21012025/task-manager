import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

// Styles shared between both sidebars
const sharedStyles = {
  container: {
    padding: '20px',
    height: '100%',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  button: {
    padding: '10px',
    backgroundColor: 'white',
    border: '2px solid #4caf50',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    marginTop: '10px',
    width: '100%'
  }
};


// Templates Sidebar with additional task template handling
export const TemplatesSidebar = ({ 
  templates, 
  taskTemplates, 
  onDeleteTemplate, 
  onDeleteTaskTemplate,
  existingNodes,
  onLoadTemplate 
}) => {
  const handleDragStart = (event, template, type) => {
    // if (existingNodes.length > 0) {
    //   event.preventDefault();
    //   return;
    // }

    event.dataTransfer.setData("application/reactflow",type);
    
    if(type === 'task'){
    console.log(template);

    // let transferData = {
    //   type,
    //   nodes: type === 'flow' ? template.nodes : [template],
    //   edges: type === 'flow' ? template.edges : []
    // };
    
    // console.log(transferData);

    event.dataTransfer.setData('application/reactflow-template', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
    }else if(type === "flow"){
      let transferData = {
      type,
      nodes: type === 'flow' ? template.nodes : [template],
      edges: type === 'flow' ? template.edges : []
     };

     event.dataTransfer.setData('application/reactflow-template', JSON.stringify(template));
     event.dataTransfer.effectAllowed = 'move';
     onLoadTemplate(transferData);
    }
  };

  return (
    <div style={sharedStyles.container}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
          Saved Flow Templates
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: existingNodes.length > 0 ? 'not-allowed' : 'grab',
                opacity: existingNodes.length > 0 ? 0.5 : 1,
                position: 'relative'
              }}
              draggable={existingNodes.length === 0}
              onDragStart={(e) => handleDragStart(e, template, 'flow')}
            >
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                Flow Template {template.id}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {new Date(template.timestamp).toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {template.nodes.length} nodes, {template.edges.length} connections
              </div>
              <button
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ff4444'
                }}
                onClick={() => onDeleteTemplate(template.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
          Saved Task Templates
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {taskTemplates?.map((task) => (
            <div
              key={task.id}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'grab',
                position: 'relative'
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, task, 'task')}
            >
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                {task.data.label}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {new Date(task.timestamp).toLocaleString()}
              </div>
              <button
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ff4444'
                }}
                onClick={() => onDeleteTaskTemplate(task.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};