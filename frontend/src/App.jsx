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
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import TaskForm from './components/TaskForm';
import ProcessForm from './components/ProcessForm';
import { Sidebar } from './components/Sidebar';
import { TemplatesSidebar } from './components/TemplatesSidebar';
import { ProcessNode } from './components/CustomNodes';
import { useTemplateManagement } from './hooks/useTemplateManagement';

const nodeTypes = {
  process: ProcessNode,
  task: ProcessNode,
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
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
    background: '#1a73e8',
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
    background: '#4caf50',
    color: 'white',
    fontFamily:'Ubuntu',
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
    if (nodes.length === 0) {
      alert('Cannot save empty template');
      return;
    }
    
    if (!reactFlowInstance.current || (isLoadedTemplate && !hasTemplateChanges)) {
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
    
    saveTemplate(reactFlowInstance.current);
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

  const handleSaveTaskTemplate = useCallback(async(taskNode) => {
    const template = {
      ...taskNode,
      id: `${"task"}-${Date.now()}-${Math.random()}`,
    };

    const response = await fetch("http://localhost:8080/task", {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify(template)
    });

    setTaskTemplates(prev => [...prev, template]);
  }, []);

  const handleDeleteTemplate = useCallback((id) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
  }, []);

  const handleDeleteTaskTemplate = useCallback((id) => {
    setTaskTemplates(prev => prev.filter(template => template.id !== id));
  }, []);

  const handleNodeUpdate = useCallback((nodeData, saveAsTemplate = false) => {
    setHasTemplateChanges(true);
    
    setNodes(nds =>
      nds.map(node => (
        node.id === selectedNode.id
          ? { 
              ...node, 
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
        } else if (data.type === 'task') {
          setHasTemplateChanges(true);
          const position = {
            x: event.clientX - event.target.getBoundingClientRect().left,
            y: event.clientY - event.target.getBoundingClientRect().top,
          };
          
          const newNode = {
            id: `task-${Date.now()}`,
            position,
            type: 'task',
            data: {
              ...data.data,
              label: data.data.label,
              state_id: `state-${Date.now()}-${Math.random()}`
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
        alert('Only one process node is allowed');
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
          type: 'task',
          timestamp: new Date().toISOString(),
          data: { 
            ...template,
            label: template.name || 'task'
          }
        }));

        setTaskTemplates(tempArray);
      } catch (error) {
        console.log(error);
      }
    };

    fetchTaskTemplates();
  }, []);

  useEffect(() => {
    edges.forEach((edge) => {
      const srcId = edge.source;
      const tgtId = edge.target;

      const srcNode = nodes.find((node) => node.id === srcId);
      const tgtNode = nodes.find((node) => node.id === tgtId);

      if (srcId.includes("process")) {
        setNodes((nds) => nds.map(node => 
          node.id === tgtId ? 
          {...tgtNode, data: {...tgtNode.data, input: srcNode.data.header}} : 
          node
        ));
      } else {
        setNodes((nds) => nds.map(node => 
          node.id === tgtId ? 
          {...tgtNode, data: {...tgtNode.data, input: srcNode.data.output_format}} : 
          node
        ));
      }
    });
    console.log(nodes);
  }, [edges]);

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
              {leftSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
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
                  ...styles.saveButton,
                  opacity: (!isLoadedTemplate || hasTemplateChanges) ? 1 : 0.5,
                  cursor: (!isLoadedTemplate || hasTemplateChanges) ? 'pointer' : 'not-allowed'
                }} 
                onClick={handleSaveTemplate}
                disabled={isLoadedTemplate && !hasTemplateChanges}
              >
                <Save size={16} />
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
                />
              )
            )}
          </div>

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