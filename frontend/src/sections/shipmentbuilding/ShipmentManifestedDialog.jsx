import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RevertConfirmationDialog from './RevertConfirmationDialog';
import NewCarrierBillConfirmationDialog from './NewCarrierBillConfirmationDialog';
import ContinueEditConfirmationDialog from './ContinueEditConfirmationDialog';


export default function ShipmentManifestedDialog({ open, handleClose, }) {
  
  const [subModal, setSubModal] = useState({ type: null, open: false });

  const handleConfirmAction = () => {
    if (subModal.type === 'revert') {
      // Revert to last saved data
    } else if (subModal.type === 'newCarrier') {
      // Generate new payload lines
    } else if (subModal.type === 'continueEdit') {
      // Fire submit / save mutations
    }
    setSubModal({ type: null, open: false });
  };
  const onRevert = () => {
    setSubModal({ type: 'revert', open: true });
  }
  const onSubmitNew = () => {
    setSubModal({ type: 'newCarrier', open: true });
  }
  const onContinueEdit = () => {
    setSubModal({ type: 'continueEdit', open: true });
  }
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3, // Smooth rounded corners
          p: 1,
          maxWidth: '650px', // Restricts max width to match the aspect ratio
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle sx={{ m: 0, p: 2, pb: 1.5 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: '600', color: '#111', fontSize: '1.1rem' }}>
            Shipment already manifested, How would you like to proceed ?
          </Typography>
          <IconButton onClick={handleClose} aria-label="close" size="small">
            <CloseIcon sx={{ color: '#000', fontSize: '1.2rem' }} />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Thin elegant horizontal line matching the image */}
      <Box sx={{ borderBottom: '1px solid #ccc', mx: 2, mb: 3 }} />

      {/* Dialog Body Content */}
      <DialogContent sx={{ p: 2, pt: 0, pb: 4, display: 'flex', flexDirection: 'column', gap: 3.5 }}>

        {/* Row 1: Revert Back */}
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={4}>
          <Typography variant="body2" sx={{ color: '#333', lineHeight: 1.4, maxWidth: '70%' }}>
            This action will discard current changes & restore the last saved data
          </Typography>
          <Button
            onClick={onRevert}
            variant="contained"
            sx={{
              textTransform: 'none',
              backgroundColor: '#a61c24', // Red button background matching your design theme
              color: '#fff',
              borderRadius: 1.5,
              width: '180px',
              py: 1,
              fontWeight: '500',
              fontSize: '0.85rem',
              boxShadow: 'none',
              flexShrink: 0,
              '&:hover': {
                backgroundColor: '#82141a',
                boxShadow: 'none',
              },
            }}
          >
            Revert Back
          </Button>
        </Box>

        {/* Row 2: Submit New Carrier Bill */}
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={4}>
          <Typography variant="body2" sx={{ color: '#333', lineHeight: 1.4, maxWidth: '70%' }}>
            The current carrier bill will be cancelled & a new carrier bill will be generated
          </Typography>
          <Button
            onClick={onSubmitNew}
            variant="contained"
            sx={{
              textTransform: 'none',
              backgroundColor: '#a61c24',
              color: '#fff',
              borderRadius: 1.5,
              width: '180px',
              py: 1,
              fontWeight: '500',
              fontSize: '0.85rem',
              boxShadow: 'none',
              flexShrink: 0,
              '&:hover': {
                backgroundColor: '#82141a',
                boxShadow: 'none',
              },
            }}
          >
            Submit New Carrier Bill
          </Button>
        </Box>

        {/* Row 3: Continue Edit */}
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={4}>
          <Typography variant="body2" sx={{ color: '#333', lineHeight: 1.4, maxWidth: '70%' }}>
            This action will save the current changes & continue edit on next carrier information
          </Typography>
          <Button
            onClick={onContinueEdit}
            variant="contained"
            sx={{
              textTransform: 'none',
              backgroundColor: '#a61c24',
              color: '#fff',
              borderRadius: 1.5,
              width: '180px',
              py: 1,
              fontWeight: '500',
              fontSize: '0.85rem',
              boxShadow: 'none',
              flexShrink: 0,
              '&:hover': {
                backgroundColor: '#82141a',
                boxShadow: 'none',
              },
            }}
          >
            Continue Edit
          </Button>
        </Box>

        <RevertConfirmationDialog
          open={subModal.open && subModal.type === 'revert'}
          handleClose={() => setSubModal({ type: null, open: false })}
          onConfirm={handleConfirmAction}
        />
        <NewCarrierBillConfirmationDialog
          open={subModal.open && subModal.type === 'newCarrier'}
          handleClose={() => setSubModal({ type: null, open: false })}
          onConfirm={handleConfirmAction}
        />
        <ContinueEditConfirmationDialog
          open={subModal.open && subModal.type === 'continueEdit'}
          handleClose={() => setSubModal({ type: null, open: false })}
          onConfirm={handleConfirmAction}
        />

      </DialogContent>
    </Dialog>
  );
}
