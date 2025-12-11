import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Stack, Typography, Button, Chip, Tooltip, Divider } from '@mui/material';
import { useDispatch, useSelector } from '../../redux/store';
import Iconify from '../../components/iconify';
import ConfirmDialog from '../../components/confirm-dialog';
import { PATH_DASHBOARD } from '../../routes/paths';
import { getCustomerStationData, setSelectedCustomerStationRowDetails } from '../../redux/slices/customer';
import CustomNoRowsOverlay from '../shared/CustomNoRowsOverlay';

export default function CustomerViewStationTable() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const stationRows = useSelector((state) => state?.customerdata?.stationRows);
    const customerLoading = useSelector((state) => state?.customerdata?.isLoading);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const notesRef = useRef('');

    // datagrid columns
    const columns = [
        {
            field: "stationName",
            headerName: "Station Name",
            minWidth: 120,
            flex: 1
        },
        {
            field: "rmAccountNo",
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
                        {params?.row?.rmAccountNo}
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
            field: "address",
            headerName: "Address",
            minWidth: 110,
            flex: 1
        },
        {
            field: "city",
            headerName: "City",
            minWidth: 110,
            align: 'center',
        },
        {
            field: "state",
            headerName: "State",
            minWidth: 110,
            flex: 1,
        },
        {
            field: "zipCode",
            headerName: "ZipCode",
            minWidth: 110,
            flex: 1,
        },
        {
            field: "zip4Code",
            headerName: "Zip4 Code",
            minWidth: 110,
            flex: 1,
        },
        {
            field: "phoneNo",
            headerName: "Phone #",
            minWidth: 110,
            flex: 1,
        },
        {
            field: "Fax #",
            headerName: "Phone #",
            minWidth: 110,
            flex: 1,
        },
        {
            field: "openTime",
            headerName: "Open Time",
            minWidth: 110,
            flex: 1,
        },
        {
            field: "closeTime",
            headerName: "Close Time",
            minWidth: 110,
            flex: 1,
        },
        {
            field: "hrs",
            headerName: "Hrs",
            minWidth: 110,
            flex: 1,
        },
        {
            field: "warehouse",
            headerName: "Warehouse",
            minWidth: 110,
            flex: 1,
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
                                dispatch(setSelectedCustomerStationRowDetails(params?.row));
                                navigate(PATH_DASHBOARD?.maintenance?.customerMaintenance?.customerView);
                            }} />
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
        dispatch(getCustomerStationData());
    }, []);

    useEffect(() => {
        console.log('customer rows updated', stationRows);
    }, [stationRows])
    // dialog actions and functions
    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
        notesRef.current = '';
    };


    return (<>
        <Stack flexDirection={'row'} alignItems={'center'} justifyContent={'space-between'} sx={{mt:4}}>
            <Typography variant="h7" fontWeight={700}>Station Details</Typography>
            <Button
                variant="outlined"
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
                        borderColor : '#a22',
                    },
                }}
            >
                Add Station
            </Button>
        </Stack>
        <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)', mt:1 }} />
        <Box sx={{ height: 400, width: "100%", flex: 1, mt:2 }}>
            <DataGrid
                rows={stationRows}
                columns={columns}
                loading={customerLoading}
                getRowId={(row) => row?.rmAccountNo}
                pagination
                slots={{
                    noRowsOverlay: CustomNoRowsOverlay,
                }}
            />
        </Box>
    </>)
}
