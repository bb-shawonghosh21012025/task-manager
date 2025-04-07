import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

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
  },
  task: {
    borderColor: '#500472',
    background: 'white',
    fontWeight: 'bold',
    color:'black',
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
      ...(type === 'process' ? styles.process : styles.task),
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
      {(
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