import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const Sidebar = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{
      padding: '20px',
      height: '100%',
      background: 'white',
    }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '20px',
        color: '#333',
      }}>Nodes</h2>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
      }}>
        <div
          style={{
            padding: '10px',
            borderRadius: '4px',
            cursor: 'move',
            fontSize: '14px',
            textAlign: 'center',
            border: '2px solid',
            background: '#500472',
            borderColor: '#500472',
            color: 'white',
            userSelect: 'none',
          }}
          onDragStart={(e) => onDragStart(e, 'process')}
          draggable
        >
          Process
        </div>
        <div
          style={{
            padding: '10px',
            borderRadius: '4px',
            cursor: 'move',
            fontSize: '14px',
            textAlign: 'center',
            border: '2px solid',
            background: '#500472',
            borderColor: '#500472',
            color: 'white',
            userSelect: 'none',
          }}
          onDragStart={(e) => onDragStart(e, 'master')}
          draggable
        >
          Master
        </div>
        <div
          style={{
            padding: '10px',
            borderRadius: '4px',
            cursor: 'move',
            fontSize: '14px',
            textAlign: 'center',
            border: '2px solid',
            background: '#500472',
            borderColor: '#500472',
            color: 'white',
            userSelect: 'none',
          }}
          onDragStart={(e) => onDragStart(e, 'task')}
          draggable
        >
          Task
        </div>
      </div>
    </div>
  );
};


const styles = {
  node: {
    padding: '10px 15px',
    borderRadius: '5px',
    fontSize: '14px',
    border: '2px solid',
    minWidth: '150px',
  },
  process: {
    borderColor: '#500472',
    background: '#500472',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  task: {
    borderColor: '#500472',
    background: 'white',
    fontWeight: 'bold',
    color:'black',
    textAlign: 'center',
  },
  master: {
    borderColor: '#500472',
    background: 'white',
    fontWeight: 'bold',
    color:'black',
    textAlign: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  description: {
    fontSize: '12px',
    color: '#666',
  },
  handle: {
    width: '8px',
    height: '8px',
    background: 'grey',
    borderRadius: '50%',
    border: '1px solid white',
  },
};

export const ProcessNode = memo(({ data, type }) => {
  return (
    <div style={{
      ...styles.node,
      ...(type === 'process' ? styles.process : 
         type === 'task' ? styles.task : styles.master),
    }}>
      {type === 'task' && (
        <Handle
          type="target"
          position={Position.Top}
          style={styles.handle}
        />
      )}
      <div style={styles.content}>
        <div style={styles.label}>{data.slug || data.process_slug || type}</div>
        {data.description && (
          <div style={styles.description}>{data.description}</div>
        )}
      </div>
      {(type === 'process' || type === 'task') && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={styles.handle}
        />
      )}
    </div>
  );
});

ProcessNode.displayName = 'ProcessNode';