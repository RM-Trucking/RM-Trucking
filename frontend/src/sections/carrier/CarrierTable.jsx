import { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Chip, Stack, Tooltip, Dialog, DialogContent, Snackbar, Divider

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
    setSelectedCarrierRowDetails, getCarrierData, setOperationalMessage,
    patchCarrierStatus, setSelectedRowCarrierType, setCarrierViewTabData
} from '../../redux/slices/carrier';
import { setTableBeingViewed } from '../../redux/slices/customer';
import { clearNotesState } from '../../redux/slices/note';
import NotesTable from '../customer/NotesTable';
import CarrierDetails from './CarrierDetails';

// ----------------------------------------------------------------

export default function RateTable() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { carrierData, isLoading, currentCarrierTab, pagination, carrierSearchStr, operationalMessage, error, selectedCarrierRowDetails } = useSelector((state) => state.carrierdata);
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
    const notesRef = useRef({});

    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const activeCarrireColumns = [
        {
            field: 'carrierId',
            headerName: 'Carrier ID',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'carrierName',
            headerName: 'Carrier Name',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'tsaCertified',
            headerName: 'TSA',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const element = (
                    <Typography
                    >
                        {params?.row?.tsaCertified === 'Y' ? 'Yes' : 'No'}
                    </Typography>
                );
                return element;
            },
        },
        {
            field: 'insuranceExpiry',
            headerName: 'Insurance Expiry Date',
            width: 200,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                // 1. Get the raw value (e.g., "2026-03-10 00:00:00.000000")
                const rawValue = params?.value;

                // 2. Return nothing if the date is missing
                if (!rawValue) return '';

                // 3. Convert to Date object and format
                const dateObj = new Date(rawValue);
                const formatted = dateObj.toLocaleDateString('en-CA'); // Result: "2026-03-10"

                // 4. MUST use 'return' to display the formatted value
                return (
                    <Box>
                        {formatted}
                    </Box>
                );
            }
        },
        {
            field: 'carrierStatus',
            headerName: 'Status',
            width: 100,
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const element = (
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                        }}
                    >
                        <Chip label={params?.row?.carrierStatus.charAt(0).toUpperCase() + params?.row?.carrierStatus.slice(1)} sx={{ backgroundColor: (params?.row?.carrierStatus?.toLowerCase() === 'active') ? 'rgba(92, 172, 105, 1)' : 'rgba(143, 143, 143, 1)', }} />
                    </Box>
                );
                return element;
            },
        },
        {
            field: "notes",
            headerName: "Notes",
            minWidth: 100,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const handleDialogOpen = () => {
                    setOpenConfirmDialog(true);
                    notesRef.current = params?.row;
                }
                const element = (
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                            justifyContent: 'center',
                            mb: 0.5
                        }}
                    >

                        <Iconify icon="icon-park-solid:notes" onClick={handleDialogOpen} sx={{ color: '#7fbfc4', cursor: 'pointer' }} />

                    </Box>
                );
                return element;
            },
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
                                dispatch(setCarrierViewTabData([]));
                                dispatch(setSelectedCarrierRowDetails(params.row));
                                const ltlKeywords = ["LTL Carrier", "Truck Load Carriers", "Dedicated Carriers"];
                                const result = ltlKeywords.some(keyword => params.row.carrierType.includes(keyword))
                                    ? "LTL"
                                    : "Airport";
                                dispatch(setSelectedRowCarrierType(result));
                                localStorage.setItem('carrierId', params?.row?.carrierId);
                                setActionType('View');
                                navigate(PATH_DASHBOARD?.maintenance?.carrierMaintenance?.carrierView);
                            }} sx={{ display: 'inline-flex', cursor: 'pointer' }} >
                                <Iconify icon="carbon:view-filled" sx={{ color: '#000', mr: 2 }} />
                            </Box>
                        </Tooltip>
                        <Tooltip title={'Edit'} arrow>
                            <Box onClick={(e) => {
                                e.stopPropagation();
                                dispatch(setSelectedCarrierRowDetails(params?.row));
                                setOpenEditDialog(true);
                                localStorage.setItem('carrierId', params?.row?.carrierId);
                                setActionType('Edit');

                            }} sx={{ display: 'inline-flex', cursor: 'pointer' }}>
                                <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 1 }} />
                            </Box>
                        </Tooltip>

                        {currentCarrierTab === 'active' && <Tooltip title={'Delete'} arrow>
                            <Box
                                onClick={() => {
                                    setActionType('Delete');
                                    dispatch(patchCarrierStatus({ 'status': 'Inactive' }, params?.row?.carrierId));
                                }}
                                sx={{ display: 'inline-flex', cursor: 'pointer' }}>
                                <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000' }} />
                            </Box>
                        </Tooltip>}
                    </Box>
                );
                return element;
            },
        }
    ];

    useEffect(() => {
        // Dispatch action to fetch rate dashboard data
        dispatch(setTableBeingViewed('carrier'));
        if (currentCarrierTab === 'active') {
            dispatch(getCarrierData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: carrierSearchStr, status: currentCarrierTab.charAt(0).toUpperCase() + currentCarrierTab.slice(1) }));
        }
    }, []);
    useEffect(() => {
        if (currentCarrierTab === 'active') {
            dispatch(clearNotesState());
            setTableColumns(activeCarrireColumns);
            dispatch(getCarrierData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: carrierSearchStr, status: currentCarrierTab.charAt(0).toUpperCase() + currentCarrierTab.slice(1) }));
        }
        if (currentCarrierTab === 'inactive') {
            dispatch(clearNotesState());
            setTableColumns(activeCarrireColumns);
            dispatch(getCarrierData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: carrierSearchStr, status: currentCarrierTab.charAt(0).toUpperCase() + currentCarrierTab.slice(1) }));
        }
        if (currentCarrierTab === 'incomplete') {
            dispatch(clearNotesState());
            setTableColumns(activeCarrireColumns);
            dispatch(getCarrierData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: carrierSearchStr, status: currentCarrierTab.charAt(0).toUpperCase() + currentCarrierTab.slice(1) }));
        }
    }, [currentCarrierTab]);
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
        if (operationalMessage === 'Carrier deleted successfully' || operationalMessage === "Carrier updated successfully" || operationalMessage === 'Carrier Status changed successfully.') {
            dispatch(getCarrierData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: carrierSearchStr, status: currentCarrierTab.charAt(0).toUpperCase() + currentCarrierTab.slice(1) }));
        }
    }, [operationalMessage])

    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
        notesRef.current = {};
        // dispatch(setSelectedCarrierRowDetails({}));
    };
    const handleCloseEdit = () => {
        setOpenEditDialog(false);
        setActionType("");
        // dispatch(setSelectedCarrierRowDetails({}));
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
                        rows={carrierData}
                        columns={tableColumns}
                        loading={isLoading}
                        getRowId={(row) => row?.carrierId}
                        pagination
                        getRowHeight={() => 'auto'}
                        hideFooterSelectedRowCount
                        paginationMode="server"
                        paginationModel={paginationModel}
                        onPaginationModelChange={(newModel) => {
                            setPaginationModel(newModel);
                            dispatch(getCarrierData({
                                pageNo: newModel.page + 1,
                                pageSize: newModel.pageSize,
                                searchStr: carrierSearchStr,
                                status: currentCarrierTab.charAt(0).toUpperCase() + currentCarrierTab.slice(1)
                            }));
                        }}
                        onPageChange={(newPage) => {
                            dispatch(getCarrierData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, searchStr: carrierSearchStr, status: currentCarrierTab.charAt(0).toUpperCase() + currentCarrierTab.slice(1) }));
                        }}
                        onPageSizeChange={(newPageSize) => {
                            dispatch(getCarrierData({ pageNo: 1, pageSize: newPageSize, searchStr: carrierSearchStr, status: currentCarrierTab.charAt(0).toUpperCase() + currentCarrierTab.slice(1) }));
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
                            width: '1000px',
                            height: '80%',
                            maxHeight: 'none',
                            maxWidth: 'none',
                        }
                    }}
                >
                    <DialogContent>
                        <>
                            <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                                <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Carrier Notes</Typography>
                                <Iconify icon="carbon:close" onClick={() => handleCloseConfirm()} sx={{ cursor: 'pointer' }} />
                            </Stack>
                            <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
                        </>
                        <Box sx={{ pt: 2 }}>
                            <NotesTable notes={notesRef.current} handleCloseConfirm={handleCloseConfirm} />
                        </Box>
                    </DialogContent>
                </Dialog>
                <Dialog open={openEditDialog} onClose={handleCloseEdit} onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        handleCloseEdit();
                    }
                }}
                    sx={{
                        '& .MuiDialog-paper': { // Target the paper class
                            width: '1545px',
                            height: '520px',
                            maxHeight: 'none',
                            maxWidth: 'none',
                        }
                    }}
                >
                    <DialogContent>
                        <CarrierDetails type={actionType} handleCloseConfirm={handleCloseEdit} selectedCarrierRowDetails={selectedCarrierRowDetails} />
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