import { useState, useEffect } from 'react';
import {
    Box, Typography, Chip, Stack, Tooltip, Dialog, DialogContent, Snackbar, Button

} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate, useLocation } from 'react-router-dom';

// shared components
import { PATH_DASHBOARD } from '../../routes/paths';
import ErrorFallback from '../shared/ErrorBoundary';
import Iconify from '../../components/iconify';
import { useDispatch, useSelector } from '../../redux/store';
import {
    setSelectedCurrentRateRow, getWarehouseRateDashboardData, deleteWarehouseRate,
    setOperationalMessage, setIsLoading, setCurrentRateRoutedFrom,
    getCustomerTransportationRateDashboardData, getCarrierTransportationRateDashboardData,
    getCustomerListByRateID, getCarrierListByRateID, getOriginZoneByZipCode,
    getDestinationZoneByZipCode, postStationRate, postTerminalRate,
} from '../../redux/slices/rate';
import { setTableBeingViewed, setStationRateData } from '../../redux/slices/customer';
import CustomNoRowsOverlay from '../shared/CustomNoRowsOverlay';
import StyledCheckbox from '../shared/StyledCheckBox';
import AddRate from './AddRate';
import CustomerListTable from './CustomersListTable';
// ----------------------------------------------------------------

export default function RateTable() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { isSelectRateClicked, currentRateRoutedFrom, rateTableData, isLoading, currentRateTab, pagination, rateSearchObj, operationalMessage, error, selectedCurrentRateRow } = useSelector((state) => state.ratedata);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [openCustomersList, setOpenCustomersList] = useState(false);
    const [actionType, setActionType] = useState('');
    // pagination model
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    // snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // selectedRates array
    const [selectedRatesArr, setSelectedRatesArr] = useState([]);

    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const rateTransportationColumns = [
        {
            field: 'customerRateId',
            field: `${currentRateRoutedFrom === 'customer' ? 'customerRateId' : 'carrierRateId'}`,
            headerName: 'Rate ID',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Box sx={{ fontWeight: 'bold' }}>
                    {currentRateRoutedFrom === 'customer' ? params?.row?.customerRateId : params?.row?.carrierRateId}
                </Box>
            )
        },
        {
            field: 'originZoneId',
            headerName: 'Origin',
            width: 100,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Box sx={{ fontWeight: 'bold' }}>
                    {params?.row?.originZone?.zoneName}
                </Box>
            )
        },
        {
            field: 'originZone',
            headerName: 'Origin Zip Code',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', pt: 1 }} alignItems={'center'} >
                    {params?.row?.originZone?.ranges?.map((range, index) => (
                        <Chip key={index} label={range} size="small" sx={{ bgcolor: 'rgba(224, 242, 255, 1)', mt: '2px !important', mb: '2px !important' }} />
                    ))}
                    <Typography variant="normal">
                        {params?.row?.originZone?.zipCodes?.join(", ")}
                    </Typography>
                </Stack>
            )
        },
        {
            field: 'destinationZoneId',
            headerName: 'Destination',
            width: 100,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Box sx={{ fontWeight: 'bold' }}>
                    {params?.row?.destinationZone?.zoneName}
                </Box>
            )
        },
        {
            field: 'destinationZipCode',
            headerName: 'Destination Zip Code',
            width: 170,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', pt: 1 }} alignItems={'center'} >
                    {params?.row?.destinationZone?.ranges?.map((range, index) => (
                        <Chip key={index} label={range} size="small" sx={{ bgcolor: 'rgba(224, 242, 255, 1)', mt: '2px !important', mb: '2px !important' }} />
                    ))}
                    <Typography variant="normal">
                        {params?.row?.destinationZone?.zipCodes?.join(", ")}
                    </Typography>
                </Stack>
            )
        },
        {
            field: `${currentRateRoutedFrom === 'customer' ? 'customerCount' : 'carrierCount'}`,
            headerName: `${currentRateRoutedFrom === 'customer' ? 'Customers' : 'Carriers'}`,
            width: 150,
            align: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                // have to add customer list 
                const element = (<>
                    {
                        (currentRateRoutedFrom === 'customer' && params?.row?.customerCount && params?.row?.customerCount > 0)
                            ?
                            <Stack sx={{ fontWeight: 'bold', bgcolor: 'rgba(224, 242, 255, 1)', p: 1 }} flexDirection={'row'} alignItems={'center'} onClick={() => {
                                setOpenCustomersList(true);
                                dispatch(setSelectedCurrentRateRow(params.row));
                                dispatch(getCustomerListByRateID(params.row.rateId));
                            }}>
                                <Iconify icon="lsicon:user-crowd-filled" sx={{ color: '#000', mr: 1 }} />
                                <Typography variant='normal'>{params?.row?.customerCount}</Typography>
                            </Stack>
                            :
                            <Typography variant='normal'>{params?.row?.customerCount}</Typography>
                    }
                    {
                        (currentRateRoutedFrom === 'carrier' && params?.row?.carrierCount && params?.row?.carrierCount > 0)
                            ?
                            <Stack sx={{ fontWeight: 'bold', bgcolor: 'rgba(224, 242, 255, 1)', p: 1 }} flexDirection={'row'} alignItems={'center'} onClick={() => {
                                setOpenCustomersList(true);
                                dispatch(setSelectedCurrentRateRow(params.row));
                                dispatch(getCarrierListByRateID(params.row.rateId));
                            }}>
                                <Iconify icon="lsicon:user-crowd-filled" sx={{ color: '#000', mr: 1 }} />
                                <Typography variant='normal'>{params?.row?.carrierCount}</Typography>
                            </Stack>
                            :
                            <Typography variant='normal'>{params?.row?.carrierCount}</Typography>
                    }
                </>);
                return element;
            }
        },
        {
            field: 'activeStatus',
            headerName: 'Status',
            width: 100,
            headerAlign: 'center',
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
            field: "details",
            headerName: "Rates",
            minWidth: 200,
            minHeight: 200,
            flex: 1,
            renderCell: (params) => {
                const element = (
                    <Stack flexDirection={'column'} sx={{ mt: 0.5, mb: 0.5, }}>
                        {
                            params?.row?.details?.map((detail) => (
                                <Stack key={detail.rateDetailId} flexDirection={'row'} spacing={1} alignItems="flex-end">
                                    <Typography variant="normal" sx={{ width: "130px" }}>{detail?.rateField}</Typography>
                                    <Typography variant="normal" sx={{ width: "auto" }}>{detail.chargeValue}</Typography>
                                </Stack>
                            ))
                        }
                    </Stack>
                );
                return element;
            }
        },
        {
            field: 'expiryDate',
            headerName: 'Expiry Date',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const formatted = new Date(params?.row?.expiryDate).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                }).replace(/\//g, '-');
                <Box>
                    {formatted}
                </Box>
            }
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 300,
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
                            <Box onClick={() => {
                                dispatch(setSelectedCurrentRateRow(params.row));
                                localStorage.setItem('rateId', params?.row?.rateId);
                                setActionType("View");
                                dispatch(getOriginZoneByZipCode(params?.row?.originZone?.zipCodes.join(',').concat(",", params?.row?.originZone?.ranges?.join(',')) || ''));
                                dispatch(getDestinationZoneByZipCode(params?.row?.destinationZone?.zipCodes.join(',').concat(",", params?.row?.destinationZone?.ranges?.join(',')) || ''));
                                if (currentRateRoutedFrom === 'customer') {
                                    dispatch(getCustomerListByRateID(params.row.rateId));
                                    navigate(PATH_DASHBOARD?.maintenance?.customerMaintenance?.rateView);
                                } else if (currentRateRoutedFrom === 'carrier') {
                                    dispatch(getCarrierListByRateID(params.row.rateId));
                                    navigate(PATH_DASHBOARD?.maintenance?.carrierMaintenance?.rateView);
                                }
                            }} sx={{ display: 'inline-flex', cursor: 'pointer' }} >
                                <Iconify icon="carbon:view-filled" sx={{ color: '#000', mr: 2 }} />
                            </Box>
                        </Tooltip>
                        <Tooltip title={'Edit'} arrow>
                            <Box onClick={() => {
                                dispatch(setSelectedCurrentRateRow(params?.row));
                                dispatch(getOriginZoneByZipCode(params?.row?.originZone?.zipCodes.join(',').concat(",", params?.row?.originZone?.ranges?.join(',')) || ''));
                                dispatch(getDestinationZoneByZipCode(params?.row?.destinationZone?.zipCodes.join(',').concat(",", params?.row?.destinationZone?.ranges?.join(',')) || ''));
                                localStorage.setItem('rateId', params?.row?.rateId);
                                setActionType("Edit");
                                setOpenConfirmDialog(true);
                            }} sx={{ display: 'inline-flex', cursor: 'pointer' }}>
                                <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 1 }} />
                            </Box>
                        </Tooltip>

                        {currentRateRoutedFrom === 'customer' && isSelectRateClicked && <StyledCheckbox
                            sx={{ mt: -1.5 }}
                            onChange={(e, i) => {
                                const isChecked = e.target.checked;
                                // if checked add the object nor else remove object
                                if (isChecked) {
                                    // --- PUSH LOGIC ---
                                    setSelectedRatesArr((prev) => {
                                        const isDuplicate = prev.some(item => item.rateId === params.row.rateId);
                                        if (isDuplicate) return prev;

                                        const obj = {
                                            "stationId": localStorage.getItem('stationId'),
                                            "rateId": params.row.rateId,
                                            "rateType": "TRANSPORT"
                                        };
                                        return [...prev, obj];
                                    });
                                } else {
                                    // --- REMOVE LOGIC ---
                                    setSelectedRatesArr((prev) =>
                                        prev.filter((item) => item.rateId !== params.row.rateId)
                                    );
                                }
                            }} />}
                        {currentRateRoutedFrom === 'carrier' && isSelectRateClicked && <StyledCheckbox
                            sx={{ mt: -1.5 }}
                            onChange={(e, i) => {
                                const isChecked = e.target.checked;
                                // if checked add the object nor else remove object
                                if (isChecked) {
                                    // --- PUSH LOGIC ---
                                    setSelectedRatesArr((prev) => {
                                        const isDuplicate = prev.some(item => item.rateId === params.row.rateId);
                                        if (isDuplicate) return prev;

                                        const obj = {
                                            "terminalId": localStorage.getItem('terminalId'),
                                            "rateId": params.row.rateId,
                                            "rateType": "TRANSPORT"
                                        };
                                        return [...prev, obj];
                                    });
                                } else {
                                    // --- REMOVE LOGIC ---
                                    setSelectedRatesArr((prev) =>
                                        prev.filter((item) => item.rateId !== params.row.rateId)
                                    );
                                }
                            }} />}
                    </Box>
                );
                return element;
            },
        }
    ];
    const rateWarehouseColumns = [
        {
            field: 'rateId',
            headerName: 'Rate ID',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Box sx={{ fontWeight: 'bold' }}>
                    {params?.row?.rateId}
                </Box>
            )
        },
        {
            field: 'warehouse',
            headerName: 'Warehouse',
            width: 200,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'department',
            headerName: 'Department',
            width: 200,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "minRate",
            headerName: "Rates",
            minWidth: 300,
            minHeight: 200,
            renderCell: (params) => {
                const element = (
                    <Stack flexDirection={'column'} sx={{ mt: 1, mb: 1, }}>
                        <Stack flexDirection={'row'} spacing={1} alignItems="flex-end">
                            <Typography variant="normal" sx={{ width: "130px" }}>Min</Typography>
                            <Typography variant="normal" sx={{ width: "auto" }}>{params?.row?.minRate}</Typography>
                        </Stack>
                        <Stack flexDirection={'row'} spacing={1} alignItems="flex-end">
                            <Typography variant="normal" sx={{ width: "130px" }}>Rate Per 100 LB</Typography>
                            <Typography variant="normal" sx={{ width: "auto" }}>{params?.row?.ratePerPound}</Typography>
                        </Stack>
                        <Stack flexDirection={'row'} spacing={1} alignItems="flex-end">
                            <Typography variant="normal" sx={{ width: "130px" }}>Max</Typography>
                            <Typography variant="normal" sx={{ width: "auto" }}>{params?.row?.maxRate}</Typography>
                        </Stack>
                    </Stack>
                );
                return element;
            }
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 300,
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
                            alignItems: 'flex-end'
                        }}
                    >
                        <Tooltip title={'Edit'} arrow>
                            <Box
                                onClick={() => {
                                    setActionType("Edit");
                                    dispatch(setSelectedCurrentRateRow(params?.row));
                                    setOpenConfirmDialog(true);
                                }} sx={{ display: 'inline-flex', cursor: 'pointer' }} >
                                <Iconify icon="tabler:edit" sx={{ color: '#000', marginTop: '15px', mr: 2 }} />
                            </Box>
                        </Tooltip>
                        <Tooltip title={'Copy'} arrow>
                            <Box
                                onClick={() => {
                                    setActionType("Copy");
                                    dispatch(setSelectedCurrentRateRow(params?.row));
                                    setOpenConfirmDialog(true);
                                }}
                                sx={{ display: 'inline-flex', cursor: 'pointer' }}>
                                <Iconify icon="bxs:copy" sx={{ color: '#000', marginTop: '15px', mr: 2 }} />
                            </Box>
                        </Tooltip>
                        <Tooltip title={'Delete'} arrow>
                            <Box onClick={() => {
                                dispatch(deleteWarehouseRate(params?.row?.rateId));
                            }}
                                sx={{ display: 'inline-flex', cursor: 'pointer' }}>
                                <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', marginTop: '15px' }} />
                            </Box>
                        </Tooltip>
                        {currentRateRoutedFrom === 'customer' && isSelectRateClicked && <StyledCheckbox
                            sx={{ mt: -1.5 }}
                            onChange={(e, i) => {
                                const isChecked = e.target.checked;
                                // if checked add the object nor else remove object
                                if (isChecked) {
                                    // --- PUSH LOGIC ---
                                    setSelectedRatesArr((prev) => {
                                        const isDuplicate = prev.some(item => item.rateId === params.row.rateId);
                                        if (isDuplicate) return prev;

                                        const obj = {
                                            "stationId": localStorage.getItem('stationId'),
                                            "rateId": params.row.rateId,
                                            "rateType": "WAREHOUSE"
                                        };
                                        return [...prev, obj];
                                    });
                                } else {
                                    // --- REMOVE LOGIC ---
                                    setSelectedRatesArr((prev) =>
                                        prev.filter((item) => item.rateId !== params.row.rateId)
                                    );
                                }
                            }} />}
                    </Box>
                );
                return element;
            },
        }
    ];
    useEffect(() => {
        if (location?.pathname?.includes('customer-maintenance')) {
            dispatch(setCurrentRateRoutedFrom('customer'));
        }
        if (location?.pathname?.includes('carrier-maintenance')) {
            dispatch(setCurrentRateRoutedFrom('carrier'));
        }
    }, [location]);
    useEffect(() => {
        // Dispatch action to fetch rate dashboard data
        dispatch(setTableBeingViewed('rate'));
        if (currentRateTab === 'warehouse' && currentRateRoutedFrom === 'customer') {
            dispatch(getWarehouseRateDashboardData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: rateSearchObj?.warehouse }));
        }
        if (currentRateTab === 'transportation' && (currentRateRoutedFrom === 'customer' || location.pathname.includes('customer-maintenance'))) {
            dispatch(getCustomerTransportationRateDashboardData({
                originZoneId: null,
                originZipOrRange: null,
                destinationZoneId: null,
                destinationZipOrRange: null, pageNo: pagination.page, pageSize: pagination.pageSize
            }));
        }
        if (currentRateTab === 'transportation' && (currentRateRoutedFrom === 'carrier' || location.pathname.includes('carrier-maintenance'))) {
            dispatch(getCarrierTransportationRateDashboardData({
                originZoneId: null,
                originZipOrRange: null,
                destinationZoneId: null,
                destinationZipOrRange: null, pageNo: pagination.page, pageSize: pagination.pageSize
            }));
        }
    }, []);
    useEffect(() => {
        if (currentRateTab === 'warehouse' && currentRateRoutedFrom === 'customer') {
            dispatch(getWarehouseRateDashboardData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: rateSearchObj?.warehouse }));
        }
        if (currentRateTab === 'transportation' && currentRateRoutedFrom === 'customer') {
            dispatch(getCustomerTransportationRateDashboardData({
                originZoneId: null,
                originZipOrRange: null,
                destinationZoneId: null,
                destinationZipOrRange: null, pageNo: pagination.page, pageSize: pagination.pageSize
            }));
        }
        if (currentRateTab === 'transportation' && currentRateRoutedFrom === 'carrier') {
            dispatch(getCarrierTransportationRateDashboardData({
                originZoneId: null,
                originZipOrRange: null,
                destinationZoneId: null,
                destinationZipOrRange: null, pageNo: pagination.page, pageSize: pagination.pageSize
            }));
        }
    }, [currentRateTab]);
    useEffect(() => {
        if (pagination) {
            setPaginationModel({
                page: pagination.page ? parseInt(pagination.page, 10) - 1 : 0,
                pageSize: pagination.pageSize || 10,
            });
        }
    }, [pagination]);
    useEffect(() => {
        if (error) {
            setSnackbarMessage(`${(error?.error && error?.message) ? `${error?.error}. ${error?.message}` : `${error}`}`);
            setSnackbarOpen(true);
        }
    }, [error])
    // operational message on customer
    useEffect(() => {
        if (operationalMessage) {
            setSnackbarMessage(operationalMessage);
            setSnackbarOpen(true);
        }
        if (operationalMessage === 'Rate deleted successfully') {
            if (currentRateTab === 'warehouse' && currentRateRoutedFrom === 'customer') {
                dispatch(getWarehouseRateDashboardData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: rateSearchObj?.warehouse }));
            }
            if (currentRateTab === 'transportation' && currentRateRoutedFrom === 'customer') {
                dispatch(getCustomerTransportationRateDashboardData({
                    originZoneId: null,
                    originZipOrRange: null,
                    destinationZoneId: null,
                    destinationZipOrRange: null, pageNo: pagination.page, pageSize: pagination.pageSize
                }));
            }
            if (currentRateTab === 'transportation' && currentRateRoutedFrom === 'carrier') {
                dispatch(getCarrierTransportationRateDashboardData({
                    originZoneId: null,
                    originZipOrRange: null,
                    destinationZoneId: null,
                    destinationZipOrRange: null, pageNo: pagination.page, pageSize: pagination.pageSize
                }));
            }
        }
        if (operationalMessage === 'Station rate created successfully') {
            navigate(PATH_DASHBOARD.maintenance.customerMaintenance.customerStationView);
        }
        if (operationalMessage === 'Terminal rate created successfully') {
            navigate(PATH_DASHBOARD.maintenance.carrierMaintenance.terminalView);
        }
    }, [operationalMessage])
    useEffect(() => {
        if (currentRateRoutedFrom) {
            console.log('currentRateRoutedFrom', currentRateRoutedFrom);
        }
    }, [currentRateRoutedFrom])

    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
        setActionType("");
        dispatch(setSelectedCurrentRateRow({}));
    };
    const handleCloseOfCustomersList = () => {
        setOpenCustomersList(false);
        dispatch(setSelectedCurrentRateRow({}));
    };
    const onClickOfAddRate = () => {
        if (currentRateRoutedFrom === 'customer') {
            dispatch(postStationRate(selectedRatesArr));
        }
        if (currentRateRoutedFrom === 'carrier') {
            dispatch(postTerminalRate(selectedRatesArr));
        }
    }
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
                    {isSelectRateClicked && <Stack flexDirection={'row'} alignItems={'center'} justifyContent={'flex-end'}>
                        <Button
                            variant="outlined"
                            onClick={() => onClickOfAddRate()}
                            sx={{
                                height: '30px',
                                fontWeight: 600,
                                color: '#fff',
                                textTransform: 'none', // Prevent uppercase styling
                                '&.MuiButton-outlined': {
                                    borderRadius: '4px',
                                    color: '#fff',
                                    boxShadow: 'none',
                                    p: '2px 16px',
                                    bgcolor: '#a22',
                                    borderColor: '#a22',
                                    mb: 1
                                },
                            }}
                        >
                            Add Selected Rates
                        </Button>
                    </Stack>}
                    <DataGrid
                        rows={rateTableData || []}
                        columns={currentRateTab === 'warehouse' ? rateWarehouseColumns : rateTransportationColumns}
                        loading={isLoading}
                        getRowId={(row) => row?.rateId}
                        pagination
                        slots={{
                            noRowsOverlay: CustomNoRowsOverlay,
                        }}
                        getRowHeight={() => 'auto'}
                        hideFooterSelectedRowCount
                        paginationMode="server"
                        paginationModel={paginationModel}
                        onPaginationModelChange={(newModel) => {
                            setPaginationModel(newModel);
                            if (currentRateTab === 'warehouse' && currentRateRoutedFrom === 'customer') {
                                dispatch(getWarehouseRateDashboardData({
                                    pageNo: newModel.page + 1,
                                    pageSize: newModel.pageSize,
                                    searchStr: rateSearchObj?.warehouse
                                }));
                            }
                            if (currentRateTab === 'transportation' && currentRateRoutedFrom === 'customer') {
                                dispatch(getCustomerTransportationRateDashboardData({
                                    originZoneId: rateSearchObj.origin,
                                    originZipOrRange: rateSearchObj.originZipCode,
                                    destinationZoneId: rateSearchObj.destination,
                                    destinationZipOrRange: rateSearchObj.destinationZipCode,
                                    pageNo: newModel.page + 1,
                                    pageSize: newModel.pageSize,
                                }));
                            }
                            if (currentRateTab === 'transportation' && currentRateRoutedFrom === 'carrier') {
                                dispatch(getCarrierTransportationRateDashboardData({
                                    originZoneId: rateSearchObj.origin,
                                    originZipOrRange: rateSearchObj.originZipCode,
                                    destinationZoneId: rateSearchObj.destination,
                                    destinationZipOrRange: rateSearchObj.destinationZipCode,
                                    pageNo: newModel.page + 1,
                                    pageSize: newModel.pageSize,
                                }));
                            }
                        }}
                        onPageChange={(newPage) => {
                            if (currentRateTab === 'warehouse' && currentRateRoutedFrom === 'customer') {
                                dispatch(getWarehouseRateDashboardData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, searchStr: rateSearchObj?.warehouse }));
                            }
                            if (currentRateTab === 'transportation' && currentRateRoutedFrom === 'customer') {
                                dispatch(getCustomerTransportationRateDashboardData({
                                    originZoneId: rateSearchObj.origin,
                                    originZipOrRange: rateSearchObj.originZipCode,
                                    destinationZoneId: rateSearchObj.destination,
                                    destinationZipOrRange: rateSearchObj.destinationZipCode,
                                    pageNo: newPage + 1, pageSize: pagination.pageSize
                                }));
                            }
                            if (currentRateTab === 'transportation' && currentRateRoutedFrom === 'carrier') {
                                dispatch(getCarrierTransportationRateDashboardData({
                                    originZoneId: rateSearchObj.origin,
                                    originZipOrRange: rateSearchObj.originZipCode,
                                    destinationZoneId: rateSearchObj.destination,
                                    destinationZipOrRange: rateSearchObj.destinationZipCode,
                                    pageNo: newPage + 1, pageSize: pagination.pageSize
                                }));
                            }
                        }}
                        onPageSizeChange={(newPageSize) => {
                            if (currentRateTab === 'warehouse' && currentRateRoutedFrom === 'customer') {
                                dispatch(getWarehouseRateDashboardData({ pageNo: 1, pageSize: newPageSize, searchStr: rateSearchObj?.warehouse }));
                            }
                            if (currentRateTab === 'transportation' && currentRateRoutedFrom === 'customer') {
                                dispatch(getCustomerTransportationRateDashboardData({
                                    originZoneId: rateSearchObj.origin,
                                    originZipOrRange: rateSearchObj.originZipCode,
                                    destinationZoneId: rateSearchObj.destination,
                                    destinationZipOrRange: rateSearchObj.destinationZipCode,
                                    pageNo: 1, pageSize: newPageSize
                                }));
                            }
                            if (currentRateTab === 'transportation' && currentRateRoutedFrom === 'carrier') {
                                dispatch(getCarrierTransportationRateDashboardData({
                                    originZoneId: rateSearchObj.origin,
                                    originZipOrRange: rateSearchObj.originZipCode,
                                    destinationZoneId: rateSearchObj.destination,
                                    destinationZipOrRange: rateSearchObj.destinationZipCode,
                                    pageNo: 1, pageSize: newPageSize
                                }));
                            }
                        }}
                        pageSizeOptions={[5, 10, 50, 100]}
                        rowCount={parseInt(pagination?.totalRecords || '0', 10)}
                        autoHeight

                    />
                </Box>
                <Dialog open={openConfirmDialog} onClose={handleCloseConfirm} onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        handleCloseConfirm();
                    }
                }}
                    sx={{
                        '& .MuiDialog-paper': { // Target the paper class
                            width: '1545px',
                            height: '80%',
                            maxHeight: 'none',
                            maxWidth: 'none',
                        }
                    }}
                >
                    <DialogContent>
                        <AddRate type={actionType} handleCloseConfirm={handleCloseConfirm} selectedCurrentRateRow={selectedCurrentRateRow} />
                    </DialogContent>
                </Dialog>
                <Dialog open={openCustomersList} onClose={handleCloseOfCustomersList} onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        handleCloseOfCustomersList();
                    }
                }}
                    sx={{
                        '& .MuiDialog-paper': { // Target the paper class
                            width: '800px',
                            height: 'auto',
                            maxHeight: 'none',
                            maxWidth: 'none',
                        }
                    }}
                >
                    <DialogContent>
                        <CustomerListTable handleCloseConfirm={handleCloseOfCustomersList} />
                    </DialogContent>
                </Dialog>
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={3000} // Adjust the duration as needed
                    onClose={() => {
                        setSnackbarOpen(false);
                        dispatch(setOperationalMessage());
                    }}
                    message={snackbarMessage}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                />
            </ErrorBoundary>
        </>
    );
}