import { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Chip, Stack, Tooltip, Dialog, DialogContent, Snackbar, Divider, IconButton

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
    setSelectedFuelSurchargeRowDetails,
    getFuelSurchargeData,
    deleteFuelSurcharge,
    getCustomerFuelSurchargeData,
    deleteCustomerFuelSurcharge, setOperationalMessage,
    setError, getCustomerList,
} from '../../redux/slices/fuel';
import { setTableBeingViewed } from '../../redux/slices/customer';
import FuelSurchargeDetails from './FuelSurchargeDetails';

// ----------------------------------------------------------------

export default function FuelSurchargeHomeTable() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { isLoading, error, fuelSuccess, fuelSurchargeData, operationalMessage, fuelSurchargeSearchStr, pagination, currentFuelSurchargeTab, selectedFuelSurchargeRowDetails } = useSelector((state) => state.fueldata);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [actionType, setActionType] = useState('');
    // pagination model
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    // snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [tableColumns, setTableColumns] = useState([]);


    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };

    const activeFuelColumns = [
        {
            field: 'createdAt',
            headerName: 'Created At',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const rawValue = params?.value;
                if (!rawValue) return '';

                const dateObj = new Date(rawValue);
                const formatted = dateObj.toLocaleDateString('en-CA');

                return (
                    <Box sx={{ color: 'inherit', fontWeight: 'normal' }}>
                        {formatted}
                    </Box>
                );
            }
        },
        {
            field: 'effectiveDate',
            headerName: 'Effective Date',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const rawValue = params?.value;
                if (!rawValue) return '';

                const dateObj = new Date(rawValue);
                const formatted = dateObj.toLocaleDateString('en-CA');

                return (
                    <Box sx={{ color: 'inherit', fontWeight: 'normal' }}>
                        {formatted}
                    </Box>
                );
            }
        },
        {
            field: 'effectiveTime',
            headerName: 'Effective Time',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const element = (
                    <Typography
                    >
                        {params?.row?.effectiveTime}
                    </Typography>
                );
                return element;
            },
        },
        {
            field: 'fuelPercentage',
            headerName: 'Fuel Percentage',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                return (
                    <Box>
                        {params.value}
                    </Box>
                );
            }
        },
        {
            field: 'expireDate',
            headerName: 'Expiry Date',
            width: 100,
            cellClassName: 'center-status-cell',
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const rawValue = params?.value;
                if (!rawValue) return '';

                const dateObj = new Date(rawValue);
                const formatted = dateObj.toLocaleDateString('en-CA');

                return (
                    <Box sx={{ color: 'inherit', fontWeight: 'normal' }}>
                        {formatted}
                    </Box>
                );
            }
        },
        {
            field: 'expireTime',
            headerName: 'Expiry Time',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const element = (
                    <Typography
                    >
                        {params?.row?.expireTime}
                    </Typography>
                );
                return element;
            },
        },
        {
            field: "updatedBy",
            headerName: "User",
            minWidth: 100,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            filterable: false,
            sortable: false,
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
                    <>
                        {params.row.expireDate === null && params.row.expireTime === null && <Box>
                            <Tooltip title={'Edit'} arrow sx={{ mr: 2 }}>
                                <IconButton onClick={(e) => {
                                    e.stopPropagation();
                                    dispatch(setSelectedFuelSurchargeRowDetails(params?.row));
                                    setOpenEditDialog(true);
                                    setActionType('Edit');
                                }}>
                                    <Iconify icon="tabler:edit" sx={{ color: '#000', pointerEvents: 'none' }} />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={'Delete'} arrow>
                                <IconButton
                                    onClick={() => {
                                        setActionType('Delete');
                                        dispatch(deleteFuelSurcharge(params?.row?.fuelSurchargeId));
                                    }}
                                    sx={{ display: 'inline-flex', cursor: 'pointer' }}>
                                    <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', pointerEvents: 'none' }} />
                                </IconButton>
                            </Tooltip>
                        </Box>}
                    </>
                );
                return element;
            },
        }
    ];
    const customerFuelColumns = [
        {
            field: 'createdAt',
            headerName: 'Created At',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const rawValue = params?.value;
                if (!rawValue) return '';

                const dateObj = new Date(rawValue);
                const formatted = dateObj.toLocaleDateString('en-CA');

                return (
                    <Box sx={{ color: 'inherit', fontWeight: 'normal' }}>
                        {formatted}
                    </Box>
                );
            }
        },
        {
            field: 'effectiveDate',
            headerName: 'Effective Date',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const rawValue = params?.value;
                if (!rawValue) return '';

                const dateObj = new Date(rawValue);
                const formatted = dateObj.toLocaleDateString('en-CA');

                return (
                    <Box sx={{ color: 'inherit', fontWeight: 'normal' }}>
                        {formatted}
                    </Box>
                );
            }
        },
        {
            field: 'effectiveTime',
            headerName: 'Effective Time',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const element = (
                    <Typography
                    >
                        {params?.row?.effectiveTime}
                    </Typography>
                );
                return element;
            },
        },
        {
            field: 'customerName',
            headerName: 'Customer',
            width: 150,
            align: 'center',
            cellClassName: 'center-status-cell',
            sortable: false,
            filterable: false,
        },
        {
            field: 'stations',
            headerName: 'Staion',
            width: 150,
            align: 'center',
            cellClassName: 'center-status-cell',
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                // have to add customer list 
                const element = (<>
                    {(params?.row?.stations?.length && params?.row?.stations?.length > 1)
                        ?
                        <Stack sx={{ fontWeight: 'bold', bgcolor: 'rgba(224, 242, 255, 1)', p: 1, cursor: 'pointer' }} flexDirection={'row'} alignItems={'center'}>
                            <Iconify icon="lsicon:user-crowd-filled" sx={{ color: '#000', mr: 1 }} />
                            <Typography variant='normal'>{params?.row?.stations?.length}</Typography>
                        </Stack>
                        :
                        <Typography variant='normal'>{params?.row?.stations?.[0]?.stationName}</Typography>
                    }
                </>);
                return element;
            }
        },
        {
            field: 'fuelPercentage',
            headerName: 'Fuel Percentage',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                return (
                    <Box>
                        {params.value}
                    </Box>
                );
            }
        },
        {
            field: 'expireDate',
            headerName: 'Expiry Date',
            width: 100,
            cellClassName: 'center-status-cell',
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const rawValue = params?.value;
                if (!rawValue) return '';

                const dateObj = new Date(rawValue);
                const formatted = dateObj.toLocaleDateString('en-CA');

                return (
                    <Box sx={{ color: 'inherit', fontWeight: 'normal' }}>
                        {formatted}
                    </Box>
                );
            }
        },
        {
            field: 'expireTime',
            headerName: 'Expiry Time',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const element = (
                    <Typography
                    >
                        {params?.row?.expireTime}
                    </Typography>
                );
                return element;
            },
        },
        {
            field: "updatedBy",
            headerName: "User",
            minWidth: 100,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            filterable: false,
            sortable: false,
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
                    <>
                        {params.row.expireDate === null && params.row.expireTime === null && <Box>
                            <Tooltip title={'Edit'} arrow sx={{ mr: 2 }}>
                                <IconButton onClick={(e) => {
                                    e.stopPropagation();
                                    dispatch(setSelectedFuelSurchargeRowDetails(params?.row));
                                    setOpenEditDialog(true);
                                    setActionType('Edit');
                                }}>
                                    <Iconify icon="tabler:edit" sx={{ color: '#000', pointerEvents: 'none' }} />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={'Delete'} arrow>
                                <IconButton
                                    onClick={() => {
                                        setActionType('Delete');
                                        dispatch(deleteCustomerFuelSurcharge(params?.row?.customerFuelSurchargeId));
                                    }}
                                    sx={{ display: 'inline-flex', cursor: 'pointer' }}>
                                    <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', pointerEvents: 'none' }} />
                                </IconButton>
                            </Tooltip>
                        </Box>}
                    </>
                );
                return element;
            },
        }
    ];

    useEffect(() => {
        // Dispatch action to fetch rate dashboard data
        dispatch(setTableBeingViewed('fuel'));
        dispatch(getCustomerList(""));
        // if (currentFuelSurchargeTab === 'active') {
        dispatch(getFuelSurchargeData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: fuelSurchargeSearchStr, }));
        // }
    }, []);
    useEffect(() => {
        if (currentFuelSurchargeTab === 'active') {
            setTableColumns(activeFuelColumns);
            dispatch(getFuelSurchargeData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: fuelSurchargeSearchStr, }));
        }
        if (currentFuelSurchargeTab === 'customer') {
            setTableColumns(customerFuelColumns);
            dispatch(getCustomerFuelSurchargeData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: fuelSurchargeSearchStr, }));
        }
    }, [currentFuelSurchargeTab]);
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
            setSnackbarMessage(`${(error?.error && error?.message) ? `${error?.error}. ${error?.message}` : `${error.error || error.message}`}`);
            setSnackbarOpen(true);
        }
    }, [error])
    // operational message on customer
    useEffect(() => {
        if (operationalMessage) {
            setSnackbarMessage(operationalMessage);
            setSnackbarOpen(true);
        }
        if (operationalMessage === 'Fuel surcharge deleted successfully.' || operationalMessage === "Fuel surcharge updated successfully" || operationalMessage === 'Fuel surcharge created successfully.') {
            dispatch(getFuelSurchargeData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: fuelSurchargeSearchStr, }));
        }
        if (operationalMessage === 'Customer fuel surcharge deleted successfully.' || operationalMessage === "Customer fuel surcharge updated successfully" || operationalMessage === 'Customer fuel surcharge created successfully.') {
            dispatch(getCustomerFuelSurchargeData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: fuelSurchargeSearchStr, }));
        }
    }, [operationalMessage])

    const handleCloseEdit = () => {
        setOpenEditDialog(false);
        setActionType("");
        dispatch(setSelectedFuelSurchargeRowDetails({}));
    };
    useEffect(() => {
        console.log('rows', fuelSurchargeData);
    }, [fuelSurchargeData])

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
                        rows={fuelSurchargeData}
                        columns={tableColumns}
                        loading={isLoading}
                        getRowId={(row) => row?.fuelSurchargeId || row?.customerFuelSurchargeId}
                        pagination
                        getRowHeight={() => 'auto'}
                        hideFooterSelectedRowCount
                        paginationMode="server"
                        paginationModel={paginationModel}
                        onPaginationModelChange={(newModel) => {
                            setPaginationModel(newModel);
                            if (currentFuelSurchargeTab === 'active') {
                                dispatch(getFuelSurchargeData({
                                    pageNo: newModel.page + 1,
                                    pageSize: newModel.pageSize,
                                    searchStr: fuelSurchargeSearchStr,
                                }));
                            }
                            if (currentFuelSurchargeTab === 'customer') {
                                dispatch(getCustomerFuelSurchargeData({
                                    pageNo: newModel.page + 1,
                                    pageSize: newModel.pageSize,
                                    searchStr: fuelSurchargeSearchStr,
                                }));
                            }
                        }}
                        onPageChange={(newPage) => {
                            if (currentFuelSurchargeTab === 'active') {
                                dispatch(getFuelSurchargeData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, searchStr: fuelSurchargeSearchStr, }));
                            }
                            if (currentFuelSurchargeTab === 'customer') {
                                dispatch(getCustomerFuelSurchargeData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, searchStr: fuelSurchargeSearchStr, }));
                            }
                        }}
                        onPageSizeChange={(newPageSize) => {
                            if (currentFuelSurchargeTab === 'active') {
                                dispatch(getFuelSurchargeData({ pageNo: 1, pageSize: newPageSize, searchStr: fuelSurchargeSearchStr, }));
                            }
                            if (currentFuelSurchargeTab === 'customer') {
                                dispatch(getCustomerFuelSurchargeData({ pageNo: 1, pageSize: newPageSize, searchStr: fuelSurchargeSearchStr, }));
                            }
                        }}
                        pageSizeOptions={[5, 10, 50, 100]}
                        rowCount={parseInt(pagination?.totalRecords || '0', 10)}
                        autoHeight
                    />
                </Box>

                <Dialog open={openEditDialog} onClose={handleCloseEdit} onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        handleCloseEdit();
                    }
                }}
                    sx={{
                        '& .MuiDialog-paper': { // Target the paper class
                            width: '1545px',
                            height: '250px',
                            maxHeight: 'none',
                            maxWidth: 'none',
                        }
                    }}
                >
                    <DialogContent>
                        <FuelSurchargeDetails type={actionType} handleCloseConfirm={handleCloseEdit} selectedFuelSurchargeRowDetails={selectedFuelSurchargeRowDetails} />
                    </DialogContent>
                </Dialog>

                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={3000} // Adjust the duration as needed
                    onClose={() => {
                        setSnackbarOpen(false);
                        dispatch(setOperationalMessage());
                        dispatch(setError());
                    }}
                    message={snackbarMessage}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                />
            </ErrorBoundary>
        </>
    );
}