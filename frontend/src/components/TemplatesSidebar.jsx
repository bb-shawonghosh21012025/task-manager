import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Typography,
  Paper
} from '@mui/material';
import axios from 'axios';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CircularProgress from '@mui/material/CircularProgress';
import '../App.css';

export const TemplatesSidebar = ({
  // templates,
  taskTemplates,
  onDeleteTemplate,
  onDeleteTaskTemplate,
  existingNodes,
  onLoadTemplate
}) => {
  const [templates, setTemplates] = useState([]);
  const [masterTemplates, setMasterTemplates] = useState([]);
  const [childTasks, setChildTasks] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processSearchTerm, setProcessSearchTerm] = useState('');
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [childTasksPosition, setChildTasksPosition] = useState(null);
  const [loadingChildTaskId, setLoadingChildTaskId] = useState(null);

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
      document.removeEventListener("click", () => { });
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
    } catch {
      setIsLoading(false);
    }
  };

  const fetchMasterTaskTemplates = async () => {
    try {
      const response = await axios.get('http://localhost:8011/bb2admin/v1/master-task-templates',
        {
          headers: { 'bb-decoded-uid': localStorage.getItem("bb-decoded-uid") }
        }
      );
      // console.log(response);
      setMasterTemplates(response.data.data);
    } catch (error) {
      console.log("error in fetchMasterTaskTemplate", error);
    }
  }

  // ...existing code...

  const toggleTaskExpansion = async (task, e) => {
    e.stopPropagation();
    e.preventDefault();

    // If already loading this task, do nothing
    if (loadingChildTaskId === task.id) return;

    // If already open and not loading, close
    if (activeTaskId === task.id && !loadingChildTaskId) {
      setActiveTaskId(null);
      setChildTasksPosition(null);
      return;
    }

    // Set active and loading immediately so dropdown stays open
    setActiveTaskId(task.id);
    setLoadingChildTaskId(task.id);

    // Calculate position for the child tasks dropdown
    const rect = e.currentTarget.getBoundingClientRect();
    setChildTasksPosition({
      top: rect.top,
      right: window.innerWidth - rect.left + 10
    });

    try {
      const response = await axios.get(`http://localhost:8011/bb2admin/v2/task-template/${task.id}`,
        {
          headers: { 'bb-decoded-uid': localStorage.getItem("bb-decoded-uid") }
        }
      );

      setChildTasks([]);
      response.data.map((data) => {
        setChildTasks((prev) => [...prev, { ...data, master_task_slug: task.slug }]);
      });
    } catch (error) {
      console.log("Error fetching child tasks", error);
    }

    setLoadingChildTaskId(null); // Done loading
  };


  const handleDragStart = (event, template, type) => {
    event.dataTransfer.setData("application/reactflow", type);

    if (type === 'task' && type === 'childTask') {
      event.dataTransfer.setData('application/reactflow-template', JSON.stringify(template));
      event.dataTransfer.effectAllowed = 'move';
    } else if (type === "flow") {
      let transferData = {
        type,
        template
      };
      event.dataTransfer.setData('application/reactflow-template', JSON.stringify(transferData));
      event.dataTransfer.effectAllowed = 'move';

    } else if (type === "master") {
      let transferData = {
        type,
        template,
        isFromTemplate: true,
        task_slug: template.slug
      };
      event.dataTransfer.setData('application/reactflow-template', JSON.stringify(transferData));
      event.dataTransfer.effectAllowed = 'move';
    } else if (type === 'task') {
      let transferData = {
        type,
        template,
        task_slug: template.slug,
        master_task_slug: template.master_task_slug
      };
      event.dataTransfer.setData('application/reactflow-template', JSON.stringify(transferData));
      event.dataTransfer.effectAllowed = 'move';
    }

    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // ...existing imports and code...

  // Place this outside the component if you want, or inside but not inside useEffect
  function useDropdownClose(activeTaskId, loadingChildTaskId, setActiveTaskId, setChildTasksPosition) {
    useEffect(() => {
      function handleClickOutside(event) {
        // Only close if not loading
        if (
          activeTaskId &&
          !loadingChildTaskId &&
          !event.target.closest('.child-tasks-dropdown') &&
          !event.target.closest('.eye-button')
        ) {
          setActiveTaskId(null);
          setChildTasksPosition(null);
        }
      }

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [activeTaskId, loadingChildTaskId, setActiveTaskId, setChildTasksPosition]);
  }

  // In your component body:
  useDropdownClose(activeTaskId, loadingChildTaskId, setActiveTaskId, setChildTasksPosition);

  const filteredProcessTemplates = templates.filter(template => {
    return template.slug?.toLowerCase().includes(processSearchTerm.toLowerCase()) || template.name?.toLowerCase().includes(processSearchTerm.toLowerCase());
  });

  const filteredMasterTemplates = masterTemplates.filter(task =>
    task.slug.toLowerCase().includes(taskSearchTerm.toLowerCase())
  );

  return (
    <div className="templates-sidebar-container">
      <div className="sidebar-section">
        <Typography variant="h6" className="section-heading">Process Templates</Typography>

        {/* Process Template Search */}
        <div className="newsearch">
          <div className="newsearchInputs">
            <input
              ref={processTemplateRef}
              type="text"
              value={processSearchTerm}
              onChange={(e) => setProcessSearchTerm(e.target.value)}
              placeholder="Search Process Template"
            />
            <svg
              className="search-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 50 50"
              width="20px"
              height="20px"
            >
              <path d="M 21 3 C 11.621094 3 4 10.621094 4 20 C 4 29.378906 11.621094 37 21 37 C 24.710938 37 28.140625 35.804688 30.9375 33.78125 L 44.09375 46.90625 L 46.90625 44.09375 L 33.90625 31.0625 C 36.460938 28.085938 38 24.222656 38 20 C 38 10.621094 30.378906 3 21 3 Z M 21 5 C 29.296875 5 36 11.703125 36 20 C 36 28.296875 29.296875 35 21 35 C 12.703125 35 6 28.296875 6 20 C 6 11.703125 12.703125 5 21 5 Z" />
            </svg>
            <div
              className="newsearchData"
              style={{ visibility: processTemplateListDisplay }}
            >
              {filteredProcessTemplates.map((template) => {
                const processSlug = template.slug || template.name;
                // node.id.includes("process"))?.data.process_slug || "unknown process";

                return (
                  <div
                    key={template.id}
                    className="dataItem"
                    draggable
                    onDragStart={(e) => handleDragStart(e, template, 'flow')}
                    onDragEnd={handleDragEnd}
                  >
                    <span className="dataName" title={processSlug}>{processSlug}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar-section">
        <Typography variant="h6" className="section-heading">Master Task Templates</Typography>

        {/* Task Template Search */}
        <div className="newsearch">
          <div className="newsearchInputs">
            <input
              ref={taskTemplateRef}
              type="text"
              value={taskSearchTerm}
              onChange={(e) => setTaskSearchTerm(e.target.value)}
              placeholder="Search Master Template"
            />
            <svg
              className="search-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 50 50"
              width="20px"
              height="20px"
            >
              <path d="M 21 3 C 11.621094 3 4 10.621094 4 20 C 4 29.378906 11.621094 37 21 37 C 24.710938 37 28.140625 35.804688 30.9375 33.78125 L 44.09375 46.90625 L 46.90625 44.09375 L 33.90625 31.0625 C 36.460938 28.085938 38 24.222656 38 20 C 38 10.621094 30.378906 3 21 3 Z M 21 5 C 29.296875 5 36 11.703125 36 20 C 36 28.296875 29.296875 35 21 35 C 12.703125 35 6 28.296875 6 20 C 6 11.703125 12.703125 5 21 5 Z" />
            </svg>
            <div
              className="newsearchData"
              style={{
                visibility:
                  (activeTaskId && taskTemplateListDisplay === "hidden")
                    ? "visible"
                    : taskTemplateListDisplay
              }}
            >
              {filteredMasterTemplates.map((task) => (
                <div
                  key={task.id}
                  className="dataItem"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task, 'master')}
                  onDragEnd={handleDragEnd}
                >
                  <span className="dataName" title={task.slug}>
                    {task.slug}
                  </span>

                  <IconButton
                    className="eye-button"
                    size="small"
                    onClick={(e) => toggleTaskExpansion(task, e)}
                    sx={{ color: 'grey' }}
                  >
                    {activeTaskId === task.id ? (
                      <VisibilityOffIcon fontSize="small" />
                    ) : (
                      <VisibilityIcon fontSize="small" />
                    )}
                  </IconButton>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Child tasks dropdown with search */}
      {activeTaskId && childTasksPosition && (
        <Paper
          className="child-tasks-dropdown"
          sx={{
            right: `${childTasksPosition.right}px`,
            top: `${childTasksPosition.top}px`,
          }}
        >
          {masterTemplates.map(task => {
            if (task.id === activeTaskId) {
              return (
                <React.Fragment key={`child-${task.id}`}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 'bold',
                      marginBottom: '10px',
                      borderBottom: '1px solid #eee',
                      paddingBottom: '5px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Child Tasks for {task.slug}
                  </Typography>
                  <div
                    style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      minHeight: '40px',
                      display: loadingChildTaskId === activeTaskId ? 'flex' : 'block',
                      flexDirection: 'column',
                      alignItems: loadingChildTaskId === activeTaskId ? 'center' : 'flex-start',
                      justifyContent: loadingChildTaskId === activeTaskId ? 'center' : 'flex-start'
                    }}
                  >
                    {loadingChildTaskId === activeTaskId ? (
                      <CircularProgress size={28} />
                    ) : childTasks.length > 0 ? (
                      childTasks.map(childTask => (
                        <div
                          key={childTask.id}
                          style={{
                            padding: '10px',
                            marginBottom: '5px',
                            position: 'relative',
                            border: '1px solid #500472',
                            cursor: 'grab',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            alignItems: 'center',
                            display: 'flex',
                            maxWidth: '100%',
                            whiteSpace: 'nowrap',
                            background: 'white',
                            fontSize: '14px'
                          }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, childTask, 'task')}
                          onDragEnd={handleDragEnd}
                        >
                          {childTask.slug || childTask.name}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '8px', color: '#888', fontSize: '14px' }}>
                        No child tasks available
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            }
            return null;
          })}
        </Paper>
      )}
    </div>
  );
};

export default TemplatesSidebar;