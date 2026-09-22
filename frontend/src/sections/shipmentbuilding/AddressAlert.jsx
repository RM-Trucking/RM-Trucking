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

export default function AddressAlert({ open, onClose }) {
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
      {/* Title Header with Close Button */}
      <DialogTitle 
        sx={{ 
          m: 0, 
          p: 2, 
          display: 'flex', 
          justifyContent: 'between', 
          alignItems: 'center',
          borderBottom: '1px solid #E5E7EB',
          fontWeight: 600,
          color: '#1F2937'
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Alert
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

      {/* Warning Content Area */}
      <DialogContent sx={{ px: 3, py: 4 }}>
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          textAlign="center"
        >
          {/* Custom Large Triangle Warning Icon */}
          <WarningAmberRoundedIcon 
            sx={{ 
              fontSize: 74, 
              color: '#000000', 
              mb: 2 
            }} 
          />
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#1F2937', 
              fontWeight: 500,
              maxWidth: '280px',
              lineHeight: 1.5
            }}
          >
            Cannot consolidate shipments with different ship-from addresses
          </Typography>
        </Box>
      </DialogContent>

      {/* Styled OK Button Footer */}
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          disableElevation
          sx={{
            backgroundColor: '#9B1C1C', // Exact dark red color from the image
            color: '#FFFFFF',
            fontWeight: 600,
            textTransform: 'none', // Keeps "OK" capitalized normally instead of ALL CAPS
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
