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
import { setSelectedCarrierRowDetails, setOperationalMessage, getTerminalCarrierData, setSelectedCarrierTabRowDetails, getAccessorialCarrierData } from '../../redux/slices/carrier';
import { setTableBeingViewed } from '../../redux/slices/customer';
import { clearNotesState } from '../../redux/slices/note';
import NotesTable from '../customer/NotesTable';
import StationAccessorial from '../customer/StationAccessorial';
import TerminalDetails from './TerminalDetails';

// ----------------------------------------------------------------

export default function CarrierViewTable() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { carrierViewTabData, isLoading, currentCarrierViewTab, pagination, operationalMessage, error, selectedCarrierTabRowDetails } = useSelector((state) => state.carrierdata);
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
    const terminalColumns = [
        {
            field: 'terminalName',
            headerName: 'Terminal Name',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'rmAccountNumber',
            headerName: 'RM Account #',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'airportCode',
            headerName: 'Airport Code',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'totalShipments',
            headerName: 'Total No of Shipments',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'onTimePercentage',
            headerName: 'R&M On Time % ',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'lateShipments',
            headerName: 'R&M Late Shipments',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const element = (
                    <Typography
                        sx={{ color: '#A22', textDecoration: 'underline', }}
                    >
                        {params?.row?.lateShipments}
                    </Typography>
                );
                return element;
            },
        },
        {
            field: 'address',
            headerName: 'Address',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            // renderCell: (params) => {
            //     const element = (
            //         <Typography
            //         >
            //             {params?.row?.tsa === 'Y' ? 'Yes' : 'No'}
            //         </Typography>
            //     );
            //     return element;
            // },
        },
        {
            field: 'city',
            headerName: 'City',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'state',
            headerName: 'State',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'zipCodes',
            headerName: 'Zip Codes',
            width: 700,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const element = (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} alignItems={'center'} >
                        {params.row.ranges?.map((range, index) => (
                            <Chip key={index} label={range} size="small" sx={{ bgcolor: 'rgba(224, 242, 255, 1)', mt: '2px !important', mb: '2px !important' }} />
                        ))}
                        <Typography variant="normal">
                            {params.row.zipCodes?.join(", ")}
                        </Typography>
                    </Stack>
                );
                return element;
            }
        },
        {
            field: "phoneNumber",
            headerName: "Phone #",
            minWidth: 150,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "faxNumber",
            headerName: "Fax #",
            minWidth: 150,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "openTime",
            headerName: "Open Time",
            minWidth: 110,
            flex: 1,
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

                        {(params?.row?.openTime === '00:00:00') ? '' : params?.row?.openTime?.substring(0, 5)}

                    </Box>
                );
                return element;
            },
        },
        {
            field: "closeTime",
            headerName: "Close Time",
            minWidth: 110,
            flex: 1,
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

                        {(params?.row?.closeTime === '00:00:00') ? '' : params?.row?.closeTime?.substring(0, 5)}

                    </Box>
                );
                return element;
            },
        },
        {
            field: "status",
            headerName: "Status",
            minWidth: 150,
            cellClassName: 'center-status-cell',
            headerAlign: 'center',
            renderCell: (params) => {
                const element = (
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                        }}
                    >
                        <Chip label={params?.row?.status?.toLowerCase() === 'y' ? 'Active' : 'Inactive'} sx={{ backgroundColor: (params?.row?.status?.toLowerCase() !== 'y') ? 'rgba(143, 143, 143, 1)' : 'rgba(92, 172, 105, 1)', }} />
                    </Box>
                );
                return element;
            },
        },
        {
            field: "hours",
            headerName: "Hrs",
            minWidth: 110,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
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
                                dispatch(setSelectedCarrierTabRowDetails(params.row));
                                setActionType('View');
                                setOpenEditDialog(true);
                            }} />
                        </Tooltip>
                        <Tooltip title={'Edit'} arrow>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 1 }} onClick={() => {
                                dispatch(setSelectedCarrierTabRowDetails(params?.row));
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
                            dispatch(setSelectedCarrierTabRowDetails(params.row));
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


    useEffect(() => {
        // Dispatch action to fetch rate dashboard data
        dispatch(setTableBeingViewed('terminal'));
        if (currentCarrierViewTab === 'terminal') {
            dispatch(getTerminalCarrierData({ pageNo: pagination.page, pageSize: pagination.pageSize }));
        }
    }, []);
    useEffect(() => {
        if (currentCarrierViewTab === 'terminal') {
            dispatch(clearNotesState());
            setTableColumns(terminalColumns);
            dispatch(getTerminalCarrierData({ pageNo: pagination.page, pageSize: pagination.pageSize }));
        }
        if (currentCarrierViewTab === 'accessorial') {
            dispatch(clearNotesState());
            setTableColumns(accessorialColumns);
            dispatch(getAccessorialCarrierData({ pageNo: pagination.page, pageSize: pagination.pageSize }));
        }
    }, [currentCarrierViewTab]);
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
        if (operationalMessage === 'Terminal deleted successfully') {
            dispatch(getTerminalCarrierData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: carrierSearchStr }));
        }
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
                        rows={carrierViewTabData}
                        columns={tableColumns}
                        loading={isLoading}
                        getRowId={(row) => row?.terminalId || row?.accessorialId}
                        pagination
                        getRowHeight={() => 'auto'}
                        hideFooterSelectedRowCount
                        paginationMode="server"
                        paginationModel={paginationModel}
                        onPaginationModelChange={(newModel) => {
                            setPaginationModel(newModel);
                            dispatch(getTerminalCarrierData({
                                pageNo: newModel.page + 1,
                                pageSize: newModel.pageSize,
                                searchStr: carrierSearchStr
                            }));
                        }}
                        onPageChange={(newPage) => {
                            dispatch(getTerminalCarrierData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, searchStr: carrierSearchStr }));
                        }}
                        onPageSizeChange={(newPageSize) => {
                            dispatch(getTerminalCarrierData({ pageNo: 1, pageSize: newPageSize, searchStr: carrierSearchStr }));
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
                            currentCarrierViewTab === 'accessorial' ? <StationAccessorial type={actionType} handleCloseConfirm={handleCloseEdit} selectedStationTabRowDetails={selectedCarrierTabRowDetails} /> : 
                            <TerminalDetails type={actionType} handleCloseConfirm={handleCloseEdit} selectedCarrierTabRowDetails={selectedCarrierTabRowDetails} />
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