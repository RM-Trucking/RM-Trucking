import { Box, Typography } from '@mui/material';
import NoRowsDisplay from '../../assets/NoRowsDisplay.png';

export default function CustomNoRowsOverlay (){
  return (
    // Parent Box: Acts as the positioning context (relative parent)
    <Box sx={{ 
        width : '100%',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
    }}>
      
      {/* Image Element: Now a child within the relative container */}
      <img
        src={NoRowsDisplay}
        alt="No data available"
        style={{ 
           width: '200px', 
            height: '200px', 
            transform: 'rotate(-180deg) translateZ(0)',
            transform: 'scaleX(-1)', 
            opacity: '20%',
            display: 'block',
            marginLeft : '10%',
            marginTop: '5%'
        }}
      />
      
      {/* Text Overlay: Positioned absolutely over the image */}
      <Box
        sx={{
          transform: 'translate(-105%, -50%)', // Pulls the element back by half its own size to perfectly center it
          textAlign: 'center',
          color: '#a22', 
          width : '105px',
          mt : '5%',
        }}
      >
        <Typography variant="body2">
          Add your station to proceed.
        </Typography>
      </Box>
    </Box>
  );
};
