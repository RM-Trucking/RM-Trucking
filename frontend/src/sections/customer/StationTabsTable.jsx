import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import {
    Box, Stack, Typography, Snackbar, Dialog,
    DialogContent, Tooltip, Divider
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from '../../redux/store';
import CustomNoRowsOverlay from '../shared/CustomNoRowsOverlay';
import Iconify from '../../components/iconify';
import {
    setSelectedStationTabRowDetails, getStationDepartmentData,
    getStationPersonnelData, getStationRateData, getStationAccessorialData,
    deleteStationDepartment, deleteStationPersonnel, getDepartmentData,
    deleteStationAccessorial, getAccessorialData, setOperationalMessage
} from '../../redux/slices/customer';
import { clearNotesState } from '../../redux/slices/note';
import NotesTable from './NotesTable';
// ----------------------------------------------------------------------


StationTabsTable.PropTypes = {
    currentTab: PropTypes.string,
    setActionType: PropTypes.func,
};

export default function StationTabsTable({ currentTab, setActionType }) {
    const dispatch = useDispatch();
    const customerLoading = useSelector((state) => state?.customerdata?.isLoading);
    const stationTabTableData = useSelector((state) => state?.customerdata?.stationTabTableData);
    const pagination = useSelector((state) => state?.customerdata?.pagination);
    const error = useSelector((state) => state?.customerdata?.error);
    const operationalMessage = useSelector((state) => state?.customerdata?.operationalMessage);
    const selectedCustomerStationDetails = useSelector((state) => state?.customerdata?.selectedCustomerStationDetails);
    const [tableColumns, setTableColumns] = useState([]);
    // dialog for notes
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const notesRef = useRef({});
    // pagination model
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    // snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

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
            minWidth: 300,
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
                        {/* <Tooltip title={'View'} arrow>
                            <Iconify icon="carbon:view-filled" sx={{ color: '#000', mr: 2 }} onClick={() => {
                                dispatch(setSelectedStationTabRowDetails(params.row));
                            }} />
                        </Tooltip> */}
                        <Tooltip title={'Edit'} arrow>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 2 }} onClick={() => {
                                setActionType('Edit');
                                dispatch(setSelectedStationTabRowDetails(params.row));
                            }} />
                        </Tooltip>
                        <Tooltip title={'Delete'} arrow>
                            <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000' }} onClick={() => {

                                dispatch(deleteStationDepartment(params?.row?.departmentId, () => {
                                    dispatch(getStationDepartmentData(parseInt(localStorage.getItem('stationId'), 10)));
                                }));

                            }} />
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
            minWidth: 300,
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
                        <Tooltip title={'Edit'} arrow>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 2 }} onClick={() => {
                                setActionType('Edit');
                                dispatch(setSelectedStationTabRowDetails(params.row));
                            }} />
                        </Tooltip>
                        <Tooltip title={'Delete'} arrow>
                            <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000' }} onClick={() => {
                                dispatch(deleteStationPersonnel(params?.row?.personnelId, () => {
                                    dispatch(getStationPersonnelData({ pageNo: pagination.page, pageSize: pagination.pageSize, stationId: parseInt(localStorage.getItem('stationId'), 10) }));
                                }));
                            }} />
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
            minWidth: 300,
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

                        <Tooltip title={'Edit'} arrow onClick={() => {
                            setActionType('Edit');
                            dispatch(setSelectedStationTabRowDetails(params.row));
                        }}>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 2 }} />
                        </Tooltip>
                        <Tooltip title={'Delete'} arrow>
                            <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', }} onClick={() => {
                                // using callback to refresh table data after delete
                                dispatch(deleteStationAccessorial(params?.row?.accessorialId, () => {
                                    dispatch(getStationAccessorialData(selectedCustomerStationDetails?.entityId));
                                }));
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
        // Update table columns and data based on currentTab and call the respedctive API to get data
        if (currentTab === 'department') {
            dispatch(clearNotesState());
            dispatch(getStationDepartmentData(parseInt(localStorage.getItem('stationId'), 10)));
            setTableColumns(departmentColumns);
        }
        else if (currentTab === 'personnel') {
            dispatch(clearNotesState());
            dispatch(getDepartmentData(parseInt(localStorage.getItem('stationId'), 10)));
            dispatch(getStationPersonnelData({ pageNo: pagination.page, pageSize: pagination.pageSize, stationId: parseInt(localStorage.getItem('stationId'), 10) }));
            setTableColumns(personnelColumns);
        }
        else if (currentTab === 'rate') {
            dispatch(clearNotesState());
            dispatch(getStationRateData());
            setTableColumns(rateColumns);
        }
        else if (currentTab === 'accessorial') {
            dispatch(clearNotesState());
            dispatch(getAccessorialData());
            dispatch(getStationAccessorialData(selectedCustomerStationDetails?.entityId));
            setTableColumns(accessorialColumns);
        }
    }, [currentTab]);

    // useffect to set table data from redux store
    useEffect(() => {
        console.log(stationTabTableData);
    }, [stationTabTableData]);

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
            setSnackbarMessage(`${error?.error}. ${error?.message}`);
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

    // dialog actions and functions for notes
    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
        notesRef.current = '';
    };

    return (
        <>
            {(currentTab === 'department' || currentTab === 'accessorial') && <Box sx={{ height: 400, width: "100%", flex: 1, mt: 2 }}>
                <DataGrid
                    rows={stationTabTableData}
                    columns={tableColumns}
                    loading={customerLoading}
                    getRowId={(row) => row?.departmentId || row?.entityAccessorialId}
                    pagination
                    slots={{
                        noRowsOverlay: CustomNoRowsOverlay,
                    }}
                    hideFooterSelectedRowCount
                />
            </Box>}
            {(currentTab === 'personnel') && <Box sx={{ height: 400, width: "100%", flex: 1, mt: 2 }}>
                <DataGrid
                    paginationMode="server"
                    paginationModel={paginationModel}
                    onPaginationModelChange={(newModel) => {
                        setPaginationModel(newModel);
                        dispatch(getStationPersonnelData({
                            pageNo: newModel.page + 1,
                            pageSize: newModel.pageSize,
                            stationId: parseInt(localStorage.getItem('stationId'), 10)
                        }));
                    }}
                    rows={stationTabTableData}
                    columns={tableColumns}
                    loading={customerLoading}
                    getRowId={(row) => row?.personnelId}
                    hideFooterSelectedRowCount
                    onPageChange={(newPage) => {
                        dispatch(getStationPersonnelData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, stationId: parseInt(localStorage.getItem('stationId'), 10) }));
                    }}
                    onPageSizeChange={(newPageSize) => {
                        dispatch(getStationPersonnelData({ pageNo: 1, pageSize: newPageSize, stationId: parseInt(localStorage.getItem('stationId'), 10) }));
                    }}
                    pageSizeOptions={[5, 10, 50, 100]}
                    rowCount={parseInt(pagination?.totalRecords || tableColumns.length, 10)}
                    pagination
                    slots={{
                        noRowsOverlay: CustomNoRowsOverlay,
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
                    hideFooterSelectedRowCount
                />
            </Box>}
            <Dialog open={openConfirmDialog} onClose={handleCloseConfirm} onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    handleCloseConfirm();
                }
            }}
                sx={{
                    '& .MuiDialog-paper': { // Target the paper class
                        width: '1000px',
                        height: '720px',
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
                        <NotesTable notes={notesRef.current} handleCloseConfirm={handleCloseConfirm} />
                    </Box>
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
        </>
    );
}
