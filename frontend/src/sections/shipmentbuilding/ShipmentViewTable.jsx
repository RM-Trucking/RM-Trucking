import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import {
    Box, Stack, Typography, Button, Dialog,
    DialogContent, Tooltip, Divider, IconButton, Chip, Snackbar, Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import { useDispatch, useSelector } from '../../redux/store';
import CustomNoRowsOverlay from '../shared/CustomNoRowsOverlay';
import Iconify from '../../components/iconify';
import { setTableBeingViewed } from '../../redux/slices/customer';
import { getNotesData, postNote } from '../../redux/slices/note';
import StyledTextField from '../shared/StyledTextField';
import convertLocalToET from '../../utils/timeConversion';
import {
    getShipmentBuildData, setError, setOperationalMessage,
} from '../../redux/slices/shipmentbuilding';

ShipmentViewTable.PropTypes = {

};

export default function ShipmentViewTable({ }) {
    const dispatch = useDispatch();
    const isLoading = useSelector((state) => state?.shipmentbuildingdata?.isLoading);
    const shipmentViewData = useSelector((state) => state?.shipmentbuildingdata?.shipmentViewData);
    const pagination = useSelector((state) => state?.shipmentbuildingdata?.shipmentBuildPagination);
    const operationalMessage = useSelector((state) => state?.shipmentdata?.operationalMessage);
    const shipmentSuccess = useSelector((state) => state?.shipmentdata?.shipmentSuccess);
    // pagination model
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const [shipmentSuccessFlag, setShipmentSuccessFlag] = useState(false);

    const shipmentColumns = [
        {
            field: "shipmentPRONo",
            headerName: "Shipment PRO",
            minWidth: 200,
            flex: 1,
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const element = (
                    <Typography
                        variant='normal'
                        sx={{
                            p: 2,
                            color: '#AA2222',            // Applies the dark red/amber tone
                            textDecoration: 'underline'  // Underlines the text
                        }}
                    >
                        {params?.row?.shipmentPRONo}
                    </Typography>

                );
                return element;
            },
        },
        {
            field: "customerName",
            headerName: "Customer Name",
            minWidth: 200,
            flex: 1,
            filterable: false,
            sortable: false,
        },
        {
            field: "origin",
            headerName: "Origin",
            minWidth: 200,
            flex: 1,
            filterable: false,
            sortable: false,
        },
        {
            field: "destination",
            headerName: "Destination",
            minWidth: 200,
            flex: 1,
            filterable: false,
            sortable: false,
        },
        {
            field: "serviceLevel",
            headerName: "Service Level",
            minWidth: 200,
            flex: 1,
            filterable: false,
            sortable: false,
        },
        {
            field: "pickupAgent",
            headerName: "Pickup Agent",
            minWidth: 200,
            flex: 1,
            filterable: false,
            sortable: false,
        },
        {
            field: "pickupRouting",
            headerName: "Pickup Routing",
            minWidth: 200,
            flex: 1,
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const element = (
                    <IconButton >
                        <Iconify icon="majesticons:clock" sx={{ color: params.row.pickupRouting === 'pending' ? 'rgba(230, 181, 4, 1)' : params.row.pickupRouting === 'success' ? 'rgba(92, 172, 105, 1)' : '', pointerEvents: 'none' }} />
                    </IconButton>

                );
                return element;
            },
        },
        {
            field: "linehaulRouting",
            headerName: "Linehaul Routing",
            minWidth: 200,
            flex: 1,
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const element = (
                    <IconButton >
                        <Iconify icon="majesticons:clock" sx={{ color: params.row.linehaulRouting === 'pending' ? 'rgba(230, 181, 4, 1)' : params.row.linehaulRouting === 'success' ? 'rgba(92, 172, 105, 1)' : '', pointerEvents: 'none' }} />
                    </IconButton>

                );
                return element;
            },
        },
        {
            field: "deliveryRouting",
            headerName: "Delivery Routing",
            minWidth: 200,
            flex: 1,
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const element = (
                    <IconButton >
                        <Iconify icon="majesticons:clock" sx={{ color: params.row.deliveryRouting === 'pending' ? 'rgba(230, 181, 4, 1)' : params.row.deliveryRouting === 'success' ? 'rgba(92, 172, 105, 1)' : '', pointerEvents: 'none' }} />
                    </IconButton>

                );
                return element;
            },
        },
        {
            field: "status",
            headerName: "Status",
            minWidth: 100,
            align: 'center',
            cellClassName: 'center-status-cell',
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const element = (
                    <Box>
                        <Chip label={params?.row?.status} sx={{ backgroundColor: 'rgba(92, 172, 105, 1)' }} />
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
                    <Box>
                        <Tooltip title={'View'} arrow sx={{ mr: 2 }}>
                            <IconButton>
                                <Iconify icon="carbon:view-filled" sx={{ color: '#000', pointerEvents: 'none' }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={'Edit'} arrow sx={{ mr: 2 }}>
                            <IconButton >
                                <Iconify icon="tabler:edit" sx={{ color: '#000', pointerEvents: 'none' }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        },
    ];

    // get call for notes
    useEffect(() => {
        dispatch(setTableBeingViewed('shipment view'));
        dispatch(getShipmentBuildData({
            pageNo: paginationModel.page,
            pageSize: paginationModel.pageSize,
        }));
    }, []);
      useEffect(() => {
        if (shipmentSuccess && operationalMessage) {
         setShipmentSuccessFlag(true);
        }
      }, [operationalMessage])

    return (
        <>

            <Box sx={{ height: 400, width: "100%", flex: 1, mt: 2 }}>
                <DataGrid
                    checkboxSelection
                    rows={shipmentViewData}
                    columns={shipmentColumns}
                    loading={isLoading}
                    getRowId={(row) => row?.shipmentId}
                    pagination
                    slots={{
                        noRowsOverlay: CustomNoRowsOverlay,
                    }}
                    hideFooterSelectedRowCount
                    // Targets the checkbox container specifically in the header row
                    sx={{
                        '& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-checkboxInput': {
                            display: 'none',
                        },
                    }}
                    paginationMode="server"
                    paginationModel={paginationModel}
                    onPaginationModelChange={(newModel) => {
                        setPaginationModel(newModel);
                        // dispatch(getCustomerFuelSurchargeData({
                        //     pageNo: newModel.page + 1,
                        //     pageSize: newModel.pageSize,
                        //     searchStr: fuelSurchargeSearchStr,
                        // })); 
                    }}
                    onPageChange={(newPage) => {
                        // dispatch(getFuelSurchargeData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, searchStr: fuelSurchargeSearchStr, }));
                    }}
                    onPageSizeChange={(newPageSize) => {
                        // dispatch(getFuelSurchargeData({ pageNo: 1, pageSize: newPageSize, searchStr: fuelSurchargeSearchStr, }));
                    }}
                    pageSizeOptions={[5, 10, 50, 100]}
                    rowCount={parseInt(pagination?.totalRecords || '0', 10)}
                />
            </Box>

            <Snackbar
                        open={shipmentSuccessFlag}
                        autoHideDuration={3000}
                        onClose={() => {
                          setShipmentSuccessFlag(false);
                          dispatch(setError());
                          dispatch(setOperationalMessage(''));
                        }}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                      >
                        <Alert
                          onClose={() => {
                            setShipmentSuccessFlag(false);
                            dispatch(setOperationalMessage(''));
                          }}
                          severity="success"
                          variant="filled"
                          sx={{ width: '100%' }}
                        >
                          {operationalMessage || " New shipment created successfully."}
                        </Alert>
                      </Snackbar>
        </>
    );
}