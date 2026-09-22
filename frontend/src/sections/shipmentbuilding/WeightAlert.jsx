import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  IconButton, 
  Typography, 
  Box 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

export default function WeightAlert({ open, onClose, title = "Alert", message }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          padding: '8px',
          boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      {/* Dynamic Header Title */}
      <DialogTitle 
        sx={{ 
          m: 0, 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #E5E7EB',
          color: '#1F2937'
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: '#9CA3AF',
            '&:hover': { color: '#4B5563' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Dynamic Content Body */}
      <DialogContent sx={{ px: 3, py: 4 }}>
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          textAlign="center"
        >
          {/* Warning Icon */}
          <WarningAmberRoundedIcon 
            sx={{ 
              fontSize: 74, 
              color: '#000000', 
              mb: 2 
            }} 
          />
          
          {/* Dynamic Message Box */}
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#1F2937', 
              fontWeight: 500,
              maxWidth: '320px',
              lineHeight: 1.5
            }}
          >
            {message}
          </Typography>
        </Box>
      </DialogContent>

      {/* Footer OK Action */}
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          disableElevation
          sx={{
            backgroundColor: '#9B1C1C',
            color: '#FFFFFF',
            fontWeight: 600,
            textTransform: 'none',
            px: 5,
            py: 1,
            borderRadius: '6px',
            '&:hover': {
              backgroundColor: '#811717',
            },
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
