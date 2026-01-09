import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import {
    Box, Stack, Typography, Button, Dialog,
    DialogContent, Tooltip, Divider
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from '../../redux/store';
import CustomNoRowsOverlay from '../shared/CustomNoRowsOverlay';
import Iconify from '../../components/iconify';
import { setSelectedStationTabRowDetails, getStationDepartmentData, getStationPersonnelData, getStationRateData, getStationAccessorialData } from '../../redux/slices/customer';
import ConfirmDialog from '../../components/confirm-dialog';
// ----------------------------------------------------------------------


StationTabsTable.PropTypes = {
    currentTab: PropTypes.string,
    setActionType: PropTypes.func,
};

export default function StationTabsTable({ currentTab, setActionType }) {
    const dispatch = useDispatch();
    const customerLoading = useSelector((state) => state?.customerdata?.isLoading);
    const stationTabTableData = useSelector((state) => state?.customerdata?.stationTabTableData);
    const [tableColumns, setTableColumns] = useState([]);
    // dialog for notes
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const notesRef = useRef('');

    // columns for department, personnel, rate, accessorial

    const departmentColumns = [
        {
            field: "stationName",
            headerName: "Station Name",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "departmentName",
            headerName: "Department Name",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "email",
            headerName: "Email ID",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "phoneNumber",
            headerName: "Phone #",
            minWidth: 200,
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
                            mb: 0.5
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
                            mb: 1.2,
                            mt: 1.2,
                        }}
                    >
                        <Tooltip title={'View'} arrow>
                            <Iconify icon="carbon:view-filled" sx={{ color: '#000', mr: 2 }} onClick={() => {
                                dispatch(setSelectedStationTabRowDetails(params.row));
                            }} />
                        </Tooltip>
                        <Tooltip title={'Edit'} arrow>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 2 }} onClick={() => {
                                setActionType('Edit');
                                dispatch(setSelectedStationTabRowDetails(params.row));
                            }} />
                        </Tooltip>
                        <Tooltip title={'Delete'} arrow>
                            <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000' }} />
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        },
    ];
    const personnelColumns = [
        {
            field: "name",
            headerName: "Personnel Name",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "departmentName",
            headerName: "Department Name",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "email",
            headerName: "Email ID",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "officePhoneNumber",
            headerName: "Office Phone #",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "cellPhoneNumber",
            headerName: "Cell Phone #",
            minWidth: 200,
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
                            mb: 0.5
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
            minWidth: 110,
            flex: 1,
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
                                dispatch(setSelectedStationTabRowDetails(params.row));
                            }} />
                        </Tooltip>
                        <Tooltip title={'Edit'} arrow>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 2 }} onClick={() => {
                                setActionType('Edit');
                                dispatch(setSelectedStationTabRowDetails(params.row));
                            }} />
                        </Tooltip>
                        <Tooltip title={'Delete'} arrow>
                            <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000' }} />
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        },
    ];
    const rateColumns = [
        {
            field: "rateID",
            headerName: "Rate ID",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Box sx={{ fontWeight: 'bold' }}>
                    {params?.row?.rateID}
                </Box>
            )
        },
        {
            field: "origin",
            headerName: "Origin",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "originZipCode",
            headerName: "Origin Zip Code",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "destination",
            headerName: "Destination",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "destinationZipCode",
            headerName: "Destination Zip Code",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "rates",
            headerName: "Rates",
            minWidth: 200,
            minHeight: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const element = (
                    <Stack flexDirection={'column'} sx={{ mt: 0.5, mb: 0.5, }}>
                        <Typography variant="normal">Min: {params?.row?.minRate}</Typography>
                        <Typography variant="normal">Rate/LB: {params?.row?.rateLB}</Typography>
                        <Typography variant="normal">Max: {params?.row?.maxRate}</Typography>
                    </Stack>
                );
                return element;
            }
        },
        {
            field: "expiryDate",
            headerName: "Expiry Date",
            minWidth: 200,
            flex: 1,
            cellClassName: 'center-status-cell',
            headerAlign: 'center',
        },
        {
            field: "actions",
            headerName: "Action",
            minWidth: 110,
            flex: 1,
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
                        <Tooltip title={'View'} arrow>
                            <Iconify icon="carbon:view-filled" sx={{ color: '#000', mr: 2 }} onClick={() => {
                                dispatch(setSelectedStationTabRowDetails(params.row));
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
            field: "charges",
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
                    notesRef.current = params?.row?.notes;
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
                        <Tooltip title={params?.row?.notes} arrow >
                            <Iconify icon="icon-park-solid:notes" onClick={handleDialogOpen} sx={{ color: '#7fbfc4', cursor: 'pointer' }} />
                        </Tooltip>
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
                            mb: 1.2,
                            mt: 1.2,
                        }}
                    >
                        <Tooltip title={'View'} arrow>
                            <Iconify icon="carbon:view-filled" sx={{ color: '#000', mr: 2 }} onClick={() => {
                                dispatch(setSelectedStationTabRowDetails(params.row));
                            }} />
                        </Tooltip>
                        <Tooltip title={'Edit'} arrow onClick={() => {
                            setActionType('Edit');
                            dispatch(setSelectedStationTabRowDetails(params.row));
                        }}>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 2 }} />
                        </Tooltip>
                        <Tooltip title={'Delete'} arrow>
                            <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', }} />
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        },
    ];

    useEffect(() => {
        // Update table columns and data based on currentTab and call the respedctive API to get data
        if (currentTab === 'department') {
            dispatch(getStationDepartmentData());
            setTableColumns(departmentColumns);
        }
        else if (currentTab === 'personnel') {
            dispatch(getStationPersonnelData());
            setTableColumns(personnelColumns);
        }
        else if (currentTab === 'rate') {
            dispatch(getStationRateData());
            setTableColumns(rateColumns);
        }
        else if (currentTab === 'accessorial') {
            dispatch(getStationAccessorialData());
            setTableColumns(accessorialColumns);
        }
    }, [currentTab]);

    // useffect to set table data from redux store
    useEffect(() => {
        console.log(stationTabTableData);
    }, [stationTabTableData]);

    // dialog actions and functions for notes
    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
        notesRef.current = '';
    };
    const handleTitle = () => {
        const element = (
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Notes</Typography>
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

    return (
        <>
            {(currentTab === 'department' || currentTab === 'accessorial') && <Box sx={{ height: 400, width: "100%", flex: 1, mt: 2 }}>
                <DataGrid
                    rows={stationTabTableData}
                    columns={tableColumns}
                    loading={customerLoading}
                    getRowId={(row) => row?.id || row?.rateID}
                    pagination
                    slots={{
                        noRowsOverlay: CustomNoRowsOverlay,
                    }}
                    getRowHeight={() => 'auto'}
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
            </Box>}
            {(currentTab === 'personnel') && <Box sx={{ height: 400, width: "100%", flex: 1, mt: 2 }}>
                <DataGrid
                    rows={stationTabTableData}
                    columns={tableColumns}
                    loading={customerLoading}
                    getRowId={(row) => row?.id || row?.rateID}
                    pagination
                    slots={{
                        noRowsOverlay: CustomNoRowsOverlay,
                    }}
                    getRowHeight={() => 'auto'}
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
            </Box>}
            {(currentTab === 'rate') && <Box sx={{ height: 400, width: "100%", flex: 1, mt: 2 }}>
                <DataGrid
                    rows={stationTabTableData}
                    columns={tableColumns}
                    loading={customerLoading}
                    getRowId={(row) => row?.id || row?.rateID}
                    pagination
                    slots={{
                        noRowsOverlay: CustomNoRowsOverlay,
                    }}
                    getRowHeight={() => 'auto'}
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
            </Box>}
        </>
    );
}
