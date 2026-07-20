import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import {
    Box, Stack, Typography, Button, Dialog,
    DialogContent, Tooltip, Divider, IconButton, Chip, Snackbar, Alert,
    MenuItem, FormControlLabel, Checkbox,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import { useDispatch, useSelector } from '../../redux/store';
import CustomNoRowsOverlay from '../shared/CustomNoRowsOverlay';
import Iconify from '../../components/iconify';
import MenuPopover from '../../components/menu-popover';
import { setTableBeingViewed } from '../../redux/slices/customer';
import { getNotesData, postNote } from '../../redux/slices/note';
import StyledTextField from '../shared/StyledTextField';
import convertLocalToET from '../../utils/timeConversion';
import {
    getShipmentBuildData, setError, setOperationalMessage as setShipmentBuildOperationalMessage,
} from '../../redux/slices/shipmentbuilding';
import {
    setOperationalMessage,
} from '../../redux/slices/shipment';

ShipmentViewTable.PropTypes = {

};

export default function ShipmentViewTable({ }) {
    const dispatch = useDispatch();
    const isLoading = useSelector((state) => state?.shipmentbuildingdata?.isLoading);
    const shipmentViewData = useSelector((state) => state?.shipmentbuildingdata?.shipmentViewData);
    const pagination = useSelector((state) => state?.shipmentbuildingdata?.shipmentBuildPagination);
    const operationalMessage = useSelector((state) => state?.shipmentdata?.operationalMessage);
    const shipmentSuccess = useSelector((state) => state?.shipmentdata?.shipmentSuccess);
    const shipmentBuildSearchStr = useSelector((state) => state?.shipmentbuildingdata?.shipmentBuildSearchStr);
    // pagination model
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const [shipmentSuccessFlag, setShipmentSuccessFlag] = useState(false);
    const [shipmentViewTableData, setShipmentViewTableData] = useState([]);
    const [openPopover, setOpenPopover] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleUserMenu = (event) => {
        setOpenPopover(true);
        setAnchorEl(event?.currentTarget);
    }
    const handleClosePopover = () => {
        setOpenPopover(false);
        setAnchorEl(null);
    };
    const handleClickedItem = async (event) => {
        if (event?.target?.id === 'delete') {
            // Handle delete action
        }
        setOpenPopover(false);
        setAnchorEl(null);
    }
    const handleCheckboxDelete = (rowId, isChecked) => {
        console.log(`Row ID: ${rowId} checked for delete: ${isChecked}`);
        // Track checked items here in a useState array
    };

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
                        <Iconify icon={(params?.row?.pickupRouting.toLowerCase() === 'pending') ? "majesticons:clock" : "ep:success-filled"} sx={{ color: params.row.pickupRouting?.toLowerCase() === 'pending' ? 'rgba(230, 181, 4, 1)' : params.row.pickupRouting?.toLowerCase() === 'success' ? 'rgba(92, 172, 105, 1)' : '', pointerEvents: 'none' }} />
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
                        <Iconify icon="majesticons:clock" sx={{ color: params.row.linehaulRouting?.toLowerCase() === 'pending' ? 'rgba(230, 181, 4, 1)' : params.row.linehaulRouting?.toLowerCase() === 'success' ? 'rgba(92, 172, 105, 1)' : '', pointerEvents: 'none' }} />
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
                        <Iconify icon="majesticons:clock" sx={{ color: params.row.deliveryRouting?.toLowerCase() === 'pending' ? 'rgba(230, 181, 4, 1)' : params.row.deliveryRouting?.toLowerCase() === 'success' ? 'rgba(92, 172, 105, 1)' : '', pointerEvents: 'none' }} />
                    </IconButton>

                );
                return element;
            },
        },
        {
            field: "status",
            headerName: "Status",
            minWidth: 300,
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                // 1. Safe extraction with fallback to empty string
                const rawStatus = params?.row?.status || "";

                // 2. Replace all underscores with spaces
                const cleanStatus = rawStatus.replaceAll('_', ' ');

                const element = (
                    <Box>
                        {/* 3. Display the cleaned string natively */}
                        <Chip label={cleanStatus} sx={{ backgroundColor: 'rgba(92, 172, 105, 1)' }} />
                    </Box>
                );
                return element;
            },
        },
        {
            field: "actions",
            headerName: "Action",
            minWidth: 400, // Increased minWidth slightly to comfortably fit all 4 inline elements
            flex: 1,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                // Safe access to your underlying row data if needed
                const rowId = params.id;

                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Tooltip title={'View'} arrow sx={{ mr: 1 }}>
                            <IconButton>
                                <Iconify icon="carbon:view-filled" sx={{ color: '#000', pointerEvents: 'none' }} />
                            </IconButton>
                        </Tooltip>

                        <IconButton sx={{ mr: 1 }} onClick={(e) => handleUserMenu(e, rowId)}>
                            <Iconify icon="qlementine-icons:menu-dots-16" sx={{ color: '#000', cursor: "pointer" }} />
                        </IconButton>

                        {/* Checkbox with Delete Label */}
                        <FormControlLabel
                            label="Del"
                            control={
                                <Checkbox
                                    size="small"
                                    sx={{ color: '#A22', '&.Mui-checked': { color: '#A22' } }}
                                    // Checked state should ideally bind to a tracking state array in your component
                                    onChange={(event) => {
                                        event.stopPropagation(); // Stops DataGrid row-click selection triggers
                                        handleCheckboxDelete(rowId, event.target.checked);
                                    }}
                                />
                            }
                            sx={{
                                ml: 1,
                                '& .MuiFormControlLabel-label': { fontSize: '0.875rem', fontWeight: 500 }
                            }}
                        />

                        {/* Pro Tip: Consider lifting this Popover out of renderCell to the main component level */}
                        <MenuPopover
                            open={openPopover}
                            anchorEl={anchorEl}
                            onClose={handleClosePopover}
                            sx={{ width: 150, p: 0, bgcolor: '#A22' }}
                            disableScrollLock
                        >
                            <Stack sx={{ p: 1 }}>
                                <MenuItem key="1" onClick={() => handleClickedItem(rowId)} id={"delete"} sx={{ color: "#fff" }}>
                                    Delete
                                </MenuItem>
                            </Stack>
                        </MenuPopover>
                    </Box>
                );
            },
        }
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
    }, [shipmentSuccess, operationalMessage])
    const transformDataGridRows = (apiResponseArray) => {
        if (!Array.isArray(apiResponseArray)) return [];

        return apiResponseArray.map((row) => {
            // 1. Destructure top-level properties safely
            const { shipmentId, shipmentDetails, customerDetails, carrierDetails } = row;

            // 2. Destructure deep nested objects safely using optional chaining (?.)
            const shipper = customerDetails?.shipperDetails;
            const consignee = customerDetails?.consigneeDetails;
            const pickup = carrierDetails?.pickupDetails;
            const linehaul = carrierDetails?.linehaulDetails;
            const delivery = carrierDetails?.deliveryDetails;
            
            // 3. Build concatenated address strings helper
            const formatAddress = (details) => {
                if (!details) return '';
                const parts = [details.addressLine1, details.addressLine2, details.city, details.state, details.zipCode].filter(Boolean);
                return parts.join(', '); // Result: "Los Angeles, CA, 90001"
            };

            // 4. Return the newly structured row object
            return {
                shipmentId: shipmentId,
                shipmentPRONo: shipmentId, // Kept empty as requested
                customerName: customerDetails?.customerName ?? "",
                origin: formatAddress(shipper),
                destination: formatAddress(consignee),
                serviceLevel: shipmentDetails?.serviceLevel ?? "",
                pickupAgent: pickup?.carrierName ?? "",
                pickupRouting: pickup?.carrierId ? "Success" : 'Pending',
                linehaulRouting: linehaul?.linehaulPrimaryInfo?.carrierId ? 'Success' : 'Pending',
                deliveryRouting: delivery?.deliveryPrimaryInfo?.carrierId ? "Success" : 'Pending',
                status: shipmentDetails?.status ?? '',
                rowDetails: row // Stores the entire original 1st object unmodified
            };
        });
    };

    useEffect(() => {
        // Usage:
        const dataGridRows = shipmentViewData?.length > 0 ? transformDataGridRows(shipmentViewData) : [];
        console.log(dataGridRows);
        setShipmentViewTableData(dataGridRows);
    }, [shipmentViewData])

    return (
        <>

            <Box sx={{ height: 400, width: "100%", flex: 1, mt: 2 }}>
                <DataGrid
                    checkboxSelection
                    rows={shipmentViewTableData}
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
                        dispatch(getShipmentBuildData({
                            pageNo: newModel.page + 1,
                            pageSize: newModel.pageSize,
                            searchStr: shipmentBuildSearchStr,
                        }));
                    }}
                    onPageChange={(newPage) => {
                        dispatch(getShipmentBuildData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, searchStr: shipmentBuildSearchStr, }));
                    }}
                    onPageSizeChange={(newPageSize) => {
                        dispatch(getShipmentBuildData({ pageNo: 1, pageSize: newPageSize, searchStr: shipmentBuildSearchStr, }));
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
                    New shipment created successfully.
                </Alert>
            </Snackbar>
        </>
    );
}