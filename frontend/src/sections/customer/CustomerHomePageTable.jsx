import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Stack, Typography, Button, Chip, Tooltip } from '@mui/material';
import { useDispatch, useSelector } from '../../redux/store';
import { getCustomerData } from '../../redux/slices/customer';
import Iconify from '../../components/iconify';

export default function CustomerHomePageTable() {
    const dispatch = useDispatch();
    const customerRows = useSelector((state) => state?.customerdata?.customerRows);
    const customerLoading = useSelector((state) => state?.customerdata?.isLoading);
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
        flex: 1,
        renderCell: (params) => {
            const element = (
                <Box
                    sx={{
                        display: 'flex',
                        flex: 1,
                        marginTop: '2%'
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
            const element = (
                <Box
                    sx={{
                        display: 'flex',
                        flex: 1,
                    }}
                >
                    <Tooltip title={params?.row?.notes} arrow>
                        <Iconify icon="icon-park-solid:notes" sx={{ color: '#7fbfc4', marginTop: '15px' }} />
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


    return (<>
        <Box sx={{ height: 400, width: "100%", flex: 1 }}>
            <DataGrid
                rows={customerRows}
                columns={columns}
                loading={customerLoading}
                getRowId={(row) => row?.rmAccountNo}
                pagination
            />
        </Box>
    </>)
}
