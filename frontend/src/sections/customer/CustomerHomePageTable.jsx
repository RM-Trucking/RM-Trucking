import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Stack, Typography, Button, Chip, Tooltip, Divider, Dialog, DialogContent } from '@mui/material';
import { useDispatch, useSelector } from '../../redux/store';
import { getCustomerData } from '../../redux/slices/customer';
import Iconify from '../../components/iconify';
import ConfirmDialog from '../../components/confirm-dialog';
import { useSnackbar } from '../../components/snackbar';
import { PATH_DASHBOARD } from '../../routes/paths';
import { setSelectedCustomerRowDetails, deleteCustomer } from '../../redux/slices/customer';
import SharedCustomerDetails from './SharedCustomerDetails';
import NotesTable from './NotesTable';

export default function CustomerHomePageTable() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const customerRows = useSelector((state) => state?.customerdata?.customerRows);
    const operationalMessage = useSelector((state) => state?.customerdata?.operationalMessage);
    const error = useSelector((state) => state?.customerdata?.error)
    const pagination = useSelector((state) => state?.customerdata?.pagination);
    const customerSearchStr = useSelector((state) => state?.customerdata?.customerSearchStr);
    const selectedCustomerRowDetails = useSelector((state) => state?.customerdata?.selectedCustomerRowDetails);
    const customerLoading = useSelector((state) => state?.customerdata?.isLoading);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const notesRef = useRef('');
    const [openEditDialog, setOpenEditDialog] = useState(false);
    // pagination model
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });

    // datagrid columns
    const columns = [{
        field: "customerName",
        headerName: "Customer Name",
        minWidth: 100,
        flex: 1
    },
    {
        field: "rmAccountNumber",
        headerName: "RM Account #",
        minWidth: 100,
        flex: 1,
        renderCell: (params) => {
            const element = (
                <Box
                    sx={{
                        display: 'flex',
                        flex: 1,
                        color: '#A22',
                        width: '100%',
                        textDecoration: 'underline'
                    }}
                >
                    {params?.row?.rmAccountNumber}
                </Box>
            );
            return element;
        },
    },
    {
        field: "phoneNumber",
        headerName: "Customer Phone #",
        minWidth: 100,
        flex: 1
    },
    {
        field: "website",
        headerName: "Customer Website",
        minWidth: 100,
        flex: 1
    },
    {
        field: "activeStatus",
        headerName: "Status",
        minWidth: 100,
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
                    <Chip label={params?.row?.activeStatus?.toLowerCase() === 'y' ? 'Active' : 'Inactive'} sx={{ backgroundColor: (params?.row?.activeStatus?.toLowerCase() !== 'y') ? 'rgba(143, 143, 143, 1)' : 'rgba(92, 172, 105, 1)', }} />
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
        renderCell: (params) => {
            const handleDialogOpen = () => {
                setOpenConfirmDialog(true);
                notesRef.current = params?.row?.notes;
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
        minWidth: 100,
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
                            dispatch(setSelectedCustomerRowDetails(params?.row));
                            navigate(PATH_DASHBOARD?.maintenance?.customerMaintenance?.customerView);
                        }} />
                    </Tooltip>
                    <Tooltip title={'Edit'} arrow>
                        <Iconify icon="tabler:edit" sx={{ color: '#000', marginTop: '15px', mr: 2 }} onClick={() => {
                            dispatch(setSelectedCustomerRowDetails(params?.row));
                            setOpenEditDialog(true);
                        }} />
                    </Tooltip>
                    <Tooltip title={'Delete'} arrow>
                        <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', marginTop: '15px' }} onClick={() => {
                            dispatch(deleteCustomer(params?.row?.customerId));
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
        dispatch(getCustomerData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: customerSearchStr }));
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
        console.log("customer error at console", error);
        enqueueSnackbar(error, { variant: 'error' });
    }, [error])
    // operational message on customer
    useEffect(() => {
        if (operationalMessage) {
            enqueueSnackbar(operationalMessage, { variant: 'success' });
        }
    }, [operationalMessage])

    useEffect(() => {
        console.log('customer rows updated', customerRows);
    }, [customerRows])

    // dialog actions and functions
    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
        notesRef.current = '';
    };

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
                    dispatch(getCustomerData({
                        pageNo: newModel.page + 1,
                        pageSize: newModel.pageSize,
                        searchStr: customerSearchStr
                    }));
                }}

                rows={customerRows}
                columns={columns}
                loading={customerLoading}
                getRowId={(row) => row?.customerId}
                hideFooterSelectedRowCount
                onPageChange={(newPage) => {
                    dispatch(getCustomerData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, searchStr: customerSearchStr }));
                }}
                onPageSizeChange={(newPageSize) => {
                    dispatch(getCustomerData({ pageNo: 1, pageSize: newPageSize, searchStr: customerSearchStr }));
                }}
                pageSizeOptions={[5, 10, 50, 100]}
                rowCount={parseInt(pagination?.totalRecords || '0', 10)}
                autoHeight
                pagination
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
                    height: '680px',
                    maxHeight: 'none',
                    maxWidth: 'none',
                }
            }}
        >
            <DialogContent>
                <>
                    <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Customer Notes</Typography>
                        <Iconify icon="carbon:close" onClick={() => handleCloseConfirm()} sx={{ cursor: 'pointer' }} />
                    </Stack>
                    <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
                </>
                <Box sx={{ pt: 2 }}>
                    <NotesTable notes={notesRef.current} handleCloseConfirm = {handleCloseConfirm}/>
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
                    width: '1543px',
                    height: '600px',
                    maxHeight: 'none',
                    maxWidth: 'none',
                }
            }}
        >
            <DialogContent>
                <SharedCustomerDetails type={'Edit'} handleCloseConfirm={handleCloseEdit} selectedCustomerRowDetails={selectedCustomerRowDetails} />
            </DialogContent>
        </Dialog>
    </>)
}
