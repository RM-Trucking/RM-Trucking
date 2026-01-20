import { useState, useEffect } from 'react';
import {
    Box, Typography, Chip, Stack, Tooltip,

} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ErrorBoundary } from 'react-error-boundary';

// shared components
import ErrorFallback from '../shared/ErrorBoundary';
import Iconify from '../../components/iconify';
import { useDispatch, useSelector } from '../../redux/store';
import { setSelectedCurrentRateRow, getRateDashboardData } from '../../redux/slices/rate';
import { setTableBeingViewed, setStationRateData } from '../../redux/slices/customer';
import CustomNoRowsOverlay from '../shared/CustomNoRowsOverlay';
import StyledCheckbox from '../shared/StyledCheckBox';
// ----------------------------------------------------------------

export default function RateTable() {
    const dispatch = useDispatch();
    const { rateTableData, isLoading } = useSelector((state) => state.ratedata);
    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const rateColumns = [
        {
            field: 'rateID',
            headerName: 'Rate ID',
            width: 150,
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Box sx={{ fontWeight: 'bold' }}>
                    {params?.row?.rateID}
                </Box>
            )
        },
        {
            field: 'origin',
            headerName: 'Origin',
            width: 100,
            cellClassName: 'center-status-cell',
        },
        {
            field: 'originZipCode',
            headerName: 'Origin Zip Code',
            width: 150,
            cellClassName: 'center-status-cell',
        },
        {
            field: 'destination',
            headerName: 'Destination',
            width: 100,
            cellClassName: 'center-status-cell',
        },
        {
            field: 'destinationZipCode',
            headerName: 'Destination Zip Code',
            width: 170,
            cellClassName: 'center-status-cell',
        },
        {
            field: 'customers',
            headerName: 'Customers',
            width: 150,
            cellClassName: 'center-status-cell',
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 100,
            align: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const element = (
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                        }}
                    >
                        <Chip label={params?.row?.status} sx={{ backgroundColor: (params?.row?.status?.toLowerCase() === 'inactive') ? 'rgba(143, 143, 143, 1)' : 'rgba(92, 172, 105, 1)', }} />
                    </Box>
                );
                return element;
            },
        },
        {
            field: "rates",
            headerName: "Rates",
            minWidth: 200,
            minHeight: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const element = (
                    <Stack flexDirection={'column'} sx={{ mt: 0.5, mb: 0.5, }}>
                        <Typography variant="normal">Min: {params?.row?.min}</Typography>
                        <Typography variant="normal">100: {params?.row?.rate100}</Typography>
                        <Typography variant="normal">1000: {params?.row?.rate1000}</Typography>
                        <Typography variant="normal">3000: {params?.row?.rate3000}</Typography>
                        <Typography variant="normal">5000: {params?.row?.rate5000}</Typography>
                        <Typography variant="normal">10000: {params?.row?.rate10000}</Typography>
                        <Typography variant="normal">Max: {params?.row?.max}</Typography>
                    </Stack>
                );
                return element;
            }
        },
        {
            field: 'expiryDate',
            headerName: 'Expiry Date',
            width: 150,
            cellClassName: 'center-status-cell',
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const element = (
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                            mb: 1.2,
                            mt: 1.2,
                        }}
                    >
                        <Tooltip title={'View'} arrow>
                            <Iconify icon="carbon:view-filled" sx={{ color: '#000', mr: 2 }} onClick={() => {
                                dispatch(setSelectedCurrentRateRow(params.row));
                            }} />
                        </Tooltip>

                        <StyledCheckbox
                            sx={{ mt: -1 }}
                            onChange={(e, i) => {
                                const isChecked = e.target.checked;
                            }} />
                    </Box>
                );
                return element;
            },
        }
    ];

    useEffect(() => {
        // Dispatch action to fetch rate dashboard data
        dispatch(setTableBeingViewed('rate'));
        dispatch(getRateDashboardData());
    }, []);
    return (
        <>
            <ErrorBoundary
                FallbackComponent={ErrorFallback}
                onError={logError}
                onReset={() => {
                    // Optional: reset app state here if necessary before retry
                    console.log("Error boundary reset triggered");
                }}
            >
                <Box sx={{ width: "100%", flex: 1, mt: 2 }}>

                    <DataGrid
                        rows={rateTableData}
                        columns={rateColumns}
                        loading={isLoading}
                        getRowId={(row) => row?.id}
                        pagination
                        slots={{
                            noRowsOverlay: CustomNoRowsOverlay,
                        }}
                        getRowHeight={() => 'auto'}
                        onRowClick={(params, event) => {
                            console.log('Row clicked:', params);
                            // dispatch(setStationRateData({ row: params.row, checked: event.target.checked }));
                        }}
                        hideFooterSelectedRowCount
                    />
                </Box>
            </ErrorBoundary>
        </>
    );
}