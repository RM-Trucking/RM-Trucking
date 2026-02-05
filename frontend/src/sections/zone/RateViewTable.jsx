import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import {
    Box, Typography, Chip, Stack, Divider, Dialog, DialogContent, Snackbar

} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ErrorBoundary } from 'react-error-boundary';

// shared components
import ErrorFallback from '../shared/ErrorBoundary';
import Iconify from '../../components/iconify';
import { useDispatch, useSelector } from '../../redux/store';
import CustomNoRowsOverlay from '../shared/CustomNoRowsOverlay';
import { setTableBeingViewed } from '../../redux/slices/customer';

// ----------------------------------------------------------------
RateViewTable.propTypes = {
    rateDataArr: PropTypes.array,
};

export default function RateViewTable({ rateDataArr }) {
    const [rateData, setrateData] = useState(rateDataArr);
    const dispatch = useDispatch();
    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const rateTransportationColumns = [
        {
            field: 'rateId',
            headerName: 'Rate ID',
            width: 150,
            align: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Box sx={{ fontWeight: 'bold' }}>
                    {params?.row?.rateId}
                </Box>
            )
        },
        {
            field: 'origin',
            headerName: 'Origin',
            width: 100,
            align: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'originZipCode',
            headerName: 'Origin Zip Code',
            width: 150,
            align: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'destination',
            headerName: 'Destination',
            width: 100,
            align: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'destinationZipCode',
            headerName: 'Destination Zip Code',
            width: 170,
            align: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'customers',
            headerName: 'Customers',
            width: 150,
            align: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Stack sx={{ fontWeight: 'bold', bgcolor : 'rgba(224, 242, 255, 1)', p:1 }} flexDirection={'row'} alignItems={'center'}>
                    <Iconify icon="lsicon:user-crowd-filled" sx={{ color: '#000', mr: 1 }}  />
                    <Typography variant='normal'>{params?.row?.customers}</Typography>
                </Stack>
            )
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
                        <Chip label={params?.row?.status === 'Y' ? 'Active' : 'Inactive'} sx={{ backgroundColor: (params?.row?.status?.toLowerCase() === 'N') ? 'rgba(143, 143, 143, 1)' : 'rgba(92, 172, 105, 1)', }} />
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
            align: 'center',
            cellClassName: 'center-status-cell',
        },
    ];

    useEffect(() => {
        // Dispatch action to fetch rate dashboard data
        dispatch(setTableBeingViewed('rate'));
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
                <>
                    <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Rate Details</Typography>
                    </Stack>
                    <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
                </>
                <Box sx={{ width: "100%", flex: 1, mt: 2 }}>
                    <DataGrid
                        rows={rateData}
                        columns={rateTransportationColumns}
                        loading={rateData.length === 0}
                        getRowId={(row) => row?.rateId}
                        pagination
                        slots={{
                            noRowsOverlay: CustomNoRowsOverlay,
                        }}
                        getRowHeight={() => 'auto'}
                        hideFooterSelectedRowCount
                        autoHeight
                    />
                </Box>
            </ErrorBoundary>
        </>
    );
}