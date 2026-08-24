import React, { useState } from 'react';

import { useForm, Controller, useFieldArray, useWatch, set, get, useFormContext } from 'react-hook-form';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    IconButton,
    Button,
    TextField,
    Badge,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined';

export default function BadFreightDialog({ open,
    huIdx,
    handleClose,
    control,
    setValue,
    getValues, trigger }) {

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3, // Matches the smooth rounded corners of the image
                    p: 1,
                },
            }}
        >
            {/* Dialog Header */}
            <DialogTitle sx={{ m: 0, p: 2, pb: 1, fontWeight: 'bold' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" sx={{ fontWeight: '600', color: '#111' }}>
                        Bad Freight Condition
                    </Typography>
                    <IconButton onClick={handleClose} aria-label="close" size="small">
                        <CloseIcon sx={{ color: '#000' }} />
                    </IconButton>
                </Box>
            </DialogTitle>

            {/* Divider line right under the header */}
            <Box sx={{ borderBottom: '1px solid #ccc', mx: 2, mb: 2 }} />

            {/* Dialog Body Content */}
            <DialogContent sx={{ p: 2, pt: 0, overflowY: 'visible' }}>
                {/* Floating Icons Container on the right */}
                {/* <Box display="flex" justifyContent="flex-end" gap={1.5} sx={{ mb: -1 }}>
                    <IconButton size="small" sx={{ color: '#222' }}>
                        <AddPhotoAlternateOutlinedIcon />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#222' }}>
                        <Badge
                            badgeContent={5}
                            color="primary"
                            sx={{
                                '& .MuiBadge-badge': {
                                    backgroundColor: '#0d3c61', // Matches the deep blue badge color
                                    fontSize: '0.65rem',
                                    height: 16,
                                    minWidth: 16
                                }
                            }}
                        >
                            <CollectionsOutlinedIcon />
                        </Badge>
                    </IconButton>
                </Box> */}

                {/* Custom Borderless Standard Input */}
                <Controller
                    name={`handlingUnits.${huIdx}.badFreightCondition`}
                    control={control}
                    defaultValue=""
                    rules={{ required: 'Freight Condition is required' }} // Adds validation rule
                    render={({ field, fieldState: { error } }) => (
                        <TextField
                            {...field}
                            label={
                                <span>
                                    Freight Condition <span style={{ color: '#d32f2f' }}>*</span>
                                </span>
                            }
                            variant="standard"
                            fullWidth
                            error={!!error}
                            helperText={error ? error.message : ''} // Displays 'Freight Condition is required'
                            InputLabelProps={{
                                shrink: true,
                                sx: {
                                    color: '#999',
                                    fontSize: '1rem',
                                    '&.Mui-focused': { color: '#999' },
                                },
                            }}
                            InputProps={{
                                disableUnderline: false,
                                sx: {
                                    fontSize: '0.95rem',
                                    color: '#222',
                                    py: 0.5,
                                    '&:before': { borderBottom: '1px solid #999' },
                                    '&:hover:not(.Mui-disabled):before': { borderBottom: '1px solid #999' },
                                    '&:after': { borderBottom: '2px solid #0d3c61' },
                                },
                            }}
                        />
                    )}
                />


            </DialogContent>

            {/* Dialog Footer Actions */}
            <DialogActions sx={{ justifyContent: 'center', gap: 2, p: 2, pb: 3 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    sx={{
                        textTransform: 'none',
                        color: '#000',
                        borderColor: '#555',
                        borderRadius: 2,
                        px: 5,
                        fontWeight: '500',
                        fontSize: '0.95rem',
                        '&:hover': {
                            borderColor: '#000',
                            backgroundColor: 'rgba(0,0,0,0.04)',
                        },
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={async () => {
                        // 1. Manually trigger validation for this specific handling unit field
                        const isValid = await trigger(`handlingUnits.${huIdx}.badFreightCondition`);

                        // 2. If it passes validation, proceed with closing or saving
                        if (isValid) {
                            /* Handle your custom submit logic here if needed */
                            handleClose();
                        }
                        // If it's invalid, React Hook Form will automatically show the error message below the input
                    }}
                    variant="contained"
                    sx={{
                        textTransform: 'none',
                        backgroundColor: '#a61c24',
                        color: '#fff',
                        borderRadius: 2,
                        px: 5,
                        fontWeight: '500',
                        fontSize: '0.95rem',
                        boxShadow: 'none',
                        '&:hover': {
                            backgroundColor: '#82141a',
                            boxShadow: 'none',
                        },
                    }}
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
}
