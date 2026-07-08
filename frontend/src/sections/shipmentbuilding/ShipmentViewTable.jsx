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

ShipmentViewTable.PropTypes = {
    
};

export default function ShipmentViewTable({  }) {
    const dispatch = useDispatch();
    const isLoading = useSelector((state) => state?.shipmentbuildingdata?.isLoading);
    const shipmentViewData = useSelector((state) => state?.shipmentbuildingdata?.shipmentViewData);
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
                    rows={shipmentViewData}
                    columns={shipmentColumns}
                    loading={isLoading}
                    getRowId={(row) => row?.shipmentId}
                    pagination
                    slots={{
                        noRowsOverlay: CustomNoRowsOverlay,
                    }}
                    hideFooterSelectedRowCount
                />
            </Box>
        </>
    );
}