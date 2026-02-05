import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import {
    Box, Stack, Typography, Button, Dialog,
    DialogContent, Tooltip, Divider
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from '../../redux/store';
import CustomNoRowsOverlay from '../shared/CustomNoRowsOverlay';
import Iconify from '../../components/iconify';
import { setTableBeingViewed } from '../../redux/slices/customer';

CustomerListTable.PropTypes = {
    customerData: PropTypes.array,
    handleCloseConfirm: PropTypes.func
};

export default function CustomerListTable({ customerData, handleCloseConfirm }) {
    const dispatch = useDispatch();
    const customerColumns = [
        {
            field: 'customerName',
            headerName: 'Customer',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Box sx={{p:1}}>
                    {params?.row?.customerName}
                </Box>
            )
        },
        {
            field: 'stationName',
            headerName: 'Station',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Box sx={{p:1}}>
                    {params?.row?.stationName}
                </Box>
            )
        },

    ];

    // get call for customers for a particular rate
    useEffect(() => {
        dispatch(setTableBeingViewed('Customers'));
    }, []);



    return (
        <>
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Customer List</Typography>
                    <Iconify icon="carbon:close" onClick={() => handleCloseConfirm()} sx={{ cursor: 'pointer' }} />
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
            <Box sx={{width: "100%", flex: 1, mt: 3 }}>
                <DataGrid
                    rows={customerData}
                    columns={customerColumns}
                    loading={customerData.length === 0}
                    getRowId={(row) => row?.customerId}
                    pagination
                    slots={{
                        noRowsOverlay: CustomNoRowsOverlay,
                    }}
                    hideFooterSelectedRowCount
                    getRowHeight={() => 'auto'}
                />
            </Box>
            <Button
                variant="contained"
                size="small"
                type='submit'
                onClick={() => handleCloseConfirm()}
                sx={{
                    '&.MuiButton-contained': {
                        borderRadius: '4px',
                        color: '#ffffff',
                        boxShadow: 'none',
                        fontSize: '14px',
                        p: '2px 16px',
                        bgcolor: '#A22',
                        fontWeight: 'normal',
                        mt: 2,
                        mb: 1
                    },
                }}
            >
                Ok
            </Button>

        </>
    );
}