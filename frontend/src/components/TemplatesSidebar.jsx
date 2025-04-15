import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Eye, EyeClosed } from 'lucide-react';
import axios from 'axios';

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
  // templates,
  taskTemplates,
  onDeleteTemplate,
  onDeleteTaskTemplate,
  existingNodes,
  onLoadTemplate
}) => {
   const [templates,setTemplates] = useState([]);
   const [masterTemplates,setMasterTemplates] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processSearchTerm, setProcessSearchTerm] = useState('');
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [childTasksPosition, setChildTasksPosition] = useState(null);
  
  // References for the search dropdowns
  const processTemplateRef = useRef(null);
  const taskTemplateRef = useRef(null);
  
  // Visibility state for the dropdowns
  const [processTemplateListDisplay, setProcessTemplateListDisplay] = useState("hidden");
  const [taskTemplateListDisplay, setTaskTemplateListDisplay] = useState("hidden");

  useEffect(() => {
    fetchProcessTemplateList();
    fetchMasterTaskTemplates();
  }, []);

  useEffect(() => {
    // Handle clicks outside the process template search dropdown
    document.addEventListener("click", (e) => {
      const checkProcess = processTemplateRef.current != null
        ? processTemplateRef.current.contains(e.target)
        : false;
      
      if (checkProcess) {
        setProcessTemplateListDisplay("visible");
      } else {
        setProcessTemplateListDisplay("hidden");
      }
    }, true);

    // Handle clicks outside the task template search dropdown
    document.addEventListener("click", (e) => {
      const checkTask = taskTemplateRef.current != null
        ? taskTemplateRef.current.contains(e.target)
        : false;
      
      if (checkTask) {
        setTaskTemplateListDisplay("visible");
      } else {
        setTaskTemplateListDisplay("hidden");
      }
    }, true);

    return () => {
      // Clean up event listeners
      document.removeEventListener("click", () => {});
    };
  }, []);

  const fetchProcessTemplateList = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:8011/bb2admin/v2/process-template-list',
        {
          headers: { 'bb-decoded-uid': localStorage.getItem("bb-decoded-uid") }
        }
      );
      setTemplates(response.data);
      console.log(response.data);
    } catch{
      setIsLoading(false);
    }
  };

  const fetchMasterTaskTemplates = async () => {
    try {
      const response = await axios.get('http://localhost:8011/bb2admin/v1/master-task-templates',
        {
          headers : { 'bb-decoded-uid': localStorage.getItem("bb-decoded-uid") }
        }
      );
      // console.log(response);
      setMasterTemplates(response.data.data);
    } catch (error) {
      console.log("error in fetchMasterTaskTemplate",error);
    }
  }
  
  const toggleTaskExpansion = (taskId, e) => {
    e.stopPropagation();
    
    // Get position of the clicked task item
    const rect = e.currentTarget.getBoundingClientRect();
    
    // If this task is already active, close it
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
      setChildTasksPosition(null);
      return;
    }
    
    // Calculate position for the child tasks dropdown
    setChildTasksPosition({
      top: rect.top,
      right: window.innerWidth - rect.left + 10
    });
    
    // Set this task as active
    setActiveTaskId(taskId);
  };

  const handleDragStart = (event, template, type) => {
    event.dataTransfer.setData("application/reactflow", type);

    if (type === 'task' || type === 'childTask') {
      event.dataTransfer.setData('application/reactflow-template', JSON.stringify(template));
      event.dataTransfer.effectAllowed = 'move';
    } else if (type === "flow") {
      let transferData = {
        type,
        template
      };
      event.dataTransfer.setData('application/reactflow-template', JSON.stringify(transferData));
      event.dataTransfer.effectAllowed = 'move';
      // onLoadTemplate(transferData);
    }else if(type === "master"){
      let transferData = {
        type,
        template,
        isFromTemplate : true
      };
      event.dataTransfer.setData('application/reactflow-template', JSON.stringify(transferData));
      event.dataTransfer.effectAllowed = 'move';
    }
    
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Close child tasks dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeTaskId && 
          !event.target.closest('.child-tasks-dropdown') && 
          !event.target.closest('.eye-button')) {
        setActiveTaskId(null);
        setChildTasksPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeTaskId]);

  const filteredProcessTemplates = templates.filter(template => {
    return template.slug?.toLowerCase().includes(processSearchTerm.toLowerCase()) || template.name?.toLowerCase().includes(processSearchTerm.toLowerCase());
  });

  const filteredMasterTemplates = masterTemplates.filter(task =>
    task.slug.toLowerCase().includes(taskSearchTerm.toLowerCase())
  );

  return (
    <div style={sharedStyles.container}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>Process Templates</h3>

        {/* Process Template Search - New UI */}
        <div className="search">
          <div className="searchInputs" style={{ position: 'relative' }}>
            <input
              ref={processTemplateRef}
              type="text"
              value={processSearchTerm}
              onChange={(e) => setProcessSearchTerm(e.target.value)}
              placeholder="Search Process Template"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <svg
              className="search-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 50 50"
              width="20px"
              height="20px"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666'
              }}
            >
              <path d="M 21 3 C 11.621094 3 4 10.621094 4 20 C 4 29.378906 11.621094 37 21 37 C 24.710938 37 28.140625 35.804688 30.9375 33.78125 L 44.09375 46.90625 L 46.90625 44.09375 L 33.90625 31.0625 C 36.460938 28.085938 38 24.222656 38 20 C 38 10.621094 30.378906 3 21 3 Z M 21 5 C 29.296875 5 36 11.703125 36 20 C 36 28.296875 29.296875 35 21 35 C 12.703125 35 6 28.296875 6 20 C 6 11.703125 12.703125 5 21 5 Z" />
            </svg>
            <div
              className="searchData"
              style={{
                visibility: processTemplateListDisplay,
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '0 0 4px 4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              {filteredProcessTemplates.map((template) => {
                const processSlug = template.slug || template.name ;
                  // node.id.includes("process"))?.data.process_slug || "unknown process";
                
                return (
                  <div
                    key={template.id}
                    className="dataItem"
                    style={{
                      padding: '10px',
                      borderBottom: '1px solid #ddd',
                      cursor: 'grab',
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, template, 'flow')}
                    onDragEnd={handleDragEnd}
                  >
                    <span>{processSlug}</span>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'grey'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTemplate(template.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
          Master Task Templates
        </h2>

        {/* Task Template Search - New UI */}
        <div className="search">
          <div className="searchInputs" style={{ position: 'relative' }}>
            <input
              ref={taskTemplateRef}
              type="text"
              value={taskSearchTerm}
              onChange={(e) => setTaskSearchTerm(e.target.value)}
              placeholder="Search Master Template"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <svg
              className="search-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 50 50"
              width="20px"
              height="20px"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666'
              }}
            >
              <path d="M 21 3 C 11.621094 3 4 10.621094 4 20 C 4 29.378906 11.621094 37 21 37 C 24.710938 37 28.140625 35.804688 30.9375 33.78125 L 44.09375 46.90625 L 46.90625 44.09375 L 33.90625 31.0625 C 36.460938 28.085938 38 24.222656 38 20 C 38 10.621094 30.378906 3 21 3 Z M 21 5 C 29.296875 5 36 11.703125 36 20 C 36 28.296875 29.296875 35 21 35 C 12.703125 35 6 28.296875 6 20 C 6 11.703125 12.703125 5 21 5 Z" />
            </svg>
            <div
              className="searchData"
              style={{
                visibility: taskTemplateListDisplay,
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '0 0 4px 4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              {filteredMasterTemplates.map((task) => (
                <div
                  key={task.id}
                  className="dataItem"
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid #ddd',
                    cursor: 'grab',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task, 'master')}
                  onDragEnd={handleDragEnd}
                >
                  <span>{task.slug}</span>
                  <button
                    className="eye-button"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'grey'
                    }}
                    onClick={(e) => toggleTaskExpansion(task.id, e)}
                  >
                    {activeTaskId === task.id ? (
                      <EyeClosed size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Child tasks dropdown */}
      {activeTaskId && childTasksPosition && (
        <div
          className="child-tasks-dropdown"
          style={{
            position: 'fixed',
            right: `${childTasksPosition.right}px`,
            top: `${childTasksPosition.top}px`,
            zIndex: 1050,
            width: '250px',
            padding: '10px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          {taskTemplates.map(task => {
            if (task.id === activeTaskId) {
              return (
                <React.Fragment key={`child-${task.id}`}>
                  <div style={{
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    fontSize: '14px',
                    borderBottom: '1px solid #eee',
                    paddingBottom: '5px'
                  }}>
                    Child Tasks for {task.data.slug}
                  </div>
                  
                  {task.childTasks?.map(childTask => (
                    <div
                      key={childTask.id}
                      style={{
                        padding: '10px',
                        marginBottom: '5px',
                        border: '1px solid #eee',
                        cursor: 'grab',
                        background: '#f9f9f9',
                        borderRadius: '3px',
                        fontSize: '14px'
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, childTask, 'childTask')}
                      onDragEnd={handleDragEnd}
                    >
                      {childTask.data?.slug || childTask.name}
                    </div>
                  ))}
                  
                  {(!task.childTasks || task.childTasks.length === 0) && (
                    <div style={{ padding: '8px', color: '#888', fontSize: '14px' }}>
                      No child tasks available
                    </div>
                  )}
                </React.Fragment>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default TemplatesSidebar;