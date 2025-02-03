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

// Main Sidebar for importing tasks
export const Sidebar = ({ onTasksImported, onSaveTaskTemplate }) => {
  const [error, setError] = useState(null);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const parseCsv = (content) => {
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',');
        const task = {};
        headers.forEach((header, index) => {
          task[header] = values[index];
        });
        return task;
      });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const tasks = parseCsv(e.target.result);
        
        // Create nodes and edges
        const nodes = tasks.map((task, index) => ({
          id: task.slug,
          type: 'task',
          position: { x: 100 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 150 },
          data: { 
            label: task.name || task.slug,
            ...task
          }
        }));

        const edges = tasks
          .filter(task => task.dependent_task_slug)
          .map(task => ({
            id: `${task.dependent_task_slug}-${task.slug}`,
            source: task.dependent_task_slug,
            target: task.slug,
            type: 'smoothstep'
          }));

        onTasksImported({ nodes, edges });
        
        // Auto-save as template
        const template = {
          id: Date.now().toString(),
          nodes,
          edges,
          timestamp: new Date().toISOString()
        };
        onSaveTaskTemplate(template);
        
        setError(null);
      } catch (error) {
        setError('Error parsing CSV file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={sharedStyles.container}>
      <h2>Nodes</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div
          style={{
            padding: '10px',
            border: '2px solid #1a73e8',
            borderRadius: '4px',
            cursor: 'move',
            textAlign: 'center'
          }}
          onDragStart={(e) => onDragStart(e, 'process')}
          draggable
        >
          Process
        </div>
        <div
          style={{
            padding: '10px',
            border: '2px solid #4caf50',
            borderRadius: '4px',
            cursor: 'move',
            textAlign: 'center'
          }}
          onDragStart={(e) => onDragStart(e, 'task')}
          draggable
        >
          Task
        </div>
      </div>

      <button 
        style={sharedStyles.button}
        onClick={() => document.getElementById('csvInput').click()}
      >
        Import Tasks from CSV
      </button>
      
      <input
        id="csvInput"
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>
      )}
    </div>
  );
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
    if (existingNodes.length > 0) {
      event.preventDefault();
      return;
    }

    let transferData = {
      type,
      nodes: type === 'flow' ? template.nodes : [template],
      edges: type === 'flow' ? template.edges : []
    };

    event.dataTransfer.setData('application/reactflow-template', JSON.stringify(transferData));
    onLoadTemplate(transferData);
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