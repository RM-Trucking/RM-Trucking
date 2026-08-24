import React ,{useEffect} from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper
} from '@mui/material';

export default function ReferenceDialog({ open, fromSection, onClose, control, setValue, getValues }) {
  // Pads numbers to matches your 01, 02 format styling
  const formatSNo = (num) => String(num).padStart(2, '0');

  // Triggers localized validation check on submit click block
  const onAddToPrint = () => {
    // Filters and gets row entries checked by user
    const selectedRows = getValues('referenceTableRows')?.filter(row => row.isChecked);
    console.log('Selected Reference Rows for Print:', selectedRows);
    if (fromSection === 'pickup') {
      setValue('printablePickupReferenceRows', selectedRows, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (fromSection === 'linehaul') {
      setValue('printableLinehaulReferenceRows', selectedRows, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (fromSection === 'delivery') {
      setValue('printableDeliveryReferenceRows', selectedRows, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    onClose();
  };
  const onCancel = () => {
    // 1. Get the absolute latest row data directly from form state
    const currentTableRows = getValues('referenceTableRows') || [];

    // 2. Retrieve what was last successfully saved for this specific section
    let savedRows = [];
    if (fromSection === 'pickup') savedRows = getValues('printablePickupReferenceRows') || [];
    if (fromSection === 'linehaul') savedRows = getValues('printableLinehaulReferenceRows') || [];
    if (fromSection === 'delivery') savedRows = getValues('printableDeliveryReferenceRows') || [];

    // 3. Create a unique lookup map of reference IDs that are allowed to stay checked
    const savedIds = new Set(savedRows.map(row => row.referenceNumberId || row.id));

    // 4. Safely sync the checkboxes back to match only what was saved
    currentTableRows.forEach((row, index) => {
      // If this row's ID exists in our saved list, it should be true. Otherwise, false.
      const shouldBeChecked = savedIds.has(row.referenceNumberId || row.id);

      setValue(`referenceTableRows.${index}.isChecked`, shouldBeChecked, {
        shouldDirty: false,
        shouldValidate: false
      });
    });

    // 5. Dismiss the modal window
    onClose();
  };

  useEffect(() => {
    if (open) {
      // 1. Get the master table rows data and the previously saved values for this active section
      const masterRows = getValues('referenceTableRows') || [];
      let savedSectionRows = [];

      if (fromSection === 'pickup') savedSectionRows = getValues('printablePickupReferenceRows') || [];
      if (fromSection === 'linehaul') savedSectionRows = getValues('printableLinehaulReferenceRows') || [];
      if (fromSection === 'delivery') savedSectionRows = getValues('printableDeliveryReferenceRows') || [];

      // 2. Create a fast lookup Set of saved unique IDs
      const savedIds = new Set(savedSectionRows.map(row => row.referenceNumberId || row.id));

      // 3. Map through the rows and assign true/false strictly based on this section's history
      masterRows.forEach((row, index) => {
        const isCurrentlyChecked = savedIds.has(row.referenceNumberId || row.id);
        setValue(`referenceTableRows.${index}.isChecked`, isCurrentlyChecked, {
          shouldDirty: false,
          shouldValidate: false
        });
      });
    }
  }, [open, fromSection, setValue, getValues]);



  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          maxWidth: '820px', // Restricts layout constraints to match image aspect ratio
        },
      }}
    >
      {/* Dialog Header Actions container */}
      <DialogTitle sx={{ m: 0, p: 2, pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: '600', fontSize: '1.05rem', color: '#111' }}>
            {fromSection
              ? fromSection.charAt(0).toUpperCase() + fromSection.slice(1)
              : ''
            }- Reference No
          </Typography>

          <Box display="flex" gap={1.5}>
            <Button
              onClick={() => {
                onCancel();
              }}
              variant="outlined"
              size="small"
              sx={{
                textTransform: 'none',
                color: '#333',
                borderColor: '#ccc',
                borderRadius: 1.5,
                px: 2.5,
                fontWeight: '500',
                '&:hover': { borderColor: '#999', backgroundColor: 'rgba(0,0,0,0.02)' }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onAddToPrint}
              variant="contained"
              size="small"
              sx={{
                textTransform: 'none',
                backgroundColor: '#a61c24', // Standard application red branding style
                color: '#fff',
                borderRadius: 1.5,
                px: 2.5,
                fontWeight: '500',
                boxShadow: 'none',
                '&:hover': { backgroundColor: '#82141a', boxShadow: 'none' }
              }}
            >
              Add to print
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      {/* Elegant line divider under header */}
      <Box sx={{ borderBottom: '1px solid #e0e0e0', mx: 2, mb: 2 }} />

      {/* Dialog Body Content containing Table Grid */}
      <DialogContent sx={{ p: 2, pt: 0, pb: 3 }}>
        <TableContainer component={Paper} variant="outlined" sx={{ border: '1px solid #e5e5e5', borderRadius: 2, boxShadow: 'none', backgroundColor: '#fcfcfc' }}>
          <Table size="small" aria-label="reference numbers table">
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell padding="checkbox" sx={{ width: '50px', borderBottom: '1px solid #e5e5e5' }} />
                <TableCell sx={{ fontWeight: '600', color: '#666', fontSize: '0.8rem', py: 1, borderBottom: '1px solid #e5e5e5' }}>
                  SNo
                </TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#666', fontSize: '0.8rem', py: 1, borderBottom: '1px solid #e5e5e5' }}>
                  Type
                </TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#666', fontSize: '0.8rem', py: 1, borderBottom: '1px solid #e5e5e5' }}>
                  Reference No
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ backgroundColor: '#fff' }}>
              {getValues('referenceTableRows').map((field, index) => (
                <TableRow key={field.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  {/* Managed Checkbox Column Controller */}
                  <TableCell padding="checkbox" sx={{ py: 0.5 }}>
                    <Controller
                      name={`referenceTableRows.${index}.isChecked`}
                      control={control}
                      defaultValue={false}
                      render={({ field: checkboxField }) => (
                        <Checkbox
                          {...checkboxField}
                          // Read the absolute freshest value directly from form state
                          checked={!!getValues(`referenceTableRows.${index}.isChecked`)}
                          onChange={(e) => {
                            const isCheckedValue = e.target.checked;

                            // 1. Tell the controller field wrapper that the state changed
                            checkboxField.onChange(isCheckedValue);

                            // 2. Explicitly force react-hook-form to register this index in its core state
                            setValue(`referenceTableRows.${index}.isChecked`, isCheckedValue, {
                              shouldDirty: true,
                              shouldValidate: true
                            });
                          }}
                          size="small"
                          sx={{
                            color: 'rgba(0, 25, 76, 1)',
                            '&.Mui-checked': { color: 'rgba(0, 25, 76, 1)' }
                          }}
                        />
                      )}
                    />

                  </TableCell>

                  {/* Serial Number Column */}
                  <TableCell sx={{ fontSize: '0.85rem', color: '#333' }}>
                    {formatSNo(index + 1)}
                  </TableCell>

                  {/* Reference Type Column */}
                  <TableCell sx={{ fontSize: '0.85rem', color: '#333' }}>
                    {field.referenceType || 'N/A'}
                  </TableCell>

                  {/* Reference Number Column */}
                  <TableCell sx={{ fontSize: '0.85rem', color: '#333' }}>
                    {field.referenceNumber || ''}
                  </TableCell>
                </TableRow>
              ))}

              {/* Fallback empty view fallback */}
              {getValues('referenceTableRows')?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#999', fontSize: '0.85rem' }}>
                    No reference numbers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
}
