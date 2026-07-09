import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import {
    Box, Stack, Typography, Button, Dialog,
    DialogContent, Tooltip, Divider
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
    // pagination model
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const shipmentColumns = [

    ];

    // get call for notes
    useEffect(() => {
        dispatch(setTableBeingViewed('shipment view'));
    }, []);

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
        </>
    );
}