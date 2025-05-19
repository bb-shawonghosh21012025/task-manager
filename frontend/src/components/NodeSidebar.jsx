import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Button, IconButton } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CloseIcon from '@mui/icons-material/Close';
import '../App.css';

export const NodeDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      ref={dropdownRef}
      className="dropdown-container"
    >
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="contained"
        className="add-node-button"
        endIcon={isOpen ? <CloseIcon /> : <ArrowDropDownIcon />}
      >
        Add Node
      </Button>

      {isOpen && (
        <div className="dropdown-menu">
          <div
            className="node-item process-node"
            onDragStart={(e) => onDragStart(e, 'process')}
            draggable
          >
            Process Template
          </div>
          <div
            className="node-item process-node"
            onDragStart={(e) => onDragStart(e, 'master')}
            draggable
          >
            Master Template
          </div>
          <div
            className="node-item process-node"
            onDragStart={(e) => onDragStart(e, 'task')}
            draggable
          >
            Task Template
          </div>
        </div>
      )}
    </div>
  );
};

export const Node = memo(({ data, type, selected }) => {
  return (
    <div className={`node ${type}-node${selected && type === 'task' ? ' node-selected' : ''}`}>
      {type === 'task' && (
        <Handle
          type="target"
          position={Position.Top}
          className="handle"
        />
      )}
      <div className="node-content">
        <div className="node-label">{data.slug || data.process_slug || type}</div>
      </div>
      {(type === 'process' || type === 'task') && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="handle"
        />
      )}
    </div>
  );
});