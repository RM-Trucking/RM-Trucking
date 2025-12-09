import { useState, useEffect, useRef } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Stack, Typography, Button, Chip, Tooltip, Divider } from '@mui/material';
import { useDispatch, useSelector } from '../../redux/store';
import { getCustomerData } from '../../redux/slices/customer';
import Iconify from '../../components/iconify';
import ConfirmDialog from '../../components/confirm-dialog';

export default function CustomerHomePageTable() {
    const dispatch = useDispatch();
    const customerRows = useSelector((state) => state?.customerdata?.customerRows);
    const customerLoading = useSelector((state) => state?.customerdata?.isLoading);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const notesRef = useRef('');

    // datagrid columns
    const columns = [{
        field: "customerName",
        headerName: "Customer Name",
        minWidth: 100,
        flex: 1
    },
    {
        field: "rmAccountNo",
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
                    {params?.row?.rmAccountNo}
                </Box>
            );
            return element;
        },
    },
    {
        field: "customerPhNo",
        headerName: "Customer Phone #",
        minWidth: 100,
        flex: 1
    },
    {
        field: "customerWebsite",
        headerName: "Customer Website",
        minWidth: 100,
        flex: 1
    },
    {
        field: "status",
        headerName: "Status",
        minWidth: 100,
        align:'center',
        cellClassName: 'center-status-cell',
        renderCell: (params) => {
            const element = (
                <Box
                    sx={{
                        display: 'flex',
                        flex: 1,
                    }}
                >
                    <Chip label={params?.row?.status} sx={{ backgroundColor: (params?.row?.status?.toLowerCase() === 'inactive') ? 'rgba(143, 143, 143, 1)' : 'rgba(92, 172, 105, 1)', }} />
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
                    <Tooltip title={params?.row?.notes} arrow >
                        <Iconify icon="icon-park-solid:notes" onClick={handleDialogOpen} sx={{ color: '#7fbfc4', marginTop: '15px', cursor: 'pointer' }} />
                    </Tooltip>
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
                        <Iconify icon="carbon:view-filled" sx={{ color: '#000', marginTop: '15px', mr: 2 }} />
                    </Tooltip>
                    <Tooltip title={'Edit'} arrow>
                        <Iconify icon="tabler:edit" sx={{ color: '#000', marginTop: '15px', mr: 2 }} />
                    </Tooltip>
                    <Tooltip title={'Delete'} arrow>
                        <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', marginTop: '15px' }} />
                    </Tooltip>
                </Box>
            );
            return element;
        },
    },
    ];

    // call api to get table data
    useEffect(() => {
        dispatch(getCustomerData());
    }, []);

    useEffect(() => {
        console.log('customer rows updated', customerRows);
    }, [customerRows])
    // dialog actions and functions
    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
        notesRef.current = '';
    };
    const handleTitle = () => {
        const element = (
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Customer Notes</Typography>
                    <Iconify icon="carbon:close" onClick={() => handleCloseConfirm()} sx={{ cursor: 'pointer' }} />
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
        );
        return element;
    };
    const handleContent = () => {
        const confirmDialogContent = (
            <Box sx={{ pt: 2 }}>
                <Typography variant="normal" sx={{ fontWeight: 400, fontSize: '16px' }}>
                    {notesRef.current}
                </Typography>
            </Box>
        );

        return confirmDialogContent;
    };
    const handleDialogActions = () => {

        const confirmDialogActions = (
            <>
                <Button
                    variant="contained"
                    onClick={() => handleCloseConfirm()}
                    size="small"
                    sx={{
                        '&.MuiButton-contained': {
                            borderRadius: '4px',
                            color: '#ffffff',
                            boxShadow: 'none',
                            fontSize: '14px',
                            p: '2px 16px',
                            bgcolor: '#A22',
                            fontWeight: 'normal',
                            ml: 1,
                            mb: 1
                        },
                    }}
                >
                    Ok
                </Button>
            </>
        );
        return confirmDialogActions;
    }


    return (<>
        <Box sx={{ height: 400, width: "100%", flex: 1 }}>
            <DataGrid
                rows={customerRows}
                columns={columns}
                loading={customerLoading}
                getRowId={(row) => row?.rmAccountNo}
                pagination
            />
            <ConfirmDialog
                open={openConfirmDialog}
                onClose={handleCloseConfirm}
                title={handleTitle()}
                content={handleContent()}
                action={handleDialogActions()}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        handleCloseConfirm();
                    }
                }}
            />
        </Box>
    </>)
}
