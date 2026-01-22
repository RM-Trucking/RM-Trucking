import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import {
    Box, Stack, Typography, Button, Dialog,
    DialogContent, Tooltip, Divider, Snackbar
} from '@mui/material';
import { useDispatch, useSelector } from '../../redux/store';
import Iconify from '../../components/iconify';
import ConfirmDialog from '../../components/confirm-dialog';
import { PATH_DASHBOARD } from '../../routes/paths';
import { getCustomerStationData, setSelectedCustomerStationRowDetails, deleteStation } from '../../redux/slices/customer';
import { clearNotesState } from '../../redux/slices/note';
import CustomNoRowsOverlay from '../shared/CustomNoRowsOverlay';
import SharedSearchField from "../shared/SharedSearchField";
import SharedStationDetails from './SharedStationDetails';
import NotesTable from './NotesTable';

export default function CustomerViewStationTable() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const stationRows = useSelector((state) => state?.customerdata?.stationRows);
    const customerLoading = useSelector((state) => state?.customerdata?.isLoading);
    const error = useSelector((state) => state?.customerdata?.error);
    const pagination = useSelector((state) => state?.customerdata?.pagination);
    const operationalMessage = useSelector((state) => state?.customerdata?.operationalMessage);
    const stationSearchStr = useSelector((state) => state?.customerdata?.stationSearchStr);
    // for customer details
    const selectedCustomerRowDetails = useSelector((state) => state?.customerdata?.selectedCustomerRowDetails);
    const selectedCustomerStationDetails = useSelector((state) => state?.customerdata?.selectedCustomerStationDetails);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [actionType, setActionType] = useState('');
    // pagination model
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const [openNotesDilog, setOpenNotesDialog] = useState(false);
    const notesRef = useRef({});
    // snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // datagrid columns
    const columns = [
        {
            field: "stationName",
            headerName: "Station Name",
            minWidth: 120,
            flex: 1
        },
        {
            field: "rmAccountNumber",
            headerName: "RM Account #",
            minWidth: 110,
            flex: 1,
            renderCell: (params) => {
                const element = (
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                            width: '100%',
                        }}
                    >
                        {params?.row?.rmAccountNumber}
                    </Box>
                );
                return element;
            },
        },
        {
            field: "airportCode",
            headerName: "Airport Code",
            minWidth: 110,
            flex: 1
        },
        {
            field: "addresses",
            headerName: "Address",
            minWidth: 110,
            flex: 1,
            renderCell: (params) => {
                const element = (
                    <Typography variant='normal'>
                        {`${params?.row?.addresses?.[0]?.line1}, ${params?.row?.addresses?.[0]?.line2}`}
                    </Typography>
                );
                return element;
            },
        },
        {
            field: "city",
            headerName: "City",
            minWidth: 110,
            align: 'center',
            renderCell: (params) => {
                const element = (
                    <Typography variant='normal'>
                        {`${params?.row?.addresses?.[0]?.city}`}
                    </Typography>
                );
                return element;
            },
        },
        {
            field: "state",
            headerName: "State",
            minWidth: 110,
            flex: 1,
            renderCell: (params) => {
                const element = (
                    <Typography variant='normal'>
                        {`${params?.row?.addresses?.[0]?.state}`}
                    </Typography>
                );
                return element;
            },
        },
        {
            field: "zipCode",
            headerName: "ZipCode",
            minWidth: 110,
            flex: 1,
            renderCell: (params) => {
                const element = (
                    <Typography variant='normal'>
                        {`${params?.row?.addresses?.[0]?.zipCode}`}
                    </Typography>
                );
                return element;
            },
        },
        // {
        //     field: "zip4Code",
        //     headerName: "Zip4 Code",
        //     minWidth: 110,
        //     flex: 1,
        // },
        {
            field: "phoneNumber",
            headerName: "Phone #",
            minWidth: 110,
            flex: 1,
        },
        {
            field: "faxNumber",
            headerName: "Fax #",
            minWidth: 110,
            flex: 1,
        },
        {
            field: "openTime",
            headerName: "Open Time",
            minWidth: 110,
            flex: 1,
            renderCell: (params) => {

                const element = (
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                        }}
                    >

                        {params?.row?.openTime?.substring(0, 5)}

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
            renderCell: (params) => {

                const element = (
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                        }}
                    >

                        {params?.row?.closeTime?.substring(0, 5)}

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
        },
        {
            field: "warehouseDetail",
            headerName: "Warehouse",
            minWidth: 110,
            flex: 1,
        },
        {
            field: "notes",
            headerName: "Notes",
            minWidth: 100,
            flex: 1,
            renderCell: (params) => {
                const handleDialogOpen = () => {
                    setOpenNotesDialog(true);
                    setOpenConfirmDialog(true);
                    notesRef.current = params?.row;
                }
                const element = (
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                        }}
                    >

                        <Iconify icon="icon-park-solid:notes" onClick={handleDialogOpen} sx={{ color: '#7fbfc4', marginTop: '15px', cursor: 'pointer' }} />

                    </Box>
                );
                return element;
            },
        },
        {
            field: "actions",
            headerName: "Action",
            minWidth: 110,
            flex: 1,
            renderCell: (params) => {
                const element = (
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                        }}
                    >
                        <Tooltip title={'View'} arrow>
                            <Iconify icon="carbon:view-filled" sx={{ color: '#000', marginTop: '15px', mr: 2 }} onClick={() => {
                                setActionType('View');
                                dispatch(setSelectedCustomerStationRowDetails(params?.row));
                                localStorage.setItem('stationId', params?.row?.stationId);
                                navigate(PATH_DASHBOARD?.maintenance?.customerMaintenance?.customerStationView);
                            }} />
                        </Tooltip>
                        <Tooltip title={'Edit'} arrow>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', marginTop: '15px', mr: 2 }} onClick={() => {
                                dispatch(setSelectedCustomerStationRowDetails(params?.row));
                                localStorage.setItem('stationId', params?.row?.stationId);
                                setActionType('Edit');
                                setOpenConfirmDialog(true);
                            }} />
                        </Tooltip>
                        <Tooltip title={'Delete'} arrow>
                            <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', marginTop: '15px' }} onClick={() => {
                                localStorage.setItem('stationId', params?.row?.stationId);
                                // using callback to refresh table data after delete
                                dispatch(deleteStation(params?.row?.stationId, () => {
                                    dispatch(getCustomerStationData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: stationSearchStr, customerId: selectedCustomerRowDetails?.customerId || parseInt(localStorage.getItem('customerId'), 10) }));
                                }));
                            }} />
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        },
    ];

    // call api to get table data
    useEffect(() => {
        dispatch(clearNotesState());
        dispatch(getCustomerStationData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: stationSearchStr, customerId: selectedCustomerRowDetails?.customerId || parseInt(localStorage.getItem('customerId'), 10) }));
    }, []);

    useEffect(() => {
        console.log('customer rows updated', stationRows);
    }, [stationRows])

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
            setSnackbarMessage(error.message);
            setSnackbarOpen(true);
        }
    }, [error])
    // operational message on customer
    useEffect(() => {
        if (operationalMessage) {
            setSnackbarMessage(operationalMessage);
            setSnackbarOpen(true);
        }
    }, [operationalMessage])

    // on click of add station button
    const onClickOfAddStation = () => {
        dispatch(setSelectedCustomerStationRowDetails({}));
        setActionType('Add');
        setOpenConfirmDialog(true);
    };
    // dialog actions and functions
    const handleCloseConfirm = () => {
        setActionType('');
        setOpenConfirmDialog(false);
        setOpenNotesDialog(false);
    };


    return (<>
        <Stack flexDirection={'row'} alignItems={'center'} justifyContent={'space-between'} sx={{ mt: 4 }}>
            <Typography variant="h7" fontWeight={700}>Station Details</Typography>
            <Button
                variant="outlined"
                onClick={() => onClickOfAddStation()}
                sx={{
                    height: '22px',
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
                    },
                }}
            >
                Add Station
            </Button>
        </Stack>
        <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)', mt: 1 }} />
        <SharedSearchField page="station" />
        <Box sx={{ height: 400, width: "100%", flex: 1, mt: 1 }}>
            <DataGrid
                paginationMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={(newModel) => {
                    setPaginationModel(newModel);
                    dispatch(getCustomerStationData({
                        pageNo: newModel.page + 1,
                        pageSize: newModel.pageSize,
                        searchStr: stationSearchStr,
                        customerId: selectedCustomerRowDetails?.customerId
                    }));
                }}
                rows={stationRows}
                columns={columns}
                loading={customerLoading}
                getRowId={(row) => row?.stationId}
                hideFooterSelectedRowCount
                onPageChange={(newPage) => {
                    dispatch(getCustomerStationData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, searchStr: stationSearchStr, customerId: selectedCustomerRowDetails?.customerId }));
                }}
                onPageSizeChange={(newPageSize) => {
                    dispatch(getCustomerStationData({ pageNo: 1, pageSize: newPageSize, searchStr: stationSearchStr, customerId: selectedCustomerRowDetails?.customerId }));
                }}
                pageSizeOptions={[5, 10, 50, 100]}
                rowCount={parseInt(pagination?.totalRecords || '0', 10)}
                pagination
                slots={{
                    noRowsOverlay: CustomNoRowsOverlay,
                }}
            />
        </Box>
        {/* dialog for station details  */}
        <Dialog open={openConfirmDialog} onClose={handleCloseConfirm} onKeyDown={(event) => {
            if (event.key === 'Escape') {
                handleCloseConfirm();
            }
        }}
            sx={{
                '& .MuiDialog-paper': { // Target the paper class
                    width: (openNotesDilog) ? "1000px" : '1545px',
                    height: (openNotesDilog) ? '720px' : '550px',
                    maxHeight: 'none',
                    maxWidth: 'none',
                }
            }}
        >
            <DialogContent>
                {openNotesDilog && <NotesTable notes={notesRef.current} handleCloseConfirm={handleCloseConfirm} />}
                {!openNotesDilog && <SharedStationDetails type={actionType} handleCloseConfirm={handleCloseConfirm} selectedCustomerStationDetails={selectedCustomerStationDetails} customerId={selectedCustomerRowDetails.customerId} />}
            </DialogContent>
        </Dialog>
        <Snackbar
            open={snackbarOpen}
            autoHideDuration={1000} // Adjust the duration as needed
            onClose={() => setSnackbarOpen(false)}
            message={snackbarMessage}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        />
    </>)
}
