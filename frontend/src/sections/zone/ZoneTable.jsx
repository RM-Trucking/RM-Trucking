import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { alpha, styled } from '@mui/material/styles';
import { Box, Switch, Stack, Typography, Button, Chip, Tooltip, Divider, Dialog, DialogContent, Snackbar, MenuItem } from '@mui/material';
import { useDispatch, useSelector } from '../../redux/store';
import Iconify from '../../components/iconify';
import ZoneDetails from './ZoneDetails';
import RateViewTable from './RateViewTable';
import { setSelectedZoneRowDetails, getZoneData, setOperationalMessage, deleteZone, getZoneCustomerRate, getZoneCarrierRate, setZoneRateData, setError } from '../../redux/slices/zone';
import { setSelectedCurrentRateRow, setCurrentRateRoutedFrom } from '../../redux/slices/rate';
import NotesTable from '../customer/NotesTable';



export default function ZoneTable() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const zoneData = useSelector((state) => state?.zonedata?.zoneData);
    const operationalMessage = useSelector((state) => state?.zonedata?.operationalMessage);
    const error = useSelector((state) => state?.zonedata?.error)
    const pagination = useSelector((state) => state?.zonedata?.pagination);
    const zoneSearchStr = useSelector((state) => state?.zonedata?.zoneSearchStr);
    const selectedZoneRowDetails = useSelector((state) => state?.zonedata?.selectedZoneRowDetails);
    const zoneLoading = useSelector((state) => state?.zonedata?.isLoading);
    const rateData = useSelector((state) => state?.zonedata?.zoneRateData);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openRateDialog, setOpenRateDialog] = useState(false);
    const [actionType, setActionType] = useState('');

    const notesRef = useRef({});
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

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
            field: 'zoneName',
            headerName: 'Zone Name',
            width: 300,
            cellClassName: 'padded-column',
        },
        {
            field: 'zipCodes',
            headerName: 'Zip Codes',
            width: 700,
            renderCell: (params) => {
                const element = (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', pt: 1 }} alignItems={'center'} >
                        {params.row.ranges?.map((range, index) => (
                            <Chip key={index} label={range} size="small" sx={{ bgcolor: 'rgba(224, 242, 255, 1)', mt: '2px !important', mb: '2px !important' }} />
                        ))}
                        <Typography variant="normal">
                            {params.row.zipCodes?.join(", ")}
                        </Typography>
                    </Stack>
                );
                return element;
            }
        },
        {
            field: 'customerRateCount',
            headerName: 'Customer Rate #',
            width: 200,
            cellClassName: 'padded-column',
            renderCell: (params) => {
                const element = (
                    <>
                        {
                            params?.row?.customerRateCount > 0 ? <Stack direction="row" spacing={1} sx={{ mb: 0.5, flexWrap: 'wrap', bgcolor: 'rgba(224, 242, 255, 1)', width: "50px", pl: 0.5, height: '25px', pt: 0.5 }} alignItems={'flex-start'}
                                onClick={() => {
                                    dispatch(setCurrentRateRoutedFrom('customer'));
                                    dispatch(getZoneCustomerRate(1, 10, params?.row?.zoneId));
                                    dispatch(setSelectedZoneRowDetails(params?.row));
                                }}
                            >
                                <Iconify icon="ep:list" sx={{ color: 'black', cursor: 'pointer', }} />
                                <Typography variant="normal" sx={{ height: '25px' }}>
                                    {params.row.customerRateCount}
                                </Typography>
                            </Stack> : <Typography variant="normal" sx={{ height: '25px', }}>
                                {params.row.customerRateCount}
                            </Typography>
                        }
                    </>
                );
                return element;
            }
        },
        {
            field: 'carrierRateCount',
            headerName: 'Carrier Rate #',
            width: 200,
            cellClassName: 'padded-column',
            renderCell: (params) => {
                const element = (
                    <>
                        {
                            params?.row?.carrierRateCount > 0 ? <Stack direction="row" spacing={1} sx={{ mb: 0.5, flexWrap: 'wrap', bgcolor: 'rgba(224, 242, 255, 1)', width: "50px", pl: 0.5, height: '25px', pt: 0.5 }} alignItems={'flex-start'}
                                onClick={() => {
                                    dispatch(setCurrentRateRoutedFrom('carrier'));
                                    dispatch(getZoneCarrierRate(1, 10, params?.row?.zoneId));
                                    dispatch(setSelectedZoneRowDetails(params?.row));
                                }}
                            >
                                <Iconify icon="ep:list" sx={{ color: 'black', cursor: 'pointer', }} />
                                <Typography variant="normal" sx={{ height: '25px' }}>
                                    {params.row.carrierRateCount}
                                </Typography>
                            </Stack> : <Typography variant="normal" sx={{ height: '25px', }}>
                                {params.row.carrierRateCount}
                            </Typography>
                        }
                    </>
                );
                return element;
            }
        },
        {
            field: "notes",
            headerName: "Notes",
            minWidth: 100,
            flex: 1,
            filterable: false,
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
                                setOpenEditDialog(true);
                                setActionType('View');
                                dispatch(setSelectedZoneRowDetails(params?.row));
                            }}
                                sx={{ display: 'inline-flex', cursor: 'pointer' }}>
                                <Iconify icon="carbon:view-filled" sx={{ color: '#000', mr: 2 }} />
                            </Box>
                        </Tooltip>
                        <Tooltip title={'Edit'} arrow>
                            <Box onClick={() => {
                                setOpenEditDialog(true);
                                setActionType('Edit');
                                dispatch(setSelectedZoneRowDetails(params.row));
                            }}
                                sx={{ display: 'inline-flex', cursor: 'pointer' }}>
                                <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 2 }} />
                            </Box>
                        </Tooltip>
                        <Tooltip title={'Delete'} arrow>
                            <Box
                                onClick={() => {
                                    setActionType('Delete');
                                    // using callback to refresh table data after delete
                                    dispatch(deleteZone(params?.row?.zoneId, () => {
                                        dispatch(getZoneData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: zoneSearchStr }));
                                    }));
                                }}
                                sx={{ display: 'inline-flex', cursor: 'pointer' }}>
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
        dispatch(getZoneData({ pageNo: 1, pageSize: 10, searchStr: zoneSearchStr }));
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
            setSnackbarMessage(`${(error?.error && error?.message) ? `${error?.error}. ${error?.message}` : `${error.message || error}`}`);
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

    useEffect(() => {
        console.log('zone rows updated', zoneData);
    }, [zoneData])

    // when there is data on rate view table for that particular zone id open the dialog to view rate table
    useEffect(() => {
        if (rateData && rateData.length > 0) {
            setOpenRateDialog(true);
        }
    }, [rateData])

    // dialog actions and functions
    const handleCloseEdit = () => {
        setActionType('');
        setOpenEditDialog(false);
        dispatch(setSelectedZoneRowDetails({}));
        localStorage.setItem('zoneZipCodeCheckData', JSON.stringify([]));
    };
    const handleCloseRate = () => {
        dispatch(getZoneData({ pageNo: 1, pageSize: 10, searchStr: zoneSearchStr }));
        dispatch(setZoneRateData([]));
        dispatch(setSelectedCurrentRateRow({}));
        setOpenRateDialog(false);
    };
    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
        notesRef.current = {};
    };

    return (<>
        <Box sx={{ height: 300, width: "100%", flex: 1 }}>
            <DataGrid
                paginationMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={(newModel) => {
                    setPaginationModel(newModel);
                    dispatch(getZoneData({
                        pageNo: newModel.page + 1,
                        pageSize: newModel.pageSize,
                        searchStr: zoneSearchStr
                    }));
                }}

                rows={zoneData || []}
                columns={columns}
                loading={zoneLoading}
                getRowId={(row) => row?.zoneId}
                hideFooterSelectedRowCount
                onPageChange={(newPage) => {
                    dispatch(getZoneData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, searchStr: zoneSearchStr }));
                }}
                onPageSizeChange={(newPageSize) => {
                    dispatch(getZoneData({ pageNo: 1, pageSize: newPageSize, searchStr: zoneSearchStr }));
                }}
                pageSizeOptions={[5, 10, 50, 100]}
                rowCount={parseInt(pagination?.totalRecords || '0', 10)}
                autoHeight
                pagination
                getRowHeight={() => 'auto'}
                sx={{
                    '& .padded-column': { paddingTop: 1 },
                }}
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
                    height: (actionType === 'Edit') ? '450px' : '400px',
                    maxHeight: 'none',
                    maxWidth: 'none',
                }
            }}
        >
            <DialogContent>
                <ZoneDetails type={actionType} handleCloseConfirm={handleCloseEdit} selectedZoneRowDetails={selectedZoneRowDetails} />
            </DialogContent>
        </Dialog>
        <Dialog open={openRateDialog} onClose={handleCloseRate} onKeyDown={(event) => {
            if (event.key === 'Escape') {
                handleCloseRate();
            }
        }}
            sx={{
                '& .MuiDialog-paper': { // Target the paper class
                    width: '1543px',
                    height: '80%',
                    maxHeight: 'none',
                    maxWidth: 'none',
                }
            }}
        >
            <DialogContent>
                <RateViewTable handleCloseRate={handleCloseRate} />
            </DialogContent>
        </Dialog>
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
