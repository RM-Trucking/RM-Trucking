import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { alpha, styled } from '@mui/material/styles';
import { Box, Switch, Stack, Typography, Button, Chip, Tooltip, Divider, Dialog, DialogContent, Snackbar, MenuItem } from '@mui/material';
import { useDispatch, useSelector } from '../../redux/store';
import Iconify from '../../components/iconify';
import AccessorialDetails from './AccessorialDetails';
import { setSelectedAccessorialRowDetails, getAccessorialData, setOperationalMessage, deleteAccessorial, setError } from '../../redux/slices/accessorial';


export default function AccessorialTable() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const accessorialData = useSelector((state) => state?.accessorialdata?.accessorialData);
    const operationalMessage = useSelector((state) => state?.accessorialdata?.operationalMessage);
    const error = useSelector((state) => state?.accessorialdata?.error)
    const pagination = useSelector((state) => state?.accessorialdata?.pagination);
    const accessorialSearchStr = useSelector((state) => state?.accessorialdata?.accessorialSearchStr);
    const selectedAccessorialRowDetails = useSelector((state) => state?.accessorialdata?.selectedAccessorialRowDetails);
    const isLoading = useSelector((state) => state?.accessorialdata?.isLoading);
    const [openEditDialog, setOpenEditDialog] = useState(false);

    // pagination model
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    // snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // datagrid columns
    const columns = [
        {
            field: 'accessorialId',
            headerName: 'SNo',
            width: 100,
            renderCell: (params) => {
                // Calculate the serial number based on its current position in the list
                const sNo = params.api.getRowIndexRelativeToVisibleRows(params.id) + 1;

                return (
                    <Box>
                        <Typography variant="normal">
                            {sNo}
                        </Typography>
                    </Box>
                );
            },
        },
        {
            field: 'accessorialName',
            headerName: 'Accessorial Name',
            width: 300,
        },
        {
            field: "actions",
            headerName: "Action",
            minWidth: 300,
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
                        <Tooltip title={'Edit'} arrow >
                            <Box onClick={() => {
                                setOpenEditDialog(true);
                                dispatch(setSelectedAccessorialRowDetails(params.row));
                            }} sx={{ display: 'inline-flex', cursor: 'pointer' }} >
                                <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 2 }} />
                            </Box>
                        </Tooltip>
                        <Tooltip title={'Delete'} arrow>
                            <Box onClick={() => {

                                // using callback to refresh table data after delete
                                dispatch(deleteAccessorial(params?.row?.accessorialId));
                            }} sx={{ display: 'inline-flex', cursor: 'pointer' }}>
                                <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', }}
                                />
                            </Box>
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        },
    ];

    // call api to get table data
    useEffect(() => {
        dispatch(getAccessorialData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: accessorialSearchStr }));
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
        if (operationalMessage === "Accessorial deleted successfully.") {
            dispatch(getAccessorialData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: accessorialSearchStr }));
        }
    }, [operationalMessage])

    useEffect(() => {
        console.log('zone rows updated', accessorialData);
    }, [accessorialData])

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
                    dispatch(getAccessorialData({
                        pageNo: newModel.page + 1,
                        pageSize: newModel.pageSize,
                        searchStr: accessorialSearchStr
                    }));
                }}

                rows={accessorialData || []}
                columns={columns}
                loading={isLoading}
                getRowId={(row) => row?.accessorialId}
                hideFooterSelectedRowCount
                onPageChange={(newPage) => {
                    dispatch(getAccessorialData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, searchStr: accessorialSearchStr }));
                }}
                onPageSizeChange={(newPageSize) => {
                    dispatch(getAccessorialData({ pageNo: 1, pageSize: newPageSize, searchStr: accessorialSearchStr }));
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
                    height: '230px',
                    maxHeight: 'none',
                    maxWidth: 'none',
                }
            }}
        >
            <DialogContent>
                <AccessorialDetails type={'Edit'} handleCloseConfirm={handleCloseEdit} selectedAccessorialRowDetails={selectedAccessorialRowDetails} />
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
    </>)
}
