import { useState, useEffect } from 'react';
import {
    Box, Typography, Chip, Stack, Tooltip, Dialog, DialogContent, Snackbar

} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate, useLocation } from 'react-router-dom';

// shared components
import { PATH_DASHBOARD } from '../../routes/paths';
import ErrorFallback from '../shared/ErrorBoundary';
import Iconify from '../../components/iconify';
import { useDispatch, useSelector } from '../../redux/store';
import { setSelectedCurrentRateRow, getRateDashboardData, deleteWarehouseRate, setOperationalMessage, setIsLoading } from '../../redux/slices/rate';
import { setTableBeingViewed, setStationRateData } from '../../redux/slices/customer';
import CustomNoRowsOverlay from '../shared/CustomNoRowsOverlay';
import StyledCheckbox from '../shared/StyledCheckBox';
import AddRate from './AddRate';
import CustomerListTable from './CustomersListTable';
// ----------------------------------------------------------------

export default function RateTable() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { rateTableData, isLoading, currentRateTab, pagination, rateSearchObj, operationalMessage, error, selectedCurrentRateRow } = useSelector((state) => state.ratedata);
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
            headerAlign: 'center',
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
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'originZipCode',
            headerName: 'Origin Zip Code',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'destination',
            headerName: 'Destination',
            width: 100,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'destinationZipCode',
            headerName: 'Destination Zip Code',
            width: 170,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'customers',
            headerName: 'Customers',
            width: 150,
            align: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                // have to add customer list 
                <Stack sx={{ fontWeight: 'bold', bgcolor: 'rgba(224, 242, 255, 1)', p: 1 }} flexDirection={'row'} alignItems={'center'} onClick={() => {
                    setOpenCustomersList(true);
                    dispatch(setSelectedCurrentRateRow(params.row));
                }}>
                    <Iconify icon="lsicon:user-crowd-filled" sx={{ color: '#000', mr: 1 }} />
                    <Typography variant='normal'>{params?.row?.customers}</Typography>
                </Stack>
            )
        },
        {
            field: 'status',
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
                        <Stack flexDirection={'row'} spacing={1} alignItems="flex-end">
                            <Typography variant="normal" sx={{ width: "130px" }}>Min:</Typography>
                            <Typography variant="normal" sx={{ width: "auto" }}>{params?.row?.min}</Typography>
                        </Stack>
                        <Stack flexDirection={'row'} spacing={1} alignItems="flex-end">
                            <Typography variant="normal" sx={{ width: "130px" }}>100:</Typography>
                            <Typography variant="normal" sx={{ width: "auto" }}>{params?.row?.rate100}</Typography>
                        </Stack>
                        <Stack flexDirection={'row'} spacing={1} alignItems="flex-end">
                            <Typography variant="normal" sx={{ width: "130px" }}>1000:</Typography>
                            <Typography variant="normal" sx={{ width: "auto" }}>{params?.row?.rate1000}</Typography>
                        </Stack>
                        <Stack flexDirection={'row'} spacing={1} alignItems="flex-end">
                            <Typography variant="normal" sx={{ width: "130px" }}>3000:</Typography>
                            <Typography variant="normal" sx={{ width: "auto" }}>{params?.row?.rate3000}</Typography>
                        </Stack>
                        <Stack flexDirection={'row'} spacing={1} alignItems="flex-end">
                            <Typography variant="normal" sx={{ width: "130px" }}>5000:</Typography>
                            <Typography variant="normal" sx={{ width: "auto" }}>{params?.row?.rate5000}</Typography>
                        </Stack>
                        <Stack flexDirection={'row'} spacing={1} alignItems="flex-end">
                            <Typography variant="normal" sx={{ width: "130px" }}>10000:</Typography>
                            <Typography variant="normal" sx={{ width: "auto" }}>{params?.row?.rate10000}</Typography>
                        </Stack>
                        <Stack flexDirection={'row'} spacing={1} alignItems="flex-end">
                            <Typography variant="normal" sx={{ width: "130px" }}>Max:</Typography>
                            <Typography variant="normal" sx={{ width: "auto" }}>{params?.row?.max}</Typography>
                        </Stack>
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
                            <Iconify icon="carbon:view-filled" sx={{ color: '#000', mr: 2 }} onClick={() => {
                                dispatch(setSelectedCurrentRateRow(params.row));
                                localStorage.setItem('rateId', params?.row?.rateId);
                                setActionType("View");
                                navigate(PATH_DASHBOARD?.maintenance?.rateMaintenance?.rateView);
                            }} />
                        </Tooltip>
                        <Tooltip title={'Edit'} arrow>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 1 }} onClick={() => {
                                dispatch(setSelectedCurrentRateRow(params?.row));
                                localStorage.setItem('rateId', params?.row?.rateId);
                                setActionType("Edit");
                                setOpenConfirmDialog(true);
                            }} />
                        </Tooltip>

                        <StyledCheckbox
                            sx={{ mt: -1.5 }}
                            onChange={(e, i) => {
                                const isChecked = e.target.checked;
                                dispatch(setIsLoading(true));
                                setTimeout(() => {
                                    dispatch(setIsLoading(false));
                                    setSnackbarMessage(`Rate has been ${isChecked ? 'activated' : 'deactivated'} successfully`);
                                    setSnackbarOpen(true);
                                }, 1000);
                                // here need to call api to post data
                            }} />
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
                            <Iconify icon="tabler:edit" sx={{ color: '#000', marginTop: '15px', mr: 2 }} onClick={() => {
                                setActionType("Edit");
                                dispatch(setSelectedCurrentRateRow(params?.row));
                                setOpenConfirmDialog(true);
                            }} />
                        </Tooltip>
                        <Tooltip title={'Copy'} arrow>
                            <Iconify icon="bxs:copy" sx={{ color: '#000', marginTop: '15px', mr: 2 }} onClick={() => {
                                setActionType("Copy");
                                dispatch(setSelectedCurrentRateRow(params?.row));
                                setOpenConfirmDialog(true);
                            }} />
                        </Tooltip>
                        <Tooltip title={'Delete'} arrow>
                            <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', marginTop: '15px' }} onClick={() => {
                                dispatch(deleteWarehouseRate(params?.row?.rateId));
                            }} />
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        }
    ];
    const rateData = [
        {
            rateId: 1,
            origin: 'ORD',
            originZipCode: '60501',
            destination: 'Ankeny',
            destinationZipCode: '50007',
            customers: 26,
            status: 'Y',
            min: '100',
            rate100: '100',
            rate1000: '1000',
            rate3000: '3000',
            rate5000: '5000',
            rate10000: '10000',
            max: '10000',
            expiryDate: '12-30-2026',
        },
        {
            rateId: 2,
            origin: 'ORD',
            originZipCode: '60501',
            destination: 'Ankeny',
            destinationZipCode: '50007',
            customers: 26,
            status: 'Y',
            min: '100',
            rate100: '100',
            rate1000: '1000',
            rate3000: '3000',
            rate5000: '5000',
            rate10000: '10000',
            max: '10000',
            expiryDate: '12-30-2026',
        },
        {
            rateId: 3,
            origin: 'ORD',
            originZipCode: '60501',
            destination: 'Ankeny',
            destinationZipCode: '50007',
            customers: 26,
            status: 'Y',
            min: '100',
            rate100: '100',
            rate1000: '1000',
            rate3000: '3000',
            rate5000: '5000',
            rate10000: '10000',
            max: '10000',
            expiryDate: '12-30-2026',
        },
    ]
    const customerData = [
        {
            customerId: 1,
            customerName: 'Liam Johnson',
            stationName: 'Station 1'
        },
        {
            customerId: 2,
            customerName: 'Emma Thompson',
            stationName: 'Station 2'
        }
    ]

    useEffect(() => {
        // Dispatch action to fetch rate dashboard data
        dispatch(setTableBeingViewed('rate'));
        if (currentRateTab === 'warehouse') {
            dispatch(getRateDashboardData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: rateSearchObj?.warehouse }));
        }
    }, []);
    useEffect(() => {
        if (currentRateTab === 'warehouse') {
            dispatch(getRateDashboardData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: rateSearchObj?.warehouse }));
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
            dispatch(getRateDashboardData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: rateSearchObj?.warehouse }));
        }
    }, [operationalMessage])

    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
        setActionType("");
        dispatch(setSelectedCurrentRateRow({}));
    };
    const handleCloseOfCustomersList = () => {
        setOpenCustomersList(false);
        dispatch(setSelectedCurrentRateRow({}));
    };
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
                        rows={currentRateTab === 'warehouse' ? rateTableData : rateData}
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
                            dispatch(getRateDashboardData({
                                pageNo: newModel.page + 1,
                                pageSize: newModel.pageSize,
                                searchStr: rateSearchObj?.warehouse
                            }));
                        }}
                        onPageChange={(newPage) => {
                            dispatch(getRateDashboardData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, searchStr: rateSearchObj?.warehouse }));
                        }}
                        onPageSizeChange={(newPageSize) => {
                            dispatch(getRateDashboardData({ pageNo: 1, pageSize: newPageSize, searchStr: rateSearchObj?.warehouse }));
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
                        <CustomerListTable customerData={customerData} handleCloseConfirm={handleCloseOfCustomersList} />
                    </DialogContent>
                </Dialog>
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={1000} // Adjust the duration as needed
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