import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function ContinueEditConfirmationDialog({ open, handleClose, onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3, // Smooth rounded corners matching the visual theme
          p: 1,
          maxWidth: '440px', // Matches identical dimensions of the confirmation stack
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle sx={{ m: 0, p: 1.5, pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body1" sx={{ fontWeight: '600', color: '#111' }}>
            Continue Edit Confirmation
          </Typography>
          <IconButton onClick={handleClose} aria-label="close" size="small">
            <CloseIcon sx={{ color: '#000', fontSize: '1.1rem' }} />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Elegant line divider under header */}
      <Box sx={{ borderBottom: '1px solid #ccc', mx: 1.5, mb: 2 }} />

      {/* Dialog Body Content */}
      <DialogContent sx={{ p: 2, pt: 0, pb: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: '500', mb: 1.5, color: '#000' }}>
          Are you sure you to <strong>Continue Edit</strong> ?
        </Typography>
        <Typography variant="body2" sx={{ color: '#333', lineHeight: 1.4, px: 2 }}>
          This action will save the current changes & continue
          edit on next carrier information
        </Typography>
      </DialogContent>

      {/* Dialog Footer Actions */}
      <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            textTransform: 'none',
            color: '#000',
            borderColor: '#666',
            borderRadius: 1.5,
            width: '110px',
            py: 0.5,
            fontWeight: '500',
            fontSize: '0.9rem',
            '&:hover': {
              borderColor: '#000',
              backgroundColor: 'rgba(0,0,0,0.04)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            handleClose();
          }}
          variant="contained"
          sx={{
            textTransform: 'none',
            backgroundColor: '#a61c24', // Standard application theme red
            color: '#fff',
            borderRadius: 1.5,
            width: '110px',
            py: 0.5,
            fontWeight: '500',
            fontSize: '0.9rem',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#82141a',
              boxShadow: 'none',
            },
          }}
        >
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
