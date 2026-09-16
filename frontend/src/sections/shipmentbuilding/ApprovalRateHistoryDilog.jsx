import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Box,
    TableSortLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Iconify from '../../components/iconify';

export default function CustomerApprovalHistoryDialog({ open, handleClose, approvalRateHistory }) {

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
            {/* Dialog Header Title Section */}
            <DialogTitle sx={{ p: 1, pb: 1.5 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box component="span" sx={{ fontWeight: 'bold' }}>
                        Customer Approval History
                    </Box>
                    <Box>
                        <IconButton onClick={handleClose} aria-label="close" size="small" sx={{ ml: 2 }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </Box>
            </DialogTitle>

            {/* Underline matching layout divider card element */}
            <Box sx={{ borderBottom: '1px solid #e0e0e0', mb: 3 }} />

            <DialogContent sx={{ p: 1 }}>
                {/* History Table Container */}
                <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{
                        borderRadius: '8px',
                        borderColor: '#e8e8e8',
                        backgroundColor: '#fff',
                        boxShadow: 'none'
                    }}
                >
                    <Table size="small" aria-label="customer approval history table">
                        {/* Table Headers matching layout fields */}
                        <TableHead sx={{ backgroundColor: '#fcfcfc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 500, color: '#666', py: 1.8, fontSize: '0.85rem', width: '25%' }}>
                                    Status
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500, color: '#666', py: 1.8, fontSize: '0.85rem', width: '20%' }}>
                                    <TableSortLabel active direction="desc" sx={{ fontSize: '0.85rem' }}>
                                        User
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500, color: '#666', py: 1.8, fontSize: '0.85rem', width: '25%' }}>
                                    <TableSortLabel active direction="desc" sx={{ fontSize: '0.85rem' }}>
                                        Time
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500, color: '#666', py: 1.8, fontSize: '0.85rem' }}>
                                    <TableSortLabel active direction="desc" sx={{ fontSize: '0.85rem' }}>
                                        Rate ($)
                                    </TableSortLabel>
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        {/* Dynamic Body Parsing values */}
                        <TableBody>
                            {(!approvalRateHistory || approvalRateHistory.length === 0) ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#888', fontSize: '0.85rem' }}>
                                        No approval history logs available.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                approvalRateHistory.map((row, index) => (
                                    <TableRow
                                        key={row.id || index}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell sx={{ fontSize: '0.85rem', color: '#222', py: 1.8 }}>
                                            {row.status}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.85rem', color: '#222', py: 1.8 }}>
                                            {row.user}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.85rem', color: '#555', py: 1.8 }}>
                                            {row.time}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.85rem', color: '#222', py: 1.8, fontWeight: 500 }}>
                                            {typeof row.rate === 'number' ? row.rate.toFixed(2) : row.rate}
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
