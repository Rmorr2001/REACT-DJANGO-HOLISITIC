// CustomNode.js
import { Handle, useReactFlow } from 'reactflow';
import { Box, Typography } from '@mui/material';

const CustomNode = ({ id, data, selected }) => {
  const { setNodes } = useReactFlow();

  return (
    <Box sx={{
      border: 2,
      borderColor: selected ? '#1976d2' : '#ddd',
      borderRadius: 2,
      p: 2,
      bgcolor: 'background.paper',
      minWidth: 200,
      cursor: 'move',
    }}>
      <Typography variant="subtitle1" onClick={() => data.onSelect({ id, data })}>
        {data.node_name}
      </Typography>
      
      <Handle
        type="source"
        position="bottom"
        style={{ background: '#555', width: 10, height: 10 }}
      />
      <Handle
        type="target"
        position="top"
        style={{ background: '#555', width: 10, height: 10 }}
      />
    </Box>
  );
};

export default CustomNode;