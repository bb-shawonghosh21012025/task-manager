import React, { useState, useCallback, useEffect,useRef } from 'react';
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
  const [showTaskForm, setShowTaskForm] = useState(false);
  // const [templates, setTemplates] = useState([]);
  const [taskTemplates, setTaskTemplates] = useState([]);
  
  
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);

  // useEffect(()=>console.log(nodes),[edges]);
    const { 
      templates, 
      saveTemplate, 
      loadTemplate, 
      deleteTemplate 
    } = useTemplateManagement();

  const onInit = (instance) => {
    reactFlowInstance.current = instance;
  };
  // Handle node connections
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, []);

  // Handle node selection for editing
  const onNodeDoubleClick = useCallback((_, node) => {
    setSelectedNode(node);
    setShowTaskForm(true);
  }, []);


  // Handle saving flow templates
  const handleSaveTemplate = () => {
    if (nodes.length === 0) {
      alert('Cannot save empty template');
      return;
    }
    
    if (!reactFlowInstance.current) return;
    saveTemplate(reactFlowInstance.current);
  };

  const handleLoadTemplate = (template) => {
    if (!reactFlowInstance.current) return;
    loadTemplate(reactFlowInstance.current, template);
  };



  // Handle saving task templates
  const handleSaveTaskTemplate = useCallback(async(taskNode) => {
    // console.log(taskNode);
    const template = {
      ...taskNode,
      id: `${"task"}-${Date.now()}-${Math.random()}`,
      // timestamp: new Date().toISOString(),
    };
    // console.log(JSON.stringify(template));

    const response = await fetch("http://localhost:8080/task",{
      method:"POST",
      headers:{ "Content-Type": "application/json"},
      body: JSON.stringify(template)
    });
    
    // const fresponse = await response.json();
  
    // console.log(response);

    setTaskTemplates(prev => [...prev, template]);
  }, []);

  // Handle template deletion
  const handleDeleteTemplate = useCallback((id) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
  }, []);

  const handleDeleteTaskTemplate = useCallback((id) => {
    setTaskTemplates(prev => prev.filter(template => template.id !== id));
  }, []);


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
        console.log(data);
        
        if (data.type === 'flow' && nodes.length === 0) {
          // Generate new IDs for nodes and edges to avoid conflicts
          const newNodes = data.nodes.map(node => ({
            ...node,
            id: `${node.type}-${Date.now()}-${Math.random()}`
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
          const position = {
            x: event.clientX - event.target.getBoundingClientRect().left,
            y: event.clientY - event.target.getBoundingClientRect().top,
          };
          
          const newNode = {
            id: `task-${Date.now()}`,
            position,
            type: 'task',
            data:{...data.data,label:data.data.label}
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
          name: '',
          process_slug: '',
          input_format: '{}',
          header: '{}',
          email_id: '',
        },
      };

      setNodes((nds) => nds.concat(newNode));
    }
  }, [nodes, setNodes, setEdges]);

  // Handle node updates
  const handleNodeUpdate = useCallback((nodeData, saveAsTemplate = false) => {
    console.log(nodeData);
    // console.log(selectedNode);

    setNodes(nds =>
      nds.map(node =>(
 
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, ...nodeData } }
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
          // We don't include position in template as it will be set on drop
        }],
        timestamp: new Date().toISOString(),
      };
      setTaskTemplates(prev => [...prev, template]);
    }

    setShowTaskForm(false);
  }, [selectedNode, setNodes, setTaskTemplates]);

  const fetchTaskTemplates = async()=>{
    try {
      const response = await fetch("http://localhost:8080/tasks",{
        method:"GET",
       }
      );
      const resp = await response.json();
      // console.log(resp);

      const tempArray = [];

      resp.forEach((template)=>{
        const temp = {
          id: template.id,
          type: 'task',
          timestamp: new Date().toISOString(),
          data: { 
          ...template,
          label: template.name || 'task' // Ensure we have a label for display
      }
        };
        tempArray.push(temp);
      });
      setTaskTemplates(tempArray);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(()=>{
    
    fetchTaskTemplates();

    edges.forEach((edge)=>{
    const srcId = edge.source;
    const tgtId = edge.target;

    const srcNode = nodes.find((node)=>node.id === srcId);
    const tgtNode = nodes.find((node)=>node.id === tgtId);

   
    
    if(srcId.includes("process") === true){
      // console.log(srcNode.data.header);
      setNodes((nds)=>nds.map(node => node.id === tgtId ? {...tgtNode,data:{...tgtNode.data,input:srcNode.data.header}}:node));
    }else{
      // console.log(srcNode.data.output_format);
      setNodes((nds)=>nds.map(node=> node.id === tgtId ? {...tgtNode,data:{...tgtNode.data,input:srcNode.data.output_format}}:node));
    }

    console.log(nodes);

  })
},[edges]);
 


  // console.log(nodes);

  return (
    <div style={styles.container}>
      {/* Left Sidebar */}
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

      {/* Main Flow Area */}
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
          
          <button style={styles.saveButton} onClick={handleSaveTemplate}>
            <Save size={16} />
            <span>Save Template</span>
          </button>
        </ReactFlow>

        {/* Conditional Form Rendering */}
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
            onDeleteTemplate={handleDeleteTemplate}
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