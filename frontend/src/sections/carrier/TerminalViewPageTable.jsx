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
    setSelectedCarrierRowDetails,
    setOperationalMessage,
    setSelectedTeminalTabRowDetails,
    getPersonnelTerminalData,
    getAccessorialTerminalData,
    getQualityTerminalData,
    getRateTerminalData,
} from '../../redux/slices/carrier';
import { setTableBeingViewed } from '../../redux/slices/customer';
import { clearNotesState } from '../../redux/slices/note';
import NotesTable from '../customer/NotesTable';
import StationAccessorial from '../customer/StationAccessorial';
import StyledCheckbox from '../shared/StyledCheckBox';
import AddRate from '../rate/AddRate';
import TerminalPersonnelDetails from './TerminalPersonnelDetails';


// ----------------------------------------------------------------

export default function TerminalViewPageTable() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { terminalViewTabData, isLoading, currentTerminalTab, pagination, operationalMessage, error, selectedTerminalTabRowDetails, } = useSelector((state) => state.carrierdata);
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
    const personnelColumns = [
        {
            field: 'personnelName',
            headerName: 'Personnel Name',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'personType',
            headerName: 'Person Type',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'email',
            headerName: 'Email ID',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'officePhoneNo',
            headerName: 'Office Phone #',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'cellPhoneNo',
            headerName: 'Cell Phone #',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
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
                            mb: 0.5,
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
                                dispatch(setSelectedTeminalTabRowDetails(params.row));
                                setActionType('View');
                                setOpenEditDialog(true);
                            }} />
                        </Tooltip>
                        <Tooltip title={'Edit'} arrow>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 1 }} onClick={() => {
                                dispatch(setSelectedTeminalTabRowDetails(params?.row));
                                setOpenEditDialog(true);
                                setActionType('Edit');
                            }} />
                        </Tooltip>

                        <Tooltip title={'Delete'} arrow>
                            <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000' }} onClick={() => {
                                setActionType('Delete');
                                // dispatch(deleteCarrier(params?.row?.personnelId, () => {
                                //     dispatch(getTerminalCarrierData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: carrierSearchStr }));
                                // }));
                            }} />
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        }
    ];
    const qualityColumns = [
        {
            field: "totalShipments",
            headerName: "Total No of Shipments",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "onTimePercentage",
            headerName: "R&M On Time % ",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "lateShipment",
            headerName: "Late Shipments",
            minWidth: 400,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {

                const element = (
                    <Typography
                        sx={{
                            textDecoration: 'underline',
                            color: '#A22',
                        }}
                    >

                        {params?.row?.lateShipment}

                    </Typography>
                );
                return element;
            },
        },
        {
            field: "actions",
            headerName: "Action",
            minWidth: 150,
            flex: 1,
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
                                dispatch(setSelectedTeminalTabRowDetails(params.row));
                                setActionType('View');
                            }} />
                        </Tooltip>

                    </Box>
                );
                return element;
            },
        },
    ];
    const accessorialColumns = [
        {
            field: "accessorialName",
            headerName: "Accessorial Name",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "serviceNotOffered",
            headerName: "Service Not Offered",
            minWidth: 200,
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

                        <StyledCheckbox
                            sx={{ mt: -1.5 }}
                            checked={params?.row?.serviceNotOffered}
                            onChange={(e, i) => {
                                const isChecked = e.target.checked;
                                // here need to call api to post data
                            }} />

                    </Box>
                );
                return element;
            },
        },
        {
            field: "chargeType",
            headerName: "Charge Type",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "chargeValue",
            headerName: "Charges",
            minWidth: 400,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
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
                            mb: 0.5,
                        }}
                    >

                        <Iconify icon="icon-park-solid:notes" onClick={handleDialogOpen} sx={{ color: '#7fbfc4', cursor: 'pointer' }} />

                    </Box>
                );
                return element;
            },
        },
        {
            field: "actions",
            headerName: "Action",
            minWidth: 150,
            flex: 1,
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

                        <Tooltip title={'Edit'} arrow onClick={() => {
                            setActionType('Edit');
                            setOpenEditDialog(true);
                            dispatch(setSelectedTeminalTabRowDetails(params.row));
                        }}>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 2 }} />
                        </Tooltip>
                        <Tooltip title={'Delete'} arrow>
                            <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', }} onClick={() => {
                                // using callback to refresh table data after delete
                                // dispatch(deleteStationAccessorial(params?.row?.accessorialId, () => {
                                //     dispatch(getStationAccessorialData(selectedCustomerStationDetails?.entityId));
                                // }));
                            }}
                            />
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        },
    ];
    const rateColumns = [
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
            field: "rates",
            headerName: "Rates",
            minWidth: 300,
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
                            <Typography variant="normal" sx={{ width: "130px" }}>Rate Per 100 LB</Typography>
                            <Typography variant="normal" sx={{ width: "auto" }}>{params?.row?.ratePerPound}</Typography>
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
            field: "actions",
            headerName: "Action",
            minWidth: 110,
            flex: 1,
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
                                dispatch(setSelectedTeminalTabRowDetails(params.row));
                            }} />
                        </Tooltip>

                        <Tooltip title={'Delete'} arrow>
                            <Iconify icon="jam:delete-f" sx={{ color: '#000', }} />
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        },
    ];


    useEffect(() => {
        // Dispatch action to fetch rate dashboard data
        dispatch(setTableBeingViewed('personnel'));
    }, []);
    useEffect(() => {
        if (currentTerminalTab === 'personnel') {
            dispatch(clearNotesState());
            setTableColumns(personnelColumns);
            dispatch(getPersonnelTerminalData({ pageNo: pagination.page, pageSize: pagination.pageSize }));
        }
        if (currentTerminalTab === 'quality') {
            dispatch(clearNotesState());
            setTableColumns(qualityColumns);
            dispatch(getQualityTerminalData({ pageNo: pagination.page, pageSize: pagination.pageSize }));
        }
        if (currentTerminalTab === 'accessorial') {
            dispatch(clearNotesState());
            setTableColumns(accessorialColumns);
            dispatch(getAccessorialTerminalData({ pageNo: pagination.page, pageSize: pagination.pageSize }));
        }
        if (currentTerminalTab === 'rate') {
            dispatch(clearNotesState());
            setTableColumns(rateColumns);
            dispatch(getRateTerminalData({ pageNo: pagination.page, pageSize: pagination.pageSize }));
        }
    }, [currentTerminalTab]);
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
        // if (operationalMessage === 'Terminal deleted successfully') {
        //     dispatch(getTerminalCarrierData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: carrierSearchStr }));
        // }
    }, [operationalMessage])

    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
        notesRef.current = {};
        dispatch(setSelectedCarrierRowDetails({}));
    };
    const handleCloseEdit = () => {
        setOpenEditDialog(false);
        setActionType("");
        dispatch(setSelectedCarrierRowDetails({}));
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
                        rows={terminalViewTabData}
                        columns={tableColumns}
                        loading={isLoading}
                        getRowId={(row) => row?.personnelId || row?.accessorialId || row?.rateId || row.qualityId}
                        pagination
                        getRowHeight={() => 'auto'}
                        hideFooterSelectedRowCount
                        paginationMode="server"
                        paginationModel={paginationModel}
                        onPaginationModelChange={(newModel) => {
                            setPaginationModel(newModel);
                            dispatch(getPersonnelTerminalData({
                                pageNo: newModel.page + 1,
                                pageSize: newModel.pageSize,
                            }));
                        }}
                        onPageChange={(newPage) => {
                            dispatch(getPersonnelTerminalData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, }));
                        }}
                        onPageSizeChange={(newPageSize) => {
                            dispatch(getPersonnelTerminalData({ pageNo: 1, pageSize: newPageSize, }));
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
                            height: 'auto',
                            maxHeight: 'none',
                            maxWidth: 'none',
                        }
                    }}
                >
                    <DialogContent>
                        {
                            currentTerminalTab.toLowerCase() === 'personnel' && <TerminalPersonnelDetails type={actionType} handleCloseConfirm={handleCloseEdit} />
                        }
                        {
                            currentTerminalTab.toLowerCase() === 'accessorial' && <StationAccessorial type={actionType} handleCloseConfirm={handleCloseEdit} />
                        }
                        {
                            currentTerminalTab.toLowerCase() === 'rate' && <AddRate type={'Add'} handleCloseConfirm={handleCloseEdit} />
                        }
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