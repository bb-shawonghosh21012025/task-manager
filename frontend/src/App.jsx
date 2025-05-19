import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from 'reactflow';
import axios from 'axios';
import { Button } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RestoreIcon from '@mui/icons-material/Restore';
import SaveIcon from '@mui/icons-material/Save';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CircularProgress from '@mui/material/CircularProgress';
import TaskForm from './components/TaskForm';
import ProcessForm from './components/ProcessForm';
import { NodeDropdown, Node } from './components/NodeSidebar';
import { TemplatesSidebar } from './components/TemplatesSidebar';
import { useTemplateManagement } from './hooks/useTemplateManagement';
import { ErrorModal } from './hooks/ErrorModal'
import { ConfirmModal } from './hooks/ConfirmModal'

const nodeTypes = {
  process: Node,
  task: Node,
  master: Node,
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [initialNodePositions, setInitialNodePositions] = useState({});
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isDraggingProcessTemplate, setIsDraggingProcessTemplate] = useState(false);

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

  const onEdgeChange = useCallback((changes) => {
    setEdges((eds) => {
      const updatedEdges = applyEdgeChanges(changes, eds);

      // Handle edge removal
      changes.forEach((change) => {
        if (change.type === 'remove') {
          const { source, target } = change;
          console.log(change);

          const sourceId = change.id.split('-')[1];
          const targetId = change.id.split('-')[2];

          // Use reactFlowInstance to get the latest nodes
          const currentNodes = reactFlowInstance.current.getNodes();
          const sourceNode = currentNodes.find(node => node.id === `task-${sourceId}`);
          const targetNode = currentNodes.find(node => node.id === `task-${targetId}`);

          // console.log("sourceNode", sourceNode);
          // console.log("targetNode", targetNode);

          if (sourceNode && targetNode) {
            // Remove the dependent task slug from the target node
            const dependentTaskSlugs = targetNode.data.dependent_task_slug
              ? targetNode.data.dependent_task_slug.split(",").filter(slug => slug !== sourceNode.data.slug)
              : [];
            targetNode.data.dependent_task_slug = dependentTaskSlugs.join(",");
          }

          console.log("Updated targetNode", targetNode);

          // Update the nodes state
          setNodes((nds) =>
            nds.map((node) =>
              node.id === targetNode?.id ? { ...targetNode } : node
            )
          );
        }
      });

      return updatedEdges;
    });
  }, []);

  const onConnect = useCallback((params) => {
    setHasTemplateChanges(true);

    // Use reactFlowInstance to get the latest nodes
    const currentNodes = reactFlowInstance.current.getNodes();
    const sourceNode = currentNodes.find(node => node.id === params.source);
    const targetNode = currentNodes.find(node => node.id === params.target);


    if (targetNode === sourceNode)
      return;

    if (sourceNode.type === 'process') {
      if (targetNode.data.dependent_task_slug)
        return;
    }

    if (sourceNode.type === 'task') {
      targetNode.data.dependent_task_slug = targetNode.data.dependent_task_slug ? targetNode.data.dependent_task_slug + "," + sourceNode.data.slug : sourceNode.data.slug;
    }

    setEdges((eds) => addEdge(params, eds));

    // 
  }, []);

  const handleNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedNodeId(node.id);
  }, []);

  const highlightedEdges = useMemo(() =>
    edges.map(edge => ({
      ...edge,
      style: (edge.source === selectedNodeId || edge.target === selectedNodeId)
        ? { ...edge.style, stroke: 'blue', strokeWidth: 3 }
        : edge.style,
      // animated: edge.source === selectedNodeId || edge.target === selectedNodeId,
    })), [edges, selectedNodeId]);

  const onNodeDoubleClick = useCallback((_, node) => {
    setSelectedNode(node);
    setShowTaskForm(true);
  }, []);

  const sortNodesByDependencies = (nodes) => {
    const adjList = new Map();
    const inDegree = new Map();
    const sortedNodes = [];
    const queue = [];

    const taskNodes = nodes.filter(node => node.type === 'task');

    // Step 1: Build the adjacency list and in-degree map
    taskNodes.forEach((node) => {
      const currentSlug = node.data.slug;
      const dependentTaskSlugs = node.data.dependent_task_slug
        ? node.data.dependent_task_slug.split(",").map(s => s.trim()).filter(Boolean)
        : [];

      // Ensure current node exists in the maps
      if (!adjList.has(currentSlug)) {
        adjList.set(currentSlug, []);
      }
      if (!inDegree.has(currentSlug)) {
        inDegree.set(currentSlug, 0);
      }

      // Build reverse edge: dependency -> node
      dependentTaskSlugs.forEach((depSlug) => {
        if (!adjList.has(depSlug)) {
          adjList.set(depSlug, []);
        }
        adjList.get(depSlug).push(currentSlug);

        // Increment in-degree for current node
        inDegree.set(currentSlug, (inDegree.get(currentSlug) || 0) + 1);
      });
    });

    // Step 2: Find nodes with 0 in-degree
    for (const [slug, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(slug);
      }
    }

    // Step 3: Topological sort (Kahn's algorithm)
    while (queue.length > 0) {
      const top = queue.shift();
      sortedNodes.push(top);

      const neighbors = adjList.get(top) || [];
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    console.log(sortedNodes)

    return sortedNodes;
  };


  const handleSaveTemplate = async () => {

    const processNode = nodes.filter(node => node.type === 'process')[0];
    const hasMasterNode = nodes.some(node => node.type === 'master');

    if (hasMasterNode) {
      showError("Please remove master node first!");
      return;
    }

    var taskNodes = nodes.filter(node => node.type === 'task');
    const disconnectedTaskNodes = taskNodes.filter(taskNode => {
      return !edges.some(edge => edge.source === taskNode.id || edge.target === taskNode.id);
    });

    if (disconnectedTaskNodes.length > 0) {
      showError("One or more task nodes are not connected to any other node!");
      return;
    }

    // console.log(processNode);

    const processTemplate = {
      name: processNode.data.name,
      slug: processNode.data.slug,
      input_format: typeof processNode.data.input_format === 'string' ? JSON.parse(processNode.data.input_format) : processNode.data.input_format,
      http_headers: typeof processNode.data.header === 'string' ? JSON.parse(processNode.data.header) : processNode.data.header,
      email_list: processNode.data.email_list,
      description: processNode.data.description || "abcd",
    };

    console.log(processTemplate);

    // setNodes((nds)=>sortNodesByDependencies(nds));

    // console.log(sortNodesByDependencies(nodes));
    const sortedNodes = [];

    for (let slug of sortNodesByDependencies(taskNodes)) {
      const node = nodes.find(node => node.data.slug === slug);
      if (node) {
        sortedNodes.push(node);
      }
    }

    taskNodes = sortedNodes;
    console.log(taskNodes);

    const csvHeaders = ["name", "slug", "description", "help_text", "input_format", "output_format", "dependent_task_slug", "host", "bulk_input", "input_http_method", "api_endpoint", "api_timeout_in_ms", "response_type", "is_json_input_needed", "task_type", "is_active", "is_optional", "eta", "service_id", "email_list", "delay_in_ms", "master_task_template_slug", "action"];

    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) return ""; // Handle null/undefined
      const stringValue = value.toString();
      return `"${stringValue.replace(/"/g, '""')}"`; // Escape double quotes and wrap in quotes
    };

    // Generate CSV rows
    const csvRows = taskNodes.map((node) => {
      const data = node.data;
      return [
        escapeCsvValue(data.name),
        escapeCsvValue(data.slug),
        escapeCsvValue(data.description),
        escapeCsvValue(data.help_text),
        escapeCsvValue(data.input_format),
        escapeCsvValue(data.output_format),
        escapeCsvValue(data.dependent_task_slug),
        escapeCsvValue(data.host || ""),
        escapeCsvValue(data.bulk_input),
        escapeCsvValue(data.input_http_method),
        escapeCsvValue(data.api_endpoint),
        escapeCsvValue(data.api_timeout_in_ms),
        escapeCsvValue(data.response_type || data.responseType || ""),
        escapeCsvValue(data.is_json_input_needed),
        escapeCsvValue(data.task_type || ""),
        escapeCsvValue(data.is_active),
        escapeCsvValue(data.is_optional),
        escapeCsvValue(data.eta),
        escapeCsvValue(data.service_id),
        escapeCsvValue(data.email_list),
        escapeCsvValue(data.delay_in_ms !== undefined ? BigInt(data.delay_in_ms) : BigInt(0)),
        escapeCsvValue(data.master_task_slug || ""),
        escapeCsvValue(data.action || ""),
      ];
    });

    // Combine headers and rows into CSV content
    const csvContent = [
      csvHeaders.join(","), // Add headers
      ...csvRows.map(row => row.join(",")) // Add rows
    ].join("\n");


    // Create a Blob for the CSV file
    const csvBlob = new Blob([csvContent], { type: "text/csv" });

    // Generate a URL for the CSV file
    const csvUrl = URL.createObjectURL(csvBlob);
    console.log("CSV Download URL:", csvUrl); // Print the URL to the console

    // Optionally, trigger a download
    const link = document.createElement("a");
    link.href = csvUrl;
    link.setAttribute("download", "task_nodes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Prepare FormData
    const formData = new FormData();
    formData.append("process_template", JSON.stringify(processTemplate));
    formData.append("task_templates", csvBlob, "task_nodes.csv");
    formData.append("owner_group_id", "518,626,767,967,969");



    // console.log(formData.get("process_template"));
    // console.log(formData.get("task_templates"));

    try {
      // Make the API call
      const response = await axios.post("http://localhost:8011/bb2admin/v2/process-and-task-template/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "bb-decoded-uid": localStorage.getItem("bb-decoded-uid"),
        },
      });

      alert("Template saved successfully!");
      console.log("Response:", response.data);
    } catch (error) {
      console.error("Error saving template:", error);
      showError(
        `${error.response?.data?.[0]?.slug || "Unknown"}<br/>${error.response?.data?.[0]?.reason || "Unknown error"}`
      );
    }


    // setNodes(updatedNodes);
    // setEdges(updatedEdges);

    // saveTemplate(reactFlowInstance.current).then(() => {
    //   setHasSaved(true);
    // });;
    setIsLoadedTemplate(false);
    setHasTemplateChanges(false);
    setRightSidebarOpen(false);
  };

  const handleLoadTemplate = (template) => {
    if (!reactFlowInstance.current) return;
    loadTemplate(reactFlowInstance.current, template);
    // Save initial positions
    const loadedNodes = reactFlowInstance.current.getNodes();
    const positions = {};
    loadedNodes.forEach(node => {
      positions[node.id] = { ...node.position };
    });
    setInitialNodePositions(positions);

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
    if (nodes.length === 0) return; // No action if no nodes

    // Show the confirmation modal
    setShowConfirm(true);
  }, [nodes.length]);

  const confirmClear = () => {
    setNodes([]);
    setEdges([]);
    setIsLoadedTemplate(false);
    setHasTemplateChanges(false);
    setShowConfirm(false);  // Close the confirmation modal
  };

  const cancelClear = () => {
    setShowConfirm(false);  // Close the confirmation modal without action
  };


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

    // console.log(nodeData);

    setNodes(nds =>
      nds.map(node => (
        node.id === selectedNode.id
          ? {
            ...node,
            type: nodeData.type,
            isFromTemplate: nodeData.isFromTemplate || false,
            data: {
              ...node.data,
              ...nodeData
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

  const fetchProcessTemplate = async (id) => {
    try {
      const response = await axios.get(`http://localhost:8011/bb2admin/v2/process-template/${id}`,
        {
          headers: { 'bb-decoded-uid': localStorage.getItem("bb-decoded-uid") }
        }
      );
      setIsDraggingProcessTemplate(false);
      console.log(response);
      return response.data;

    } catch (error) {
      console.log("error in fetchProcessTemplate", error);
    }
  }

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(async (event) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    const templateData = event.dataTransfer.getData('application/reactflow-template');
    // console.log(templateData);

    if (templateData) {
      try {
        const data = JSON.parse(templateData);
        console.log(data.type);

        if (data.type === 'flow' && nodes.length === 0) {
          setIsLoadedTemplate(true);
          setHasTemplateChanges(false);
          // console.log(data);

          setIsDraggingProcessTemplate(true);
          const response = await fetchProcessTemplate(data.template.id);

          const nodeData = response.task_templates;
          console.log(nodeData);
          const childParentMapping = response.child_parent_mappings;

          // creating NODES

          const processNode = {
            id: `process-${data.template.id}`,
            type: 'process',
            position: {
              x: event.clientX - event.target.getBoundingClientRect().left,
              y: event.clientY - event.target.getBoundingClientRect().top,
            },
            data: {
              ...data.template
            }
          };

          // Calculate positions for task nodes in a grid layout
          const gridSpacing = 300; // Spacing between nodes
          const maxNodesPerRow = 5; // Maximum number of nodes per row
          const totalTaskNodes = nodeData.length; // Total number of task nodes

          // Calculate the width of a row based on the number of nodes in the row
          const rowWidth = Math.min(totalTaskNodes, maxNodesPerRow) * gridSpacing;

          // Center the task nodes below the process node
          const startX = processNode.position.x - rowWidth / 2 + gridSpacing / 2; // Center the row horizontally
          const startY = processNode.position.y + 300; // Start position for task nodes below the process node     
          const taskNodes = nodeData.map((task, index) => ({
            id: `task-${task.id}`,
            type: 'task',
            position: {
              x: startX + (index % maxNodesPerRow) * gridSpacing, // Arrange in rows of `maxNodesPerRow`
              y: startY + Math.floor(index / maxNodesPerRow) * gridSpacing, // Move to the next row after `maxNodesPerRow` nodes
            },
            data: {
              ...task,
              input_format: typeof task.input_format === 'object' ? JSON.stringify(task.input_format) : task.input_format,
              // header: typeof task.header === 'object' ? JSON.stringify(task.header) : task.header,
              output_format: typeof task.output_format === 'object' ? JSON.stringify(task.output_format) : task.output_format,
              eta: typeof task.eta === 'object' ? JSON.stringify(task.eta) : task.eta,
            },
          }));


          const newNodes = [processNode, ...taskNodes];

          newNodes.map((node) => {
            if (node.type === 'task') {
              const nodeId = node.id.replace('task-', '');
              const dependentTaskSlugIds = childParentMapping[nodeId] || [];
              const dependentTaskSlugs = dependentTaskSlugIds.map((id) => {
                const taskNode = newNodes.find((n) => n.id === `task-${id}`);
                return taskNode ? taskNode.data.slug : null;
              });

              console.log(dependentTaskSlugs);

              node.data.dependent_task_slug = dependentTaskSlugs.join(",");
            }
          });


          setNodes(newNodes);

          const positions = {};
          newNodes.forEach(node => {
            positions[node.id] = { ...node.position };
          });
          setInitialNodePositions(positions);


          // Creating EDGES
          const newEdges = [];
          Object.keys(childParentMapping).map((key) => {
            childParentMapping[key].map((childId) => {
              if (childId === 0) {
                newEdges.push({
                  id: `edge-${processNode.id}-${key}`,
                  source: processNode.id,
                  target: `task-${key}`,
                });
              } else {
                newEdges.push({
                  id: `edge-${childId}-${key}`,
                  source: `task-${childId}`,
                  target: `task-${key}`
                });
              }
            });
          });

          setEdges((eds) => [...eds, ...newEdges]);

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
            isFromTemplate: data.isFromTemplate,
            data: {
              ...data.template,
              master_task_slug: data.template.slug,
            }
          };
          setNodes((nds) => nds.concat(newNode));
        } else if (data.type === 'task') {
          console.log(data);
          setHasTemplateChanges(true);
          const position = {
            x: event.clientX - event.target.getBoundingClientRect().left,
            y: event.clientY - event.target.getBoundingClientRect().top,
          };

          const newNode = {
            id: `task-${Date.now()}`,
            type: 'task',
            position,
            data: {
              ...data.template,
              master_task_slug: data.master_task_slug || "",
            }
          };
          setNodes((nds) => nds.concat(newNode));
        }
        return;
      } catch (error) {
        console.error('Error parsing template data:', error);
      }
    } else if (type) {
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
    // const fetchTaskTemplates = async () => {
    //   try {
    //     const response = await fetch("http://localhost:8080/tasks", {
    //       method: "GET",
    //     });
    //     const resp = await response.json();

    //     const tempArray = resp.map(template => ({
    //       id: template.id,
    //       type: 'master',
    //       timestamp: new Date().toISOString(),
    //       data: {
    //         ...template,
    //         label: template.name || 'task'
    //       },
    //       // For testing, attach the same API response as child tasks
    //       childTasks: resp.map(childItem => ({
    //         id: `child-${childItem.id}`,
    //         type: 'childTask',
    //         name: childItem.name,
    //         data: {
    //           ...childItem,
    //           slug: childItem.name
    //         }
    //       }))
    //     }));

    //     setTaskTemplates(tempArray);
    //   } catch (error) {
    //     console.log(error);
    //   }
    // };

    // fetchTaskTemplates();
  }, []);

  // Compute whether there's a process node for the save button
  const hasProcessNode = nodes.some(node => node.type === 'process');
  const isSaveEnabled = hasProcessNode && (!isLoadedTemplate || hasTemplateChanges);



  return (
    <div className="container">
      <ReactFlowProvider>
        <div ref={reactFlowWrapper} className="container">
          <div className="flow-container">
            {isDraggingProcessTemplate && (
              <div
                style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(255,255,255,0.5)',
                  zIndex: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CircularProgress size={80} />
              </div>
            )}
            <ReactFlow
              nodes={nodes}
              edges={selectedNodeId ? highlightedEdges : edges}
              onInit={onInit}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              nodeTypes={nodeTypes}
              onDragOver={onDragOver}
              onDrop={onDrop}
              fitView
              onPaneClick={() => {
                setSelectedNode(null);
                setSelectedNodeId(null);
              }}
            >
              <Background />
              <Controls />
              <MiniMap />
              <NodeDropdown />
              <Button
                variant="contained"
                startIcon={<RestoreIcon style={{ fontSize: 16 }} />}
                onClick={() => {
                  setNodes(nds =>
                    nds.map(node => ({
                      ...node,
                      position: initialNodePositions[node.id] || node.position
                    }))
                  );
                }}
                disabled={Object.keys(initialNodePositions).length === 0}
                sx={{
                  position: 'absolute',
                  top: '20px',
                  right: '375px',
                  background: '#500472',
                  fontWeight: 'bold',
                  cursor: Object.keys(initialNodePositions).length > 0 ? 'pointer' : 'not-allowed',
                  zIndex: 5,
                }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={<DeleteSweepIcon style={{ fontSize: 16 }} />}
                onClick={handleClearCanvas}
                disabled={nodes.length === 0}
                sx={{
                  position: 'absolute',
                  top: '20px',
                  right: '200px',
                  background: '#500472',
                  fontWeight: 'bold',
                  cursor: nodes.length > 0 ? 'pointer' : 'not-allowed',
                  alignItems: 'center',
                  zIndex: 5,
                }}
              >
                Clear Canvas
              </Button>
              <ConfirmModal
                isOpen={showConfirm}
                title="Confirm"
                message="Are you sure you want to clear the canvas? All unsaved changes will be lost."
                onConfirm={confirmClear}
                onCancel={cancelClear}
                confirmText="Clear"
                cancelText="Cancel"
              />
              <Button
                variant="contained"
                startIcon={<SaveIcon style={{ fontSize: 16 }} />}
                onClick={handleSaveTemplate}
                disabled={!hasProcessNode || (isLoadedTemplate && !hasTemplateChanges) || (hasSaved && !hasTemplateChanges)}
                sx={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: '#500472',
                  fontWeight: 'bold',
                  cursor: (hasProcessNode && (!isLoadedTemplate || hasTemplateChanges) && (!hasSaved || hasTemplateChanges)) ? 'pointer' : 'not-allowed',
                  zIndex: 5,

                }}
              >
                Save Template
              </Button>
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

          <div className={`sidebar ${rightSidebarOpen ? '' : 'sidebar-collapsed'}`}>
            {rightSidebarOpen && (
              <TemplatesSidebar
                templates={templates}
                taskTemplates={taskTemplates}
                onDeleteTemplate={deleteTemplate}
                onDeleteTaskTemplate={handleDeleteTaskTemplate}
                existingNodes={nodes}
                onLoadTemplate={handleLoadTemplate}
                setIsDraggingProcessTemplate={setIsDraggingProcessTemplate}

              />
            )}
          </div>
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className={`toggle-button ${rightSidebarOpen ? 'toggle-left' : 'toggle-right'}`}
          >
            {rightSidebarOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        </div>
      </ReactFlowProvider>
    </div>
  );
}

export default App;