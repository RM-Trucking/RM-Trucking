import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Button,
    TextField,
    MenuItem,
} from '@mui/material';
import PrintLabelConfirmationDialog from './PrintLabelConfirmationDialog';

export default function PrintLabelDialog({ open, handleClose, huIdx, totalUnits, totalHU }) {
    const [printer, setPrinter] = useState('CFS 1 (192.168.185.24)');
    const [noOfLabels, setNoOfLabels] = useState(parseInt(totalHU) || 0);
    const [error, setError] = useState('');
    const [printConfirmOpen, setPrintConfirmOpen] = useState(false);

    const handleLabelChange = (e) => {
        const val = e.target.value;
        setNoOfLabels(val);

        const numericVal = Number(val);

        // Checks for 0, empty string, negative values, or values exceeding 200
        if (val === '' || numericVal <= 0) {
            setError('Labels must be greater than 0');
        } else if (numericVal > 200) {
            setError('Cannot exceed max 200 labels');
        } else {
            setError(''); // Clears out errors when input is valid
        }
    };


    const handleFormSubmit = () => {
        if (!error && noOfLabels) {
            setPrintConfirmOpen(true);
        }
    };

    const handleFinalPrintExecution = () => {
        // Trigger your hardware printer network endpoint call here
        console.log(`Printing ${noOfLabels} labels now...`);
    };
    useEffect(() => {
        if (open && totalHU !== undefined && totalHU !== null) {
            const parsedCount = parseInt(totalHU, 10) || 0;
            setNoOfLabels(parsedCount);

            // Clear or trigger error based on the fresh data load
            if (parsedCount > 200) {
                setError('Cannot exceed max 200 labels');
            } else {
                setError('');
            }
        }
    }, [open, totalHU]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3, // Matches smooth rounded corners
                    p: 1,
                    maxWidth: '680px', // Restricts layout constraints to match image aspect ratio
                    overflowX: 'hidden'
                },
            }}
        >
            {/* Dialog Header Actions container */}
            <DialogTitle sx={{ m: 0, p: 2, pb: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" sx={{ fontWeight: '600', fontSize: '1.1rem', color: '#111' }}>
                        Print Label - Handling unit {huIdx} / {totalUnits}
                    </Typography>
                    <Box>
                        <Button
                            onClick={handleClose}
                            variant="outlined"
                            size="small"
                            sx={{ height: 20, fontSize: '0.65rem', color: '#000', borderColor: '#000', textTransform: 'none', mr: 2 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleFormSubmit}
                            variant="contained"
                            disabled={!!error || !noOfLabels}
                            sx={{
                                textTransform: 'none',
                                height: 20,
                                backgroundColor: '#a61c24', // Theme matching dark red button
                                p: 1.5,
                                color: '#fff',
                                borderRadius: 1.5,
                                fontWeight: '500',
                                fontSize: '0.9rem',
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: '#82141a',
                                    boxShadow: 'none',
                                },
                                '&.Mui-disabled': {
                                    backgroundColor: '#cccccc',
                                    color: '#888888',
                                }
                            }}
                        >
                            Print
                        </Button>
                    </Box>

                </Box>
            </DialogTitle>

            {/* Thin line under header */}
            <Box sx={{ borderBottom: '1px solid #ccc', mx: 2, mb: 3 }} />

            {/* Dialog Body Content */}
            <DialogContent sx={{ p: 2, pt: 0, pb: 4 }}>
                <Box display="flex" gap={4} alignItems="flex-start">

                    {/* Select Printer Field */}
                    <TextField
                        select
                        label={
                            <span>
                                Select Printer <span style={{ color: '#d32f2f' }}>*</span>
                            </span>
                        }
                        variant="standard"
                        value={printer}
                        onChange={(e) => setPrinter(e.target.value)}
                        sx={{ flex: 1 }}
                        InputLabelProps={{
                            shrink: true,
                            sx: {
                                color: '#999',
                                fontSize: '0.95rem',
                                '&.Mui-focused': { color: '#999' },
                            },
                        }}
                        InputProps={{
                            disableUnderline: false,
                            sx: {
                                fontSize: '0.9rem',
                                color: '#222',
                                py: 0.5,
                                '&:before': { borderBottom: '1px solid #999' },
                                '&:hover:not(.Mui-disabled):before': { borderBottom: '1px solid #999' },
                                '&:after': { borderBottom: '2px solid #0d3c61' }, // Focus line color
                            },
                        }}
                    >
                        <MenuItem value="CFS 1 (192.168.185.24)">CFS 1 (192.168.185.24)</MenuItem>
                        <MenuItem value="CFS 2 (192.168.185.25)">CFS 2 (192.168.185.25)</MenuItem>
                    </TextField>

                    {/* No of Labels Field */}
                    <TextField
                        label={
                            <span>
                                No of Labels <span style={{ color: '#d32f2f' }}>*</span>
                            </span>
                        }
                        variant="standard"
                        type="number"
                        value={noOfLabels}
                        onChange={handleLabelChange}
                        error={!!error}
                        helperText={
                            <Box display="flex" justifyContent="flex-end" sx={{ width: '100%', mt: 0.25 }}>
                                <Typography variant="caption" sx={{ color: error ? '#d32f2f' : '#999', fontSize: '0.75rem' }}>
                                    {error ? error : 'Max 200 Labels'}
                                </Typography>
                            </Box>
                        }
                        sx={{
                            flex: 1,
                            '& .MuiFormHelperText-root': {
                                marginRight: 0, // Aligns helper text completely to the right edge
                            }
                        }}
                        InputLabelProps={{
                            shrink: true,
                            sx: {
                                color: '#999',
                                fontSize: '0.95rem',
                                '&.Mui-focused': { color: '#999' },
                            },
                        }}
                        InputProps={{
                            disableUnderline: false,
                            sx: {
                                fontSize: '0.9rem',
                                color: '#222',
                                py: 0.5,
                                '&:before': { borderBottom: error ? '1px solid #d32f2f' : '1px solid #999' },
                                '&:hover:not(.Mui-disabled):before': { borderBottom: error ? '1px solid #d32f2f' : '1px solid #999' },
                                '&:after': { borderBottom: error ? '2px solid #d32f2f' : '2px solid #0d3c61' },
                            },
                        }}
                    />

                </Box>
                <PrintLabelConfirmationDialog
                    open={printConfirmOpen}
                    handleClose={() => setPrintConfirmOpen(false)}
                    labelCount={noOfLabels}
                    onConfirm={handleFinalPrintExecution}
                />
            </DialogContent>
        </Dialog>
    );
}
