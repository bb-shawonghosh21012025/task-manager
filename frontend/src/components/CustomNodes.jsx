import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const styles = {
  node: {
    padding: '10px 15px',
    borderRadius: '5px',
    fontSize: '14px',
    background: 'white',
    border: '2px solid',
    minWidth: '150px',
  },
  process: {
    borderColor: '#1a73e8',
  },
  task: {
    borderColor: '#4caf50',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: '12px',
    color: '#666',
  },
  handle: {
    width: '8px',
    height: '8px',
    background: '#1a73e8',
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