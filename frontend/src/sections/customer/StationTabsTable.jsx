import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import {
    Box, Stack, Typography, Button, Dialog,
    DialogContent, Tooltip, Divider
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from '../../redux/store';
import CustomNoRowsOverlay from '../shared/CustomNoRowsOverlay';
import Iconify from '../../components/iconify';
import { setSelectedStationTabRowDetails } from '../../redux/slices/customer';
// ----------------------------------------------------------------------


StationTabsTable.PropTypes = {
    currentTab: PropTypes.string,
};

export default function StationTabsTable({ currentTab }) {
    const dispatch = useDispatch();
    const customerLoading = useSelector((state) => state?.customerdata?.isLoading);
    const [tableColumns, setTableColumns] = useState([]);
    const [tableData, setTableData] = useState([]);

    // columns for department, personnel, rate, accessorial

    const departmentColumns = [
        {
            field: "stationName",
            headerName: "Station Name",
            minWidth: 200,
            flex: 1
        },
        {
            field: "departmentName",
            headerName: "Department Name",
            minWidth: 200,
            flex: 1
        },
        {
            field: "email",
            headerName: "Email ID",
            minWidth: 200,
            flex: 1
        },
        {
            field: "phoneNo",
            headerName: "Phone #",
            minWidth: 200,
            flex: 1
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
                                dispatch(setSelectedStationTabRowDetails(params.row));
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

    useEffect(() => {
        // Update table columns and data based on currentTab
        if (currentTab === 'department') {
            setTableColumns(departmentColumns);
        }
        else if (currentTab === 'personnel') { }
        else if (currentTab === 'rate') { }
        else if (currentTab === 'accessorial') { }
    }, [currentTab]);


    return (
        <>
            <Box sx={{ height: 400, width: "100%", flex: 1, mt: 2 }}>
                <DataGrid
                    rows={tableData}
                    columns={tableColumns}
                    loading={customerLoading}
                    getRowId={(row) => row?.departmentName || row?.id}
                    pagination
                    slots={{
                        noRowsOverlay: CustomNoRowsOverlay,
                    }}
                />
            </Box>
        </>
    );
}
