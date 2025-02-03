import React from 'react';

const styles = {
  container: {
    padding: '20px',
    height: '100%',
    background: 'white',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
  },
  nodeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  draggableNode: {
    padding: '10px',
    borderRadius: '4px',
    cursor: 'move',
    fontSize: '14px',
    textAlign: 'center',
    border: '2px solid',
    background: 'white',
    userSelect: 'none',
  },
  process: {
    borderColor: '#1a73e8',
  },
  task: {
    borderColor: '#4caf50',
  },
};

export const Sidebar = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Nodes</h2>
      <div style={styles.nodeList}>
        <div
          style={{ ...styles.draggableNode, ...styles.process }}
          onDragStart={(e) => onDragStart(e, 'process')}
          draggable
        >
          Process
        </div>
        <div
          style={{ ...styles.draggableNode, ...styles.task }}
          onDragStart={(e) => onDragStart(e, 'task')}
          draggable
        >
          Task
        </div>
      </div>
    </div>
  );
};