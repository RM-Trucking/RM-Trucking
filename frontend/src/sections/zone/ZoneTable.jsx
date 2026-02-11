import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { alpha, styled } from '@mui/material/styles';
import { Box, Switch, Stack, Typography, Button, Chip, Tooltip, Divider, Dialog, DialogContent, Snackbar, MenuItem } from '@mui/material';
import { useDispatch, useSelector } from '../../redux/store';
import Iconify from '../../components/iconify';
import ZoneDetails from './ZoneDetails';
import RateViewTable from './RateViewTable';
import { setSelectedZoneRowDetails, getZoneData, setOperationalMessage, deleteZone } from '../../redux/slices/zone';



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
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openRateDialog, setOpenRateDialog] = useState(false);
    const [actionType, setActionType] = useState('');

    // pagination model
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    // snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // rate data
    const rateData = [
        {
            rateId : 1,
            origin : 'ORD',
            originZipCode : '60501',
            destination : 'Ankeny',
            destinationZipCode : '50007',
            customers : 26,
            status : 'Y',
            min : '100',
            rate100 : '100',
            rate1000 : '1000',
            rate3000 : '3000',
            rate5000 : '5000',
            rate10000 : '10000',
            max : '10000',
            expiryDate : '12-30-2026',
        }
    ]


    // datagrid columns
    const columns = [
        {
            field: 'zoneName',
            headerName: 'Zone Name',
            width: 300,
        },
        {
            field: 'zipCodes',
            headerName: 'Zip Codes',
            width: 700,
            renderCell: (params) => {
                const element = (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} alignItems={'center'} >
                        {params.row.ranges?.map((range, index) => (
                            <Chip key={index} label={range} size="small" sx={{ bgcolor: 'rgba(224, 242, 255, 1)', mt:'2px !important',mb:'2px !important' }} />
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
            field: 'zoneId',
            headerName: 'rate ID',
            width: 100,
            renderCell: (params) => {
                const element = (
                    <Stack direction="row" spacing={1} sx={{ mb:0.5,flexWrap: 'wrap', bgcolor: 'rgba(224, 242, 255, 1)', width : "50px", pl: 0.5, height : '25px', mt: 1.2, pt:0.5}} alignItems={'flex-start'} 
                        onClick={() => {
                            setOpenRateDialog(true);
                            dispatch(setSelectedZoneRowDetails(params?.row));
                        }}
                    >
                        <Iconify icon="ep:list" sx={{ color: 'black', cursor: 'pointer', }} />
                        <Typography variant="normal" sx={{ height : '25px' }}>
                            06
                        </Typography>
                    </Stack>
                );
                return element;
            }
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
                            <Iconify icon="carbon:view-filled" sx={{ color: '#000', mr: 2 }} onClick={() => {
                                setOpenEditDialog(true);
                                setActionType('View');
                                dispatch(setSelectedZoneRowDetails(params?.row));
                            }} />
                        </Tooltip>
                        <Tooltip title={'Edit'} arrow onClick={() => {
                            setOpenEditDialog(true);
                            setActionType('Edit');
                            dispatch(setSelectedZoneRowDetails(params.row));
                        }}>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', mr: 2 }} />
                        </Tooltip>
                        <Tooltip title={'Delete'} arrow>
                            <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', }} onClick={() => {
                                setActionType('Delete');
                                // using callback to refresh table data after delete
                                dispatch(deleteZone(params?.row?.zoneId, () => {
                                    dispatch(getZoneData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: zoneSearchStr }));
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

    // call api to get table data
    useEffect(() => {
        dispatch(getZoneData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: zoneSearchStr }));
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
    }, [operationalMessage])

    useEffect(() => {
        console.log('zone rows updated', zoneData);
    }, [zoneData])

    // dialog actions and functions
    const handleCloseEdit = () => {
         setActionType('');
        setOpenEditDialog(false);
    };
    const handleCloseRate = () => {
        setOpenRateDialog(false);
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
                <ZoneDetails type={actionType} handleCloseConfirm={handleCloseEdit} selectedZoneRowDetails={selectedZoneRowDetails}/>
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
                <RateViewTable rateDataArr={rateData}/>
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
    </>)
}
