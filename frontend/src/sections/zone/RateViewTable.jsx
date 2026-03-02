import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Typography, Chip, Stack, Divider, Tooltip, DialogContent, Snackbar

} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ErrorBoundary } from 'react-error-boundary';

// shared components
import ErrorFallback from '../shared/ErrorBoundary';
import Iconify from '../../components/iconify';
import { useDispatch, useSelector } from '../../redux/store';
import CustomNoRowsOverlay from '../shared/CustomNoRowsOverlay';
import { setTableBeingViewed } from '../../redux/slices/customer';
import { PATH_DASHBOARD } from '../../routes/paths';
import { setSelectedCurrentRateRow, setCurrentRateTab } from '../../redux/slices/rate';
import { getZoneRateData, } from '../../redux/slices/zone';


// ----------------------------------------------------------------
RateViewTable.propTypes = {
    handleCloseRate: PropTypes.func,
};

export default function RateViewTable({ handleCloseRate, }) {
    const navigate = useNavigate();
    const rateData = useSelector((state) => state?.zonedata?.zoneRateData);
    const selectedZoneRowDetails = useSelector((state) => state?.zonedata?.selectedZoneRowDetails);
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
            field: 'originZone',
            headerName: 'Origin',
            width: 100,
            align: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Typography variant="normal">
                    {params?.row?.originZone?.zoneName}
                </Typography>
            )
        },
        {
            field: 'originZipCode',
            headerName: 'Origin Zip Code',
            width: 150,
            align: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const element = (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', pt: 1 }} alignItems={'center'} >
                        {params.row.originZone?.ranges?.map((range, index) => (
                            <Chip key={index} label={range} size="small" sx={{ bgcolor: 'rgba(224, 242, 255, 1)', mt: '2px !important', mb: '2px !important' }} />
                        ))}
                        <Typography variant="normal">
                            {params.row.originZone?.zipCodes?.join(", ")}
                        </Typography>
                    </Stack>
                );
                return element;
            }
        },
        {
            field: 'destinationZone',
            headerName: 'Destination',
            width: 100,
            align: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Typography variant="normal">
                    {params?.row?.destinationZone?.zoneName}
                </Typography>
            )
        },
        {
            field: 'destinationZipCode',
            headerName: 'Destination Zip Code',
            width: 170,
            align: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const element = (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', pt: 1 }} alignItems={'center'} >
                        {params.row.destinationZone?.ranges?.map((range, index) => (
                            <Chip key={index} label={range} size="small" sx={{ bgcolor: 'rgba(224, 242, 255, 1)', mt: '2px !important', mb: '2px !important' }} />
                        ))}
                        <Typography variant="normal">
                            {params.row.destinationZone?.zipCodes?.join(", ")}
                        </Typography>
                    </Stack>
                );
                return element;
            }
        },
        {
            field: 'customers',
            headerName: 'Customers',
            width: 150,
            align: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                // have to add customer list 
                <Stack sx={{ fontWeight: 'bold', bgcolor: 'rgba(224, 242, 255, 1)', p: 1 }} flexDirection={'row'} alignItems={'center'}>
                    <Iconify icon="lsicon:user-crowd-filled" sx={{ color: '#000', mr: 1 }} />
                    <Typography variant='normal'>{params?.row?.customers}</Typography>
                </Stack>
            )
        },
        {
            field: 'activeStatus',
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
                        <Chip label={params?.row?.activeStatus === 'Y' ? 'Active' : 'Inactive'} sx={{ backgroundColor: (params?.row?.activeStatus?.toLowerCase() === 'N') ? 'rgba(143, 143, 143, 1)' : 'rgba(92, 172, 105, 1)', }} />
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
                        {params.row.details?.map((detail, index) => (
                            <Stack key={index} flexDirection={'row'} spacing={1} alignItems="flex-end">
                                <Typography variant="normal" sx={{ width: "70px" }}>{detail?.rateField}:</Typography>
                                <Typography variant="normal" sx={{ width: "auto" }}>{detail?.chargeValue}</Typography>
                            </Stack>
                        ))}


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
            renderCell: (params) => {
                const formatted = new Date(params?.row?.expiryDate).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                }).replace(/\//g, '-');
                <Box sx={{ fontWeight: 'bold' }}>
                    {formatted}
                </Box>
            }
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            align: 'center',
            cellClassName: 'center-status-cell',
            sortable: false,
            filterable: false,
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
                                dispatch(setCurrentRateTab('transportation'));
                                dispatch(setSelectedCurrentRateRow(params.row));
                                localStorage.setItem('rateId', params?.row?.rateId);
                                navigate(PATH_DASHBOARD?.maintenance?.rateMaintenance?.rateView);
                            }} />
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        }
    ];
    const pagination = useSelector((state) => state?.zonedata?.pagination);
    const isLoading = useSelector((state) => state?.zonedata?.isLoading);
    // pagination model
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    useEffect(() => {
        if (pagination) {
            setPaginationModel({
                page: pagination.page ? parseInt(pagination.page, 10) - 1 : 0,
                pageSize: pagination.pageSize || 10,
            });
        }
    }, [pagination]);

    useEffect(() => {
        // Dispatch action to fetch rate dashboard data
        dispatch(setTableBeingViewed('zone rate'));
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
                        <Iconify icon="carbon:close" sx={{ color: '#000', cursor: 'pointer' }} onClick={handleCloseRate} />
                    </Stack>
                    <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
                </>
                <Box sx={{ width: "100%", flex: 1, mt: 2 }}>
                    <DataGrid
                        paginationMode="server"
                        paginationModel={paginationModel}
                        onPaginationModelChange={(newModel) => {
                            setPaginationModel(newModel);
                            // call api which gets rate data by zone id
                            dispatch(getZoneRateData(
                                newModel.page + 1,
                                newModel.pageSize,
                                selectedZoneRowDetails?.zoneId
                            ));
                        }}

                        rows={rateData}
                        columns={rateTransportationColumns}
                        loading={isLoading}
                        getRowId={(row) => row?.rateId}
                        pagination
                        slots={{
                            noRowsOverlay: CustomNoRowsOverlay,
                        }}
                        getRowHeight={() => 'auto'}
                        hideFooterSelectedRowCount
                        autoHeight
                        onPageChange={(newPage) => {
                            dispatch(getZoneRateData(newPage + 1, pagination?.pageSize || 10, selectedZoneRowDetails?.zoneId));
                        }}
                        onPageSizeChange={(newPageSize) => {
                            dispatch(getZoneRateData(1, newPageSize, selectedZoneRowDetails?.zoneId));
                        }}
                        pageSizeOptions={[5, 10, 50, 100]}
                        rowCount={parseInt(pagination?.totalRecords || rateData.length || '0', 10)}
                    />
                </Box>
            </ErrorBoundary>
        </>
    );
}