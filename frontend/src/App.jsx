import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from 'reactflow';
import { ChevronLeft, ChevronRight, Save, Eraser } from 'lucide-react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SaveIcon from '@mui/icons-material/Save';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'; // or DeleteSweepIcon
import TaskForm from './components/TaskForm';
import ProcessForm from './components/ProcessForm';
import { Sidebar, ProcessNode } from './components/NodeSidebar';
import { TemplatesSidebar } from './components/TemplatesSidebar';
import { useTemplateManagement } from './hooks/useTemplateManagement';
import { ErrorModal } from './hooks/ErrorModal'

const nodeTypes = {
  process: ProcessNode,
  task: ProcessNode,
  master: ProcessNode,
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '99vw',
  },
  sidebar: {
    position: 'relative',
    transition: 'width 0.3s ease',
    background: '#ffffff',
    width: '250px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
  },
  sidebarCollapsed: {
    width: '0',
  },
  toggleButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: '#500472',
    color: 'white',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  toggleLeft: {
    left: 0,
    transform: 'translate(-100%, -50%)',
    borderRadius: '4px 0 0 4px',
  },
  toggleRight: {
    right: 0,
    transform: 'translate(100%, -50%)',
    borderRadius: '0 4px 4px 0',

  },
  flowContainer: {
    flex: 1,
    height: '100%',
  },
  saveButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: '#500472',
    color: 'white',
    fontFamily: 'Arial, Helvetica, sans-serif',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 5,
  },
  clearButton: {
    position: 'absolute',
    top: '20px',
    right: '170px',
    background: '#500472',
    color: 'white',
    fontFamily: 'Arial, Helvetica, sans-serif',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 5,
  },
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTemplates, setTaskTemplates] = useState([]);
  const [hasSaved, setHasSaved] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const showError = (message) => {
    setError(message);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
  };

  // New state for template management
  const [isLoadedTemplate, setIsLoadedTemplate] = useState(false);
  const [hasTemplateChanges, setHasTemplateChanges] = useState(false);

  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);

  const {
    templates,
    saveTemplate,
    loadTemplate,
    deleteTemplate
  } = useTemplateManagement();

  const onInit = (instance) => {
    reactFlowInstance.current = instance;
  };

  const onConnect = useCallback((params) => {
    setHasTemplateChanges(true);
    setEdges((eds) => addEdge(params, eds));
  }, []);

  const onNodeDoubleClick = useCallback((_, node) => {
    setSelectedNode(node);
    setShowTaskForm(true);
  }, []);

  const handleSaveTemplate = () => {
    const hasProcessNode = nodes.some(node => node.type === 'process');
    const hasMasterNode = nodes.some(node => node.type === 'master');

    if (hasMasterNode) {
      showError("Please remove master node first!");
      return;
    }

    if (!reactFlowInstance.current || (isLoadedTemplate && !hasTemplateChanges)) {
      return;
    }

    const taskNodes = nodes.filter(node => node.type === 'task');
    const disconnectedTaskNodes = taskNodes.filter(taskNode => {
      return !edges.some(edge => edge.source === taskNode.id || edge.target === taskNode.id);
    });

    if (disconnectedTaskNodes.length > 0) {
      showError("One or more task nodes are not connected to any other node!");
      return;
    }

    // Create a mapping of old node IDs to new nodes
    const nodeMapping = {};
    const updatedNodes = nodes.map(node => {
      const newNode = {
        ...node,
        id: `${node.type}-${Date.now()}-${Math.random()}`,
        data: {
          ...node.data,
          state_id: `state-${Date.now()}-${Math.random()}`
        }
      };
      nodeMapping[node.id] = newNode;
      return newNode;
    });

    // Update edges using the node mapping
    const updatedEdges = edges.map(edge => {
      return {
        ...edge,
        id: `edge-${Date.now()}-${Math.random()}`,
        source: nodeMapping[edge.source].id,
        target: nodeMapping[edge.target].id
      };
    });


    setNodes(updatedNodes);
    setEdges(updatedEdges);

    saveTemplate(reactFlowInstance.current).then(() => {
      setHasSaved(true);
    });;
    setIsLoadedTemplate(false);
    setHasTemplateChanges(false);
  };

  const handleLoadTemplate = (template) => {
    if (!reactFlowInstance.current) return;
    loadTemplate(reactFlowInstance.current, template);
    console.log(template);
    setIsLoadedTemplate(true);
    setHasTemplateChanges(false);
  };

  const handleSaveTaskTemplate = useCallback(async (taskNode, isUpdate = false) => {
    const template = {
      ...taskNode,
      id: isUpdate ? taskNode.id : `${"task"}-${Date.now()}-${Math.random()}`,
    };

    const response = await fetch("http://localhost:8080/task", {
      method: isUpdate ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template)
    });

    if (isUpdate) {
      setTaskTemplates(prev => prev.map(t =>
        t.id === template.id ? template : t
      ));
    } else {
      setTaskTemplates(prev => [...prev, template]);
    }
  }, []);

  const handleClearCanvas = useCallback(() => {
    if (nodes.length === 0) return;
    if (window.confirm('Are you sure you want to clear the canvas? All unsaved changes will be lost.')) {
      setNodes([]);
      setEdges([]);
      setIsLoadedTemplate(false);
      setHasTemplateChanges(false);
    }
  }, [nodes.length]);

  const handleDeleteTaskTemplate = useCallback((id) => {
    fetch(`http://localhost:8080/task/${id}`, {
      method: "DELETE",
    }).then(() => {
      setTaskTemplates(prev => prev.filter(template => template.id !== id));
    }).catch(error => {
      console.error("Error deleting task template:", error);
    });
  }, []);

  const handleNodeUpdate = useCallback((nodeData, saveAsTemplate = false) => {
    setHasTemplateChanges(true);

    setNodes(nds =>
      nds.map(node => (
        node.id === selectedNode.id
          ? {
            ...node,
            type: nodeData.type,
            data: {
              ...node.data,
              ...nodeData,
              state_id: `state-${Date.now()}-${Math.random()}`
            }
          }
          : node
      ))
    );

    if (saveAsTemplate && selectedNode.type === 'task') {
      const template = {
        id: Date.now().toString(),
        type: 'task',
        nodes: [{
          type: 'task',
          data: { ...nodeData },
        }],
        timestamp: new Date().toISOString(),
      };
      setTaskTemplates(prev => [...prev, template]);
    }

    setShowTaskForm(false);
  }, [selectedNode, setNodes, setTaskTemplates]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    const templateData = event.dataTransfer.getData('application/reactflow-template');

    if (templateData) {
      try {
        const data = JSON.parse(templateData);

        if (data.type === 'flow' && nodes.length === 0) {
          setIsLoadedTemplate(true);
          setHasTemplateChanges(false);

          const newNodes = data.nodes.map(node => ({
            ...node,
            id: `${node.type}-${Date.now()}-${Math.random()}`,
            data: {
              ...node.data,
              state_id: `state-${Date.now()}-${Math.random()}`
            }
          }));

          const newEdges = data.edges.map(edge => {
            const sourceNode = newNodes.find(n =>
              n.id.includes(edge.source.split('-')[0])
            );
            const targetNode = newNodes.find(n =>
              n.id.includes(edge.target.split('-')[0])
            );

            return {
              ...edge,
              id: `edge-${Date.now()}-${Math.random()}`,
              source: sourceNode.id,
              target: targetNode.id
            };
          });

          setNodes(newNodes);
          setEdges(newEdges);
        } else if (data.type === 'master') {
          setHasTemplateChanges(true);
          const position = {
            x: event.clientX - event.target.getBoundingClientRect().left,
            y: event.clientY - event.target.getBoundingClientRect().top,
          };

          const newNode = {
            id: `master-${Date.now()}`,
            position,
            type: 'master',
            data: {
              ...data.data,
              label: data.data.label,
              state_id: `state-${Date.now()}-${Math.random()}`,
              // Add properties to track that this came from a template
              fromTemplate: true,
              templateId: data.id
            }
          };

          setNodes((nds) => nds.concat(newNode));
        }
        return;
      } catch (error) {
        console.error('Error parsing template data:', error);
      }
    }

    if (type) {
      setHasTemplateChanges(true);
      if (type === 'process' && nodes.some(node => node.type === 'process')) {
        showError('Only one process node is allowed');
        return;
      }

      const position = {
        x: event.clientX - event.target.getBoundingClientRect().left,
        y: event.clientY - event.target.getBoundingClientRect().top,
      };
      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: type.charAt(0).toUpperCase() + type.slice(1),
          name: '',
          process_slug: '',
          input_format: '{}',
          header: '{}',
          email_id: '',
          state_id: `state-${Date.now()}-${Math.random()}`
        },
      };

      setNodes((nds) => nds.concat(newNode));
    }
  }, [nodes, setNodes, setEdges]);

  useEffect(() => {
    const fetchTaskTemplates = async () => {
      try {
        const response = await fetch("http://localhost:8080/tasks", {
          method: "GET",
        });
        const resp = await response.json();

        const tempArray = resp.map(template => ({
          id: template.id,
          type: 'master',
          timestamp: new Date().toISOString(),
          data: {
            ...template,
            label: template.name || 'task'
          },
          // For testing, attach the same API response as child tasks
          childTasks: resp.map(childItem => ({
            id: `child-${childItem.id}`,
            type: 'childTask',
            name: childItem.name,
            data: {
              ...childItem,
              slug: childItem.name
            }
          }))
        }));

        setTaskTemplates(tempArray);
      } catch (error) {
        console.log(error);
      }
    };

    fetchTaskTemplates();
  }, []);

  // Compute whether there's a process node for the save button
  const hasProcessNode = nodes.some(node => node.type === 'process');
  const isSaveEnabled = hasProcessNode && (!isLoadedTemplate || hasTemplateChanges);




  return (
    <div style={styles.container}>
      <ReactFlowProvider>
        <div ref={reactFlowWrapper} style={styles.container}>
          <div style={{
            ...styles.sidebar,
            ...(leftSidebarOpen ? {} : styles.sidebarCollapsed),
          }}>
            <button
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              style={{ ...styles.toggleButton, ...styles.toggleRight }}
            >
              {leftSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </button>
            {leftSidebarOpen && <Sidebar />}
          </div>

          <div style={styles.flowContainer}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onInit={onInit}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDoubleClick={onNodeDoubleClick}
              nodeTypes={nodeTypes}
              onDragOver={onDragOver}
              onDrop={onDrop}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />

              <button
                style={{
                  ...styles.clearButton,
                  opacity: nodes.length > 0 ? 1 : 0.5,
                  cursor: nodes.length > 0 ? 'pointer' : 'not-allowed'
                }}
                onClick={handleClearCanvas}
                disabled={nodes.length === 0}
              >
                <DeleteSweepIcon style={{ fontSize: 16 }} />
                <span>Clear Canvas</span>
              </button>

              <button
                style={{
                  ...styles.saveButton,
                  opacity: (hasProcessNode && (!isLoadedTemplate || hasTemplateChanges) && (!hasSaved | hasTemplateChanges)) ? 1 : 0.5,
                  cursor: (hasProcessNode && (!isLoadedTemplate || hasTemplateChanges) && (!hasSaved | hasTemplateChanges)) ? 'pointer' : 'not-allowed'
                }}
                onClick={handleSaveTemplate}
                disabled={!hasProcessNode || (isLoadedTemplate && !hasTemplateChanges) || (hasSaved && !hasTemplateChanges)}
              >
                <SaveIcon style={{ fontSize: 16 }} />
                <span>Save Template</span>
              </button>


            </ReactFlow>

            {showTaskForm && selectedNode && (
              selectedNode.type === 'process' ? (
                <ProcessForm
                  node={selectedNode}
                  onClose={() => setShowTaskForm(false)}
                  onSave={handleNodeUpdate}
                />
              ) : (
                <TaskForm
                  node={selectedNode}
                  onClose={() => setShowTaskForm(false)}
                  onSave={handleNodeUpdate}
                  onSaveTemplate={handleSaveTaskTemplate}
                  onDeleteTemplate={handleDeleteTaskTemplate}
                />
              )
            )}
          </div>
          <ErrorModal
            isOpen={isOpen}
            title="Error"
            message={error}
            onClose={handleClose}
          />
          <div style={{
            ...styles.sidebar,
            ...(rightSidebarOpen ? {} : styles.sidebarCollapsed),
          }}>
            <button
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              style={{ ...styles.toggleButton, ...styles.toggleLeft }}
            >
              {rightSidebarOpen ? <ChevronRight /> : <ChevronLeft />}
            </button>
            {rightSidebarOpen && (
              <TemplatesSidebar
                templates={templates}
                taskTemplates={taskTemplates}
                onDeleteTemplate={deleteTemplate}
                onDeleteTaskTemplate={handleDeleteTaskTemplate}
                existingNodes={nodes}
                onLoadTemplate={handleLoadTemplate}
              />
            )}
          </div>
        </div>
      </ReactFlowProvider>
    </div>

  );
}

export default App;