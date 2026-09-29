import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { alpha, styled } from '@mui/material/styles';
import { Box, Switch, Stack, Alert, IconButton, Chip, Tooltip, Divider, Dialog, DialogContent, Snackbar, MenuItem } from '@mui/material';
import { useDispatch, useSelector } from '../../redux/store';
import Iconify from '../../components/iconify';
import AirportDetails from './AirportDetails';
import { setSelectedAirportRowDetails, getAirportData, setOperationalMessage, deleteAirport, setError } from '../../redux/slices/airportcode';


export default function AirlineTable() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const airportData = useSelector((state) => state?.airportcodedata?.airportData);
    const operationalMessage = useSelector((state) => state?.airportcodedata?.operationalMessage);
    const error = useSelector((state) => state?.airportcodedata?.error)
    const pagination = useSelector((state) => state?.airportcodedata?.pagination);
    const airportSearchStr = useSelector((state) => state?.airportcodedata?.airportSearchStr);
    const selectedAirportRowDetails = useSelector((state) => state?.airportcodedata?.selectedAirportRowDetails);
    const isLoading = useSelector((state) => state?.airportcodedata?.isLoading);
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
    const [snackbarSeverity, setSnackbarSeverity] = useState("");

    // datagrid columns
    const columns = [
        {
            field: 'airportCode',
            headerName: 'Airport Code',
            width: 300,
            filterable: false,
            sortable: false,
        },
        {
            field: 'cityCode',
            headerName: 'City Code',
            width: 200,
            filterable: false,
            sortable: false,
        },
        {
            field: 'state',
            headerName: 'State',
            width: 200,
            filterable: false,
            sortable: false,
        },
        {
            field: 'zipCode',
            headerName: 'ZIP Code',
            width: 200,
            filterable: false,
            sortable: false,
        },
        {
            field: "actions",
            headerName: "Actions",
            minWidth: 300,
            flex: 1,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const element = (
                    <Box>
                        
                        <Tooltip title={'Edit'} arrow sx={{ mr: 4, }}>
                            <IconButton onClick={() => {
                                setOpenEditDialog(true);
                                setActionType('Edit');
                                dispatch(setSelectedAirportRowDetails(params.row));
                            }} sx={{ display: 'inline-flex', cursor: 'pointer' }} >
                                <Iconify icon="tabler:edit" sx={{ color: '#000', pointerEvents: 'none' }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={'Delete'} arrow>
                            <IconButton onClick={() => {

                                // using callback to refresh table data after delete
                                dispatch(deleteAirport(params?.row?.airlineId));
                            }} sx={{ display: 'inline-flex', cursor: 'pointer' }}>
                                <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', pointerEvents: 'none' }}
                                />
                            </IconButton>
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        },
    ];

    // call api to get table data
    useEffect(() => {
        dispatch(getAirportData({ pageNo: pagination?.page, pageSize: pagination?.pageSize, searchStr: airportSearchStr }));
    }, []);

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
            setSnackbarSeverity("error");
            setSnackbarMessage(`${(error?.error && error?.message) ? `${error?.error}. ${error?.message}` : `${error}`}`);
            setSnackbarOpen(true);
        }
    }, [error])
    // operational message on customer
    useEffect(() => {
        if (operationalMessage) {
            setSnackbarSeverity("success");
            setSnackbarMessage(operationalMessage);
            setSnackbarOpen(true);
        }
        if (operationalMessage === "Airport deleted successfully.") {
            dispatch(getAirportData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: airportSearchStr }));
        }
    }, [operationalMessage])

    useEffect(() => {
        console.log('zone rows updated', airportData);
    }, [airportData])

    // dialog actions and functions
    const handleCloseEdit = () => {
        setOpenEditDialog(false);
    };

    return (<>
        <Box sx={{ height: 300, width: "100%", flex: 1 }}>
            <DataGrid
                paginationMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={(newModel) => {
                    setPaginationModel(newModel);
                    dispatch(getAirportData({
                        pageNo: newModel.page + 1,
                        pageSize: newModel.pageSize,
                        searchStr: airportSearchStr
                    }));
                }}

                rows={airportData || []}
                columns={columns}
                loading={isLoading}
                getRowId={(row) => row?.airportId}
                hideFooterSelectedRowCount
                onPageChange={(newPage) => {
                    dispatch(getAirportData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, searchStr: airportSearchStr }));
                }}
                onPageSizeChange={(newPageSize) => {
                    dispatch(getAirportData({ pageNo: 1, pageSize: newPageSize, searchStr: airportSearchStr }));
                }}
                pageSizeOptions={[5, 10, 50, 100]}
                rowCount={parseInt(pagination?.totalRecords || '0', 10)}
                autoHeight
                pagination
            />
        </Box>

        <Dialog open={openEditDialog} onClose={handleCloseEdit} onKeyDown={(event) => {
            if (event.key === 'Escape') {
                handleCloseEdit();
            }
        }}
            sx={{
                '& .MuiDialog-paper': { // Target the paper class
                    width: '1543px',
                    height: '270px',
                    maxHeight: 'none',
                    maxWidth: 'none',
                }
            }}
        >
            <DialogContent>
                <AirportDetails type={actionType} handleCloseConfirm={handleCloseEdit} selectedAirportRowDetails={selectedAirportRowDetails} />
            </DialogContent>
        </Dialog>

        <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000} // Adjust the duration as needed
            onClose={() => {
                setSnackbarOpen(false);
                setSnackbarSeverity("");
                setSnackbarMessage("");
                dispatch(setOperationalMessage());
                dispatch(setError());
            }}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
            <Alert
                onClose={() => {
                    setSnackbarOpen(false);
                    setSnackbarSeverity("");
                    setSnackbarMessage("");
                    dispatch(setOperationalMessage());
                    dispatch(setError());
                }}
                severity={snackbarSeverity} // This dynamically turns it red when "error"
                variant="filled"
                sx={{ width: '100%' }}
            >
                {snackbarMessage}
            </Alert>
        </Snackbar>
    </>)
}
