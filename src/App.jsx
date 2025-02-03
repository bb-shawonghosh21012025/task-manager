import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import NodeForm from './components/NodeForm';
import { Sidebar } from './components/Sidebar';
import { TemplatesSidebar } from './components/TemplatesSidebar';
import { ProcessNode } from './components/CustomNodes';

// Register custom node types
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
  // State management
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [taskTemplates, setTaskTemplates] = useState([]);
  

  // Handle node connections
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, []);

  // Handle node selection for editing
  const onNodeDoubleClick = useCallback((_, node) => {
    setSelectedNode(node);
    setShowNodeForm(true);
  }, []);

  // Handle saving flow templates
  const handleSaveTemplate = useCallback(() => {
    if (nodes.length === 0) {
      alert('Cannot save empty template');
      return;
    }

    const template = {
      id: Date.now().toString(),
      nodes: nodes.map(node => ({
        ...node,
        position: { ...node.position }
      })),
      edges: edges,
      timestamp: new Date().toISOString(),
    };
    setTemplates(prev => [...prev, template]);
  }, [nodes, edges]);

  // Handle saving task templates
  const handleSaveTaskTemplate = useCallback((taskNode) => {
    const template = {
      ...taskNode,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setTaskTemplates(prev => [...prev, template]);
  }, []);

  // Handle template deletion
  const handleDeleteTemplate = useCallback((id) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
  }, []);

  const handleDeleteTaskTemplate = useCallback((id) => {
    setTaskTemplates(prev => prev.filter(template => template.id !== id));
  }, []);
  const handleTasksImported = ({ nodes, edges }) => {
    setNodes(nodes);
    setEdges(edges);
  };
  
  const handleLoadTemplate = ({ nodes, edges }) => {
    setNodes(nodes);
    setEdges(edges);
  };

  // Handle drag and drop
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
          // Generate new IDs for nodes and edges to avoid conflicts
          const newNodes = data.nodes.map(node => ({
            ...node,
            id: `${node.type}-${Date.now()}-${Math.random()}`
          }));

          const newEdges = data.edges.map(edge => {
            // Find the new IDs of the source and target nodes
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
          const position = {
            x: event.clientX - event.target.getBoundingClientRect().left,
            y: event.clientY - event.target.getBoundingClientRect().top,
          };
          
          const newNode = {
            ...data.nodes[0],
            id: `task-${Date.now()}`,
            position,
            type: 'task',
          };
          
          setNodes((nds) => nds.concat(newNode));
        }
        return;
      } catch (error) {
        console.error('Error parsing template data:', error);
      }
    }

    if (type) {
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
          description: '',
          assignee: '',
          dueDate: '',
          priority: 'medium',
        },
      };

      setNodes((nds) => nds.concat(newNode));
    }
  }, [nodes, setNodes, setEdges]);

  // Handle node updates
  const handleNodeUpdate = useCallback((nodeData) => {
    setNodes(nds =>
      nds.map(node =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, ...nodeData } }
          : node
      )
    );
    setShowNodeForm(false);
  }, [selectedNode, setNodes]);

  return (
    <div style={styles.container}>
      {/* Left Sidebar */}
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

      {/* Main Flow Area */}
      <div style={styles.flowContainer}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
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
          
          <button style={styles.saveButton} onClick={handleSaveTemplate}>
            <Save size={16} />
            <span>Save Template</span>
          </button>
        </ReactFlow>

        {/* Node Form Modal */}
        {showNodeForm && (
          <NodeForm
            node={selectedNode}
            onClose={() => setShowNodeForm(false)}
            onSave={handleNodeUpdate}
            onSaveTemplate={handleSaveTaskTemplate}
          />
        )}
      </div>

      {/* Right Sidebar */}
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
            onDeleteTemplate={(id) => {handleDeleteTaskTemplate}}
            onDeleteTaskTemplate={(id) => {handleDeleteTaskTemplate}}
            existingNodes={nodes}
            onLoadTemplate={handleLoadTemplate}
          />
        )}
      </div>
    </div>
  );
}

export default App;