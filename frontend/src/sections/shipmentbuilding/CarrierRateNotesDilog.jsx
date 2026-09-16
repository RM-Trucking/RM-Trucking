import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  TableSortLabel, IconButton
} from '@mui/material';
import { Controller } from 'react-hook-form';
import CloseIcon from '@mui/icons-material/Close';

export default function CarrierRateNotesDilog({ sectionName, open, handleClose, existingNotes = [], setValue, getValues, control, customerRateNotesArr,
  appendCustomerRateNotesArr, currentCustomerNoteText }) {

  const handleAddNotes = () => {
    const currentText = (sectionName.toLowerCase().includes('pickup')) ? getValues('carrierRates.pickUp.rateNotes') : (sectionName.toLowerCase().includes('line haul')) ? getValues('carrierRates.lineHaul.rateNotes') : getValues('carrierRates.delivery.rateNotes');

    // Verify the field isn't empty or just spaces
    if (!currentText || !currentText.trim()) return;

    // Format today's date to match the UI: MM/DD/YYYY HH:MM
    const now = new Date();
    const formattedTime = now.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '');

    // Append new log entry to your state array
    appendCustomerRateNotesArr({
      time: formattedTime,
      user: 'Current User', // Replace with your dynamic user session context variable if available
      note: currentText.trim()
    });

    // Clear out the input field text box after adding
    if (sectionName.toLowerCase().includes('pickup')) {
      setValue('carrierRates.pickUp.rateNotes', '');
    }
    if (sectionName.toLowerCase().includes('line haul')) {
      setValue('carrierRates.lineHaul.rateNotes', '');
    }
    if (sectionName.toLowerCase().includes('delivery')) {
      setValue('carrierRates.delivery.rateNotes', '');
    }

  };


  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle sx={{ p: 1, pb: 1.5 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', fontSize: '1rem' }}>
            {(sectionName.toLowerCase().includes('pickup')) ? 'Pickup' : (sectionName.toLowerCase().includes('line haul')) ? 'Line Haul' : 'Delivery'} Rate Notes Section
          </Typography>
          <Box>
            <IconButton onClick={handleClose} aria-label="close" size="small" sx={{ ml: 2 }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

      </DialogTitle>

      {/* Styled Thin Divider line under title */}
      <Box sx={{ borderBottom: '1px solid #e0e0e0', mb: 3 }} />

      <DialogContent sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Input Label with red asterisk */}
        <Box>
          {/* Input field matching standard underline styling */}
          <Controller
            name={(sectionName.toLowerCase().includes('pickup')) ? 'carrierRates.pickUp.rateNotes' : (sectionName.toLowerCase().includes('line haul')) ? 'carrierRates.lineHaul.rateNotes' : 'carrierRates.delivery.rateNotes'}
            control={control}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Box>
                {/* Input Label with red asterisk */}
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#333', display: 'flex', gap: 0.5 }}>
                  {(sectionName.toLowerCase().includes('pickup')) ? 'Pickup' : (sectionName.toLowerCase().includes('line haul')) ? 'Line Haul' : 'Delivery'} Rate Notes <Box component="span" sx={{ color: 'red' }}>*</Box>
                </Typography>

                {/* Converted Controlled Field */}
                <TextField
                  {...error && { error: true, helperText: error.message }} // Optional error handling
                  fullWidth
                  variant="standard"
                  value={value || ''} // Fallback to safe empty string
                  onChange={onChange}
                  InputProps={{
                    disableUnderline: false,
                    sx: {
                      fontSize: '0.875rem',
                      color: '#222',
                      pb: 0.5,
                      '&:before': { borderBottomColor: '#b0b0b0' },
                      '&:after': { borderBottomColor: '#a61c1c' },
                    }
                  }}
                />
              </Box>
            )}
          />
        </Box>

        {/* Add Notes Action Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1, mb: 2 }}>
          <Button
            onClick={handleAddNotes}
            disabled={!currentCustomerNoteText || !currentCustomerNoteText.trim()} // Prevents blank submissions
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: '4px',
              backgroundColor: '#a61c1c',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 500,
              px: 2,
              py: 0.5,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#821414',
                boxShadow: 'none',
              },
              '&:disabled': {
                backgroundColor: '#d3d3d3',
                color: '#9e9e9e'
              }
            }}
          >
            Add Notes
          </Button>
        </Box>

        {/* Historical Logs Table Container */}
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: '6px', borderColor: '#e0e0e0', boxShadow: 'none' }}
        >
          <Table size="small" aria-label="rate notes history table">
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#444', py: 1.5, width: '25%' }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#444', py: 1.5, width: '15%' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#444', py: 1.5 }}>Rate Notes</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {customerRateNotesArr.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#888', fontSize: '0.85rem' }}>
                    No historical notes found.
                  </TableCell>
                </TableRow>
              ) : (
                // Map directly through React Hook Form's trackable array fields
                customerRateNotesArr.map((row, index) => (
                  <TableRow
                    key={row.id} // useFieldArray fields always contain a unique auto-generated 'id' key
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell sx={{ fontSize: '0.85rem', color: '#222', py: 1.5 }}>
                      {row.time}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: '#222', py: 1.5 }}>
                      {row.user}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: '#444', py: 1.5 }}>
                      {row.note}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
}
