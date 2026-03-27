import { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Chip, Stack, Tooltip, Dialog, DialogContent, Snackbar, Divider

} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate, useLocation } from 'react-router-dom';

// shared components
import { PATH_DASHBOARD } from '../../routes/paths';
import ErrorFallback from '../shared/ErrorBoundary';
import Iconify from '../../components/iconify';
import { useDispatch, useSelector } from '../../redux/store';
import {
    setSelectedCarrierTabRowDetails,
    setOperationalMessage,
    setSelectedTeminalTabRowDetails,
    getPersonnelTerminalData,
    getQualityTerminalData, deletePersonnel, getTerminalRateData, 
    deleteTerminalRate, setTerminalViewTabData, 
} from '../../redux/slices/carrier';
import {
    setTableBeingViewed, getStationAccessorialData,
    deleteStationAccessorial, patchStationAccessorialData,
    getAccessorialData, setOperationalMessage as setOpertionalMessageOfCustomer
} from '../../redux/slices/customer';
import {
    setSelectedCurrentRateRow,
    setCurrentRateRoutedFrom, getCarrierListByRateID, getOriginZoneByZipCode,
    getDestinationZoneByZipCode,
} from '../../redux/slices/rate';
import { clearNotesState } from '../../redux/slices/note';
import NotesTable from '../customer/NotesTable';
import StationAccessorial from '../customer/StationAccessorial';
import StyledCheckbox from '../shared/StyledCheckBox';
import AddRate from '../rate/AddRate';
import TerminalPersonnelDetails from './TerminalPersonnelDetails';


// ----------------------------------------------------------------

export default function TerminalViewPageTable() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const stationTabTableData = useSelector((state) => state?.customerdata?.stationTabTableData);
    const { terminalViewTabData, isLoading, currentTerminalTab, pagination, operationalMessage,
        error, selectedTerminalTabRowDetails, selectedCarrierTabRowDetails } = useSelector((state) => state.carrierdata);
    const operationalAccessorialMessage = useSelector((state) => state?.customerdata?.operationalMessage);
    const currentRateRoutedFrom = useSelector((state) => state?.ratedata?.currentRateRoutedFrom);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
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
    const [tableColumns, setTableColumns] = useState([]);
    const notesRef = useRef({});

    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const personnelColumns = [
        {
            field: 'name',
            headerName: 'Personnel Name',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'personType',
            headerName: 'Person Type',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'email',
            headerName: 'Email ID',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'officePhoneNumber',
            headerName: 'Office Phone #',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: 'cellPhoneNumber',
            headerName: 'Cell Phone #',
            width: 150,
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
            field: 'actions',
            headerName: 'Actions',
            width: 300,
            cellClassName: 'center-status-cell',
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
                        <Tooltip title={'View'} arrow>
                            <Iconify icon="carbon:view-filled" sx={{ color: '#000', mr: 2 }} onClick={() => {
                                dispatch(setSelectedTeminalTabRowDetails(params.row));
                                setActionType('View');
                                setOpenEditDialog(true);
                            }} />
                        </Tooltip>
                        <Tooltip title={'Edit'} arrow>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 1 }} onClick={() => {
                                dispatch(setSelectedTeminalTabRowDetails(params?.row));
                                setOpenEditDialog(true);
                                setActionType('Edit');
                            }} />
                        </Tooltip>

                        <Tooltip title={'Delete'} arrow>
                            <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000' }} onClick={() => {
                                setActionType('Delete');
                                dispatch(deletePersonnel(params?.row?.personnelId));
                            }} />
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        }
    ];
    const qualityColumns = [
        {
            field: "totalShipments",
            headerName: "Total No of Shipments",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "onTimePercentage",
            headerName: "R&M On Time % ",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "lateShipment",
            headerName: "Late Shipments",
            minWidth: 400,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {

                const element = (
                    <Typography
                        sx={{
                            textDecoration: 'underline',
                            color: '#A22',
                        }}
                    >

                        {params?.row?.lateShipment}

                    </Typography>
                );
                return element;
            },
        },
        {
            field: "actions",
            headerName: "Action",
            minWidth: 150,
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
                        <Tooltip title={'View'} arrow>
                            <Iconify icon="carbon:view-filled" sx={{ color: '#000', mr: 2 }} onClick={() => {
                                dispatch(setSelectedTeminalTabRowDetails(params.row));
                                setActionType('View');
                            }} />
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
            field: "serviceNotOffered",
            headerName: "Service Not Offered",
            minWidth: 200,
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

                        <StyledCheckbox
                            sx={{ mt: -1.5 }}
                            checked={params?.row?.serviceNotOffered === 'Y'}
                            onChange={(e, i) => {
                                const isChecked = e.target.checked;
                                // here need to call api to post data
                                dispatch(patchStationAccessorialData({ serviceNotOffered: isChecked ? 'Y' : 'N' }, params?.row?.entityAccessorialId))
                            }} />

                    </Box>
                );
                return element;
            },
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
            minWidth: 150,
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

                        <Tooltip title={'Edit'} arrow onClick={() => {
                            dispatch(setOpertionalMessageOfCustomer(''));
                            setActionType('Edit');
                            setOpenEditDialog(true);
                            dispatch(setSelectedTeminalTabRowDetails(params.row));
                        }}>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 2 }} />
                        </Tooltip>
                        <Tooltip title={'Delete'} arrow>
                            <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', }} onClick={() => {
                                // using callback to refresh table data after delete
                                dispatch(deleteStationAccessorial(params?.row?.accessorialId));
                            }}
                            />
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        },
    ];
    const rateColumns = [
        {
            field: 'rateId',
            headerName: 'Rate ID',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Box sx={{ fontWeight: 'bold' }}>
                    {params?.row?.transportRate?.carrierRateId}
                </Box>
            )
        },
        {
            field: 'originZoneId',
            headerName: 'Origin',
            width: 100,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Box sx={{ fontWeight: 'bold' }}>
                    {params?.row?.transportRate?.originZone?.zoneName}
                </Box>
            )
        },
        {
            field: 'originZone',
            headerName: 'Origin Zip Code',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', pt: 1 }} alignItems={'center'} >
                    {params?.row?.transportRate?.originZone?.ranges?.map((range, index) => (
                        <Chip key={index} label={range} size="small" sx={{ bgcolor: 'rgba(224, 242, 255, 1)', mt: '2px !important', mb: '2px !important' }} />
                    ))}
                    <Typography variant="normal">
                        {params?.row?.transportRate?.originZone?.zipCodes?.join(", ")}
                    </Typography>
                </Stack>
            )
        },
        {
            field: 'destinationZoneId',
            headerName: 'Destination',
            width: 100,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Box sx={{ fontWeight: 'bold' }}>
                    {params?.row?.transportRate?.destinationZone?.zoneName}
                </Box>
            )
        },
        {
            field: 'destinationZipCode',
            headerName: 'Destination Zip Code',
            width: 170,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', pt: 1 }} alignItems={'center'} >
                    {params?.row?.transportRate?.destinationZone?.ranges?.map((range, index) => (
                        <Chip key={index} label={range} size="small" sx={{ bgcolor: 'rgba(224, 242, 255, 1)', mt: '2px !important', mb: '2px !important' }} />
                    ))}
                    <Typography variant="normal">
                        {params?.row?.transportRate?.destinationZone?.zipCodes?.join(", ")}
                    </Typography>
                </Stack>
            )
        },
        {
            field: "details",
            headerName: "Rates",
            minWidth: 300,
            minHeight: 200,
            flex: 1,
            renderCell: (params) => {
                const element = (
                    <Box>
                        <Stack flexDirection={'column'} sx={{ mt: 0.5, mb: 0.5, }}>
                            {
                                params?.row?.transportRate?.details?.map((detail) => (
                                    <Stack key={detail.rateDetailId} flexDirection={'row'} spacing={1} alignItems="flex-end">
                                        <Typography variant="normal" sx={{ width: "130px" }}>{detail?.rateField}</Typography>
                                        <Typography variant="normal" sx={{ width: "auto" }}>{detail.chargeValue}</Typography>
                                    </Stack>
                                ))
                            }
                        </Stack>
                    </Box>
                );
                return element;
            }
        },
        {
            field: 'expiryDate',
            headerName: 'Expiry Date',
            width: 150,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const formatted = new Date(params?.row?.transportRate?.expiryDate).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                }).replace(/\//g, '-');
                <Box>
                    {formatted}
                </Box>
            }
        },
        {
            field: "actions",
            headerName: "Action",
            minWidth: 110,
            flex: 1,
            cellClassName: 'center-status-cell',
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
                        <Tooltip title={'View'} arrow>
                            <Box onClick={() => {
                                dispatch(setCurrentRateRoutedFrom('carrier'));
                                dispatch(setSelectedTeminalTabRowDetails(params.row));
                                // rate view  process
                                dispatch(setSelectedCurrentRateRow(params.row.transportRate));
                                localStorage.setItem('rateId', params?.row?.rateId);
                                setActionType("View");
                                dispatch(getOriginZoneByZipCode(params?.row?.transportRate?.originZone?.zipCodes.join(',').concat(",", params?.row?.transportRate?.originZone?.ranges?.join(',')) || ''));
                                dispatch(getDestinationZoneByZipCode(params?.row?.transportRate?.destinationZone?.zipCodes.join(',').concat(",", params?.row?.transportRate?.destinationZone?.ranges?.join(',')) || ''));

                                dispatch(getCarrierListByRateID(params.row.rateId));
                                navigate(PATH_DASHBOARD?.maintenance?.carrierMaintenance?.rateView);

                            }} sx={{ display: 'inline-flex', cursor: 'pointer' }} >
                                <Iconify icon="carbon:view-filled" sx={{ color: '#000', mr: 2 }} />
                            </Box>
                        </Tooltip>

                        <Tooltip title={'Delete'} arrow>
                            <Box onClick={() => {
                                dispatch(deleteTerminalRate(params?.row?.terminalRateId));
                            }} sx={{ display: 'inline-flex', cursor: 'pointer' }}>
                                <Iconify icon="jam:delete-f" sx={{ color: '#000', }} />
                            </Box>
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        },
    ];


    useEffect(() => {
        dispatch(setTerminalViewTabData([]));
        dispatch(setSelectedTeminalTabRowDetails({}));
        // Dispatch action to fetch rate dashboard data
        dispatch(setTableBeingViewed('personnel'));
    }, []);
    useEffect(() => {
        if (currentTerminalTab === 'personnel') {
            dispatch(clearNotesState());
            setTableColumns(personnelColumns);
            dispatch(getPersonnelTerminalData({ terminalId: selectedCarrierTabRowDetails.terminalId, pageNo: pagination.page, pageSize: pagination.pageSize }));
        }
        if (currentTerminalTab === 'quality') {
            dispatch(clearNotesState());
            setTableColumns(qualityColumns);
            dispatch(getQualityTerminalData({ pageNo: pagination.page, pageSize: pagination.pageSize }));
        }
        if (currentTerminalTab === 'accessorial') {
            dispatch(getAccessorialData());
            dispatch(clearNotesState());
            setTableColumns(accessorialColumns);
            dispatch(getStationAccessorialData(selectedCarrierTabRowDetails.entityId || localStorage.getItem('terminalEntityId')));
        }
        if (currentTerminalTab === 'rate') {
            dispatch(clearNotesState());
            setTableColumns(rateColumns);
            // call rate.jsx carrier transport rate
            dispatch(getTerminalRateData(selectedCarrierTabRowDetails.terminalId, 'TRANSPORT'));
        }
    }, [currentTerminalTab]);
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
        if (operationalMessage === 'Personnel deleted successfully.') {
            dispatch(getPersonnelTerminalData({ terminalId: selectedCarrierTabRowDetails.terminalId, pageNo: pagination.page, pageSize: pagination.pageSize }));
        }
        if (operationalMessage === 'Terminal rate deleted successfully') {
            dispatch(getTerminalRateData(selectedCarrierTabRowDetails.terminalId, 'TRANSPORT'));
        }
    }, [operationalMessage])
    useEffect(() => {
        if (operationalAccessorialMessage) {
            setSnackbarMessage(operationalAccessorialMessage);
            setSnackbarOpen(true);
        }
        if (operationalAccessorialMessage === 'Accessorial Service updated successfully' || operationalAccessorialMessage === 'Accessorial deleted successfully') {
            dispatch(getStationAccessorialData(selectedTerminalTabRowDetails.entityId || localStorage.getItem('terminalEntityId')));
        }
    }, [operationalAccessorialMessage])
    useEffect(() => {
        console.log(stationTabTableData);
    }, [stationTabTableData]);

    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
        notesRef.current = {};
        dispatch(setSelectedCarrierTabRowDetails({}));
    };
    const handleCloseEdit = () => {
        setOpenEditDialog(false);
        setActionType("");
        dispatch(setSelectedCarrierTabRowDetails({}));
    };

    return (
        <>
            <ErrorBoundary
                FallbackComponent={ErrorFallback}
                onError={logError}
                onReset={() => {
                    // Optional: reset app state here if necessary before retry
                    console.log("Error boundary reset triggered");
                }}
            >
                <Box sx={{ width: "100%", flex: 1, mt: 2 }}>

                    {currentTerminalTab === 'personnel' && <DataGrid
                        rows={terminalViewTabData}
                        columns={tableColumns}
                        loading={isLoading}
                        getRowId={(row) => row?.personnelId }
                        pagination
                        getRowHeight={() => 'auto'}
                        hideFooterSelectedRowCount
                        paginationMode="server"
                        paginationModel={paginationModel}
                        onPaginationModelChange={(newModel) => {
                            setPaginationModel(newModel);
                            dispatch(getPersonnelTerminalData({
                                terminalId: selectedCarrierTabRowDetails.terminalId,
                                pageNo: newModel.page + 1,
                                pageSize: newModel.pageSize,
                            }));
                        }}
                        onPageChange={(newPage) => {
                            dispatch(getPersonnelTerminalData({ terminalId: selectedCarrierTabRowDetails.terminalId, pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, }));
                        }}
                        onPageSizeChange={(newPageSize) => {
                            dispatch(getPersonnelTerminalData({ terminalId: selectedCarrierTabRowDetails.terminalId, pageNo: 1, pageSize: newPageSize, }));
                        }}
                        pageSizeOptions={[5, 10, 50, 100]}
                        rowCount={parseInt(pagination?.totalRecords || '0', 10)}
                        autoHeight
                    />}
                    {
                        currentTerminalTab === 'quality' && <DataGrid
                            rows={terminalViewTabData}
                            columns={tableColumns}
                            loading={isLoading}
                            getRowId={(row) => row.qualityId}
                            pagination
                            getRowHeight={() => 'auto'}
                            hideFooterSelectedRowCount
                            autoHeight
                        />
                    }
                    {
                        currentTerminalTab === 'rate' && <DataGrid
                            rows={terminalViewTabData}
                            columns={tableColumns}
                            loading={isLoading}
                            getRowId={(row) => row.rateId}
                            pagination
                            getRowHeight={() => 'auto'}
                            hideFooterSelectedRowCount
                            autoHeight
                        />
                    }
                    {currentTerminalTab === 'accessorial' && <DataGrid
                        rows={stationTabTableData}
                        columns={tableColumns}
                        loading={isLoading}
                        getRowId={(row) => row?.accessorialId}
                        pagination
                        getRowHeight={() => 'auto'}
                        hideFooterSelectedRowCount
                        autoHeight
                    />}
                </Box>
                <Dialog open={openConfirmDialog} onClose={handleCloseConfirm} onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        handleCloseConfirm();
                    }
                }}
                    sx={{
                        '& .MuiDialog-paper': { // Target the paper class
                            width: '1000px',
                            height: '80%',
                            maxHeight: 'none',
                            maxWidth: 'none',
                        }
                    }}
                >
                    <DialogContent>
                        <>
                            <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                                <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Carrier Notes</Typography>
                                <Iconify icon="carbon:close" onClick={() => handleCloseConfirm()} sx={{ cursor: 'pointer' }} />
                            </Stack>
                            <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
                        </>
                        <Box sx={{ pt: 2 }}>
                            <NotesTable notes={notesRef.current} handleCloseConfirm={handleCloseConfirm} />
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
                            width: '1545px',
                            height: 'auto',
                            maxHeight: 'none',
                            maxWidth: 'none',
                        }
                    }}
                >
                    <DialogContent>
                        {
                            currentTerminalTab.toLowerCase() === 'personnel' && <TerminalPersonnelDetails type={actionType} handleCloseConfirm={handleCloseEdit} selectedTerminalTabRowDetails={selectedTerminalTabRowDetails} />
                        }
                        {
                            currentTerminalTab.toLowerCase() === 'accessorial' && <StationAccessorial type={actionType} handleCloseConfirm={handleCloseEdit} selectedStationTabRowDetails={selectedTerminalTabRowDetails} />
                        }
                        {
                            currentTerminalTab.toLowerCase() === 'rate' && <AddRate type={'Add'} handleCloseConfirm={handleCloseEdit} />
                        }
                    </DialogContent>
                </Dialog>

                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={3000} // Adjust the duration as needed
                    onClose={() => {
                        setSnackbarOpen(false);
                        dispatch(setOperationalMessage());
                    }}
                    message={snackbarMessage}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                />
            </ErrorBoundary>
        </>
    );
}