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
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
// Import your preferred flat structural accents here:
import InventoryIcon from '@mui/icons-material/Inventory';
import TrolleyIcon from '@mui/icons-material/Trolley';

export default function AddToQueueSubmitDilog({ open, handleClose, handleConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px', // Matches your curved modal edges
            p: 1.5,
            position: 'relative',
          }
        }
      }}
    >
      {/* Header Container */}
      <DialogTitle sx={{ m: 0, p: 1, fontWeight: 'bold', color: '#000', fontSize: '1.1rem' }}>
        Confirmation
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 14,
            color: '#000',
            p: 0.5
          }}
        >
          <CloseIcon sx={{ fontSize: '1.3rem' }} />
        </IconButton>
      </DialogTitle>

      {/* Styled Top Border Divider */}
      <Box sx={{ borderBottom: '1px solid #ccc', mx: 1, mb: 3 }} />

      {/* Main Content Area */}
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

        {/* Custom Visual Vector Anchor matching your truck/handtruck icon */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', mb: 3, color: '#ccc' }}>
          {/* Main flatbed vehicle component wrapper */}
          <LocalShippingIcon sx={{ fontSize: '5.5rem', transform: 'scaleX(-1)' }} />

          {/* Option A: Flat Inventory Box Container */}
          <TrolleyIcon
            sx={{
              fontSize: '2.5rem',
              ml: 1,
              mb: 0.5,
              // Flips horizontally and applies a clean right-leaning slant
              transform: 'scaleX(-1) rotate(-15deg)',
            }}
          />

        </Box>

        {/* Informational Prompt Text */}
        <Typography
          variant="body1"
          sx={{
            color: '#000',
            px: 3,
            lineHeight: 1.4,
            fontWeight: 500,
            fontSize: '0.95rem'
          }}
        >
          Are you sure you to submit the selected shipment. Do you want to continue?
        </Typography>
      </DialogContent>

      {/* Dialog Action Buttons */}
      <DialogActions sx={{ justifyContent: 'center', gap: 3, mt: 4, mb: 1, p: 0 }}>
        {/* Cancel Button */}
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            color: '#000',
            borderColor: '#333',
            textTransform: 'none',
            borderRadius: '8px',
            px: 5,
            py: 0.5,
            fontSize: '0.95rem',
            fontWeight: 600,
            borderWidth: '1px',
            '&:hover': {
              borderColor: '#000',
              bgcolor: '#f5f5f5',
              borderWidth: '1px'
            }
          }}
        >
          Cancel
        </Button>

        {/* Submit Action Button */}
        <Button
          onClick={handleConfirm}
          variant="contained"
          sx={{
            bgcolor: '#a61c1c',
            color: '#fff',
            textTransform: 'none',
            borderRadius: '8px',
            px: 5,
            py: 0.5,
            fontSize: '0.95rem',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#851414',
              boxShadow: 'none'
            }
          }}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
