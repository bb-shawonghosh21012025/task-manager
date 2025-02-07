import React, { useState, useEffect } from 'react';
import { Trash2, ChevronDown, ChartNoAxesColumn } from 'lucide-react';

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

export const TemplatesSidebar = ({ 
  templates, 
  taskTemplates, 
  onDeleteTemplate, 
  onDeleteTaskTemplate,
  existingNodes,
  onLoadTemplate 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // const [apiTaskTemplates, setApiTaskTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessDropdownOpen, setIsProcessDropdownOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchTaskTemplates();
  }, []);

  const fetchTaskTemplates = async () => {
    setIsLoading(true);
    try {
      // const response = await fetch('your-api-endpoint/task-templates');
      // const data = await response.json();
      // setApiTaskTemplates(data);
    } catch (error) {
      console.error('Error fetching task templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (event, template, type) => {
    event.dataTransfer.setData("application/reactflow", type);
    
    if(type === 'task') {
      event.dataTransfer.setData('application/reactflow-template', JSON.stringify(template));
      event.dataTransfer.effectAllowed = 'move';
    } else if(type === "flow") {
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

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsDropdownOpen(false);
    setIsProcessDropdownOpen(false);
  };

  // console.log(templates);

  return (
    <div style={sharedStyles.container}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>Saved Templates</h3>
        
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <button
            onClick={() => !isDragging && setIsProcessDropdownOpen(!isProcessDropdownOpen)}
            style={{
              width: '100%',
              padding: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'white',
              fontFamily: 'Ubuntu, sans-serif',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <span>Select Process Template</span>
            <ChevronDown size={16} />
          </button>
          
          {isProcessDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              {templates.map((template) => (
                <div
                  key={template.id}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #ddd',
                    cursor: 'grab',
                    position: 'relative',
                    background: 'white'
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, template, 'flow')}
                  onDragEnd={handleDragEnd}
                >
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>
                    {template.nodes.map((node)=>{
    if(node.id.includes("process")){
      return node.data.process_slug;
    }
  })||"unknown process"}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Created: {new Date(template.metadata.createdAt).toLocaleString()}
                    <br />
                    {template.metadata.nodeCount} nodes, {template.metadata.edgeCount} edges
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTemplate(template.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
          Task Templates
        </h2>
        
        {/* Combined Dropdown Container */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <button
            onClick={() => !isDragging && setIsDropdownOpen(!isDropdownOpen)}
            style={{
              width: '100%',
              padding: '10px',
              display: 'flex',
              fontFamily:'Ubuntu',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <span>Select Task Template</span>
            <ChevronDown size={16} />
          </button>
          
          {isDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Saved Templates Section */}
              {taskTemplates?.length > 0 && (
                <>
                  <div style={{ padding: '10px', background: '#f5f5f5', borderBottom: '1px solid #ddd', fontWeight: '500' }}>
                    Saved Templates
                  </div>
                  {taskTemplates.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        padding: '15px',
                        borderBottom: '1px solid #ddd',
                        cursor: 'grab',
                        position: 'relative',
                        background: 'white'
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task, 'task')}
                      onDragEnd={handleDragEnd}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTaskTemplate(task.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </>
              )}

              {/* API Templates Section */}
              {isLoading ? (
                <div style={{ padding: '10px', textAlign: 'center' }}>Loading...</div>
              ) : (
                <>
                  <div style={{ padding: '10px', background: '#f5f5f5', borderBottom: '1px solid #ddd', fontWeight: '500' }}>
                    Template Library
                  </div>
                  {taskTemplates.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        padding: '15px',
                        borderBottom: '1px solid #ddd',
                        cursor: 'grab',
                        background: 'white'
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
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatesSidebar;