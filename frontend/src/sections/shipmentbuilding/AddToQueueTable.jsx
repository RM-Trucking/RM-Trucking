import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Typography
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { DataGrid } from '@mui/x-data-grid';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDispatch, useSelector } from '../../redux/store';
import { PATH_DASHBOARD } from '../../routes/paths';
import {
  setSelectedShipmentBuildObj,
} from '../../redux/slices/shipmentbuilding';
import AddToQueueSubmitDilog from './AddToQueueSubmitDilog';

export default function AddToQueueTable() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const addToQueueData = useSelector((state) => state?.shipmentbuildingdata?.addToQueueData);
  // --- 1. Dropdown Form States ---
  const [shipmentStatus, setShipmentStatus] = useState('Add to Queue');
  const [pickupAgent, setPickupAgent] = useState('Estes');
  const [linehaulCarrier, setLinehaulCarrier] = useState('Cal Sierra');
  const [deliveryAgent, setDeliveryAgent] = useState('Cal Sierra');
  // pagination model
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // --- 2. Checkbox States ---
  const [checkboxes, setCheckboxes] = useState({
    delIncl: true,
    rAndM: true,
    others: true,
  });

  // --- 3. Search State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleSubmitAction = () => {
    setIsModalOpen(true); // Triggers the modal on filter bar submit button click
  };

  const executeFinalSubmit = () => {
    setIsModalOpen(false);
    console.log("Processing final shipment submission payload...");
    // Put your API request or state dispatch action here
  };

  // --- Handlers ---
  const handleCheckboxChange = (event) => {
    setCheckboxes({
      ...checkboxes,
      [event.target.name]: event.target.checked,
    });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const filterPayload = {
      shipmentStatus,
      pickupAgent,
      linehaulCarrier,
      deliveryAgent,
      ...checkboxes,
      searchQuery
    };
    console.log('Filtering data:', filterPayload);
  };

  const handleAddToQueueAction = () => {
    console.log('Add to Queue action triggered');
  };

  const handleBackNavigation = () => {
    console.log('Back button clicked');
  };

  const columns = [
    {
      field: 'shipmentPro',
      headerName: 'Shipment PRO',
      width: 160,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {params.row.isLocked && (
            <LockIcon sx={{ fontSize: '1rem', color: '#000' }} />
          )}
          <span
            style={{
              color: '#b32424',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 500,
              marginLeft: !params.row.isLocked ? '20px' : '0px',
            }}
          >
            {params.value}
          </span>
        </Box>
      ),
    },
    { field: 'customer', headerName: 'Customer', width: 110 },
    { field: 'origin', headerName: 'Origin', width: 150 },
    { field: 'destination', headerName: 'Destination', width: 160 },
    { field: 'serviceLevel', headerName: 'Service Level', width: 120 },
    {
      field: 'totalWt',
      headerName: 'Total Wt (lbs)',
      width: 120,
      type: 'number',
      headerAlign: 'left',
      align: 'left'
    },
    { field: 'hazmat', headerName: 'Hazmat', width: 90 },
    { field: 'pickupAgent', headerName: 'Pickup Agent', width: 130 },
    { field: 'linehaulCarrier', headerName: 'Line haul Carrier', width: 140 },
    { field: 'deliveryAgent', headerName: 'Delivery Agent', width: 130 },
    { field: 'user', headerName: 'User', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            console.log(`Queue item: ${params.row.id}`);

          }}
          sx={{
            bgcolor: '#4caf50',
            color: '#fff',
            textTransform: 'none',
            fontSize: '0.75rem',
            px: 1.5,
            py: 0.2,
            borderRadius: '4px',
            boxShadow: 'none',
          }}
        >
          Add to Queue
        </Button>
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 100,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => {
              console.log(`View ${params.row.id}`);
              // dispatch(setSelectedShipmentBuildObj(params?.row?.rowDetails));
              // navigate(PATH_DASHBOARD.shipmentBuilding.shipmentView);
            }}
          >
            <VisibilityIcon sx={{ fontSize: '1.2rem', color: '#000' }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => console.log(`Delete ${params.row.id}`)}
          >
            <DeleteIcon sx={{ fontSize: '1.2rem', color: '#000' }} />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box
      component="form"
      onSubmit={handleFilterSubmit}
      sx={{ p: 2, bgcolor: '#ffffff', width: '100%' }}
    >
      {/* ROW 1: Back Navigation link */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ChevronLeftIcon onClick={() => navigate(PATH_DASHBOARD?.shipmentBuilding?.root)} />}
          sx={{
            color: '#333',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            p: 0,
            minWidth: 'auto',
            '&:hover': { bgcolor: 'transparent', color: '#000' }
          }}
        >
          Add to Queue
        </Button>
      </Box>

      {/* ROW 2: Dropdown Inputs (Left) & Total Weight + Submit Actions (Right) */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2
        }}
      >
        {/* Dropdowns Group */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {/* Select Shipment Status */}
          <FormControl variant="standard" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-label">Select Shipment Status</InputLabel>
            <Select
              labelId="status-label"
              value={shipmentStatus}
              onChange={(e) => setShipmentStatus(e.target.value)}
            >
              <MenuItem value="Add to Queue">Add to Queue</MenuItem>
              <MenuItem value="In Transit">In Transit</MenuItem>
              <MenuItem value="Delivered">Delivered</MenuItem>

            </Select>
          </FormControl>

          {/* Pickup Agent */}
          <FormControl variant="standard" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="pickup-label">Pickup Agent</InputLabel>
            <Select
              labelId="pickup-label"
              value={pickupAgent}
              onChange={(e) => setPickupAgent(e.target.value)}
            >
              <MenuItem value="R&M">R&M</MenuItem>
              <MenuItem value="Estes">Estes</MenuItem>
              <MenuItem value="FedEx">FedEx</MenuItem>
            </Select>
          </FormControl>

          {/* Linehaul Carrier */}
          <FormControl variant="standard" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="linehaul-label">Linehaul Carrier</InputLabel>
            <Select
              labelId="linehaul-label"
              value={linehaulCarrier}
              onChange={(e) => setLinehaulCarrier(e.target.value)}
            >
              <MenuItem value="Cal Sierra">Cal Sierra</MenuItem>
            </Select>
          </FormControl>

          {/* Delivery Agent */}
          <FormControl variant="standard" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="delivery-label">Delivery Agent</InputLabel>
            <Select
              labelId="delivery-label"
              value={deliveryAgent}
              onChange={(e) => setDeliveryAgent(e.target.value)}
            >
              <MenuItem value="Cal Sierra">Cal Sierra</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Right Side Info Area: Total Weight and Submit Button */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
          <Typography
            variant="body1"
            sx={{ fontWeight: 'bold', color: '#000', fontSize: '0.95rem' }}
          >
            Total Weight - 2000 lbs
          </Typography>
          <Button
            onClick={() =>{
              setIsModalOpen(true);
            }}
            variant="contained"
            size="small"
            sx={{
              bgcolor: '#a61c1c',
              '&:hover': { bgcolor: '#851414' },
              textTransform: 'none',
              px: 3,
              py: 0.4,
              fontWeight: 'bold',
              borderRadius: '4px',
              minWidth: '100px'
            }}
          >
            Submit
          </Button>
        </Box>
      </Box>

      {/* ROW 3: Checkboxes, Filter Action, Search & Density Icon */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        {/* Left Side: Checkboxes & Filter Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormGroup row sx={{ gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={checkboxes.delIncl}
                  onChange={handleCheckboxChange}
                  name="delIncl"
                  size="small"
                  sx={{ color: '#0d233a', '&.Mui-checked': { color: '#0d233a' } }}
                />
              }
              label="Del Incl"
              slotProps={{ typography: { fontSize: '0.85rem', fontWeight: 500 } }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={checkboxes.rAndM}
                  onChange={handleCheckboxChange}
                  name="rAndM"
                  size="small"
                  sx={{ color: '#0d233a', '&.Mui-checked': { color: '#0d233a' } }}
                />
              }
              label="R&M"
              slotProps={{ typography: { fontSize: '0.85rem', fontWeight: 500 } }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={checkboxes.others}
                  onChange={handleCheckboxChange}
                  name="others"
                  size="small"
                  sx={{ color: '#0d233a', '&.Mui-checked': { color: '#0d233a' } }}
                />
              }
              label="Others"
              slotProps={{ typography: { fontSize: '0.85rem', fontWeight: 500 } }}
            />
          </FormGroup>

          <Button
            type="submit"
            variant="contained"
            size="small"
            sx={{
              bgcolor: '#a61c1c',
              '&:hover': { bgcolor: '#851414' },
              textTransform: 'none',
              px: 3,
              borderRadius: '4px',
              fontWeight: 'bold',
              height: '26px',
              fontSize: '0.8rem'
            }}
          >
            Filter
          </Button>
        </Box>

        {/* Right Side: Search and Dense Filter Icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              minWidth: 240,
              '& .MuiOutlinedInput-root': {
                height: '32px',
                borderRadius: '4px',
                bgcolor: '#fafafa'
              }
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ color: '#aaa', fontSize: '1.25rem' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <IconButton size="small" sx={{ border: '1px solid #ddd', borderRadius: '4px', p: '5px' }}>
            <FilterListIcon sx={{ color: '#333', fontSize: '1.25rem' }} />
          </IconButton>
        </Box>
      </Box>
      {/* ROW 4: Data Grid Table */}
      <Box sx={{ height: 400, bgcolor: '#fff', mt: 2, }}>
        <DataGrid
          rows={addToQueueData}
          columns={columns}
          checkboxSelection
          disableRowSelectionOnClick
          rowHeight={46}
          headingHeight={42}
          sx={{
            // --- 1. Your existing checkbox styles ---
            '& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-checkboxInput': {
              display: 'none',
            },
            '& .MuiDataGrid-cellCheckbox .MuiCheckbox-root': {
              color: 'rgba(0, 25, 76, 1)',
            },
            '& .MuiDataGrid-cellCheckbox .MuiCheckbox-root.Mui-checked': {
              color: 'rgba(0, 25, 76, 1)',
            },

            // --- 2. Make the Selection Checkbox Column Sticky as well ---
            '& .MuiDataGrid-columnHeaderCheckbox': {
              position: 'sticky !important',
              left: '0px !important',
              zIndex: 3,
              backgroundColor: '#fff',
            },
            '& .MuiDataGrid-cellCheckbox': {
              position: 'sticky !important',
              left: '0px !important',
              zIndex: 1,
              backgroundColor: '#fff',
            },

            // --- 3. Freeze Action Header Column (Offset by checkbox width) ---
            '& .MuiDataGrid-columnHeader[data-field="actions"]': {
              position: 'sticky !important',
              right: '0px !important', // 50px offset accommodates the checkbox column width
              zIndex: 3,
              backgroundColor: '#fff',
              boxShadow: '2px 0px 4px -2px rgba(0,0,0,0.15)', // Right edge shadow divider
            },

            // --- 4. Freeze Action Body Cells ---
            '& .MuiDataGrid-cell[data-field="actions"]': {
              position: 'sticky !important',
              right: '0px !important', // Matches header layout mapping offset
              zIndex: 1,
              backgroundColor: '#fff',
              boxShadow: '2px 0px 4px -2px rgba(0,0,0,0.15)',
            },

            // --- 5. Preserve Background Highlights during Row Hovers ---
            '& .MuiDataGrid-row:hover .MuiDataGrid-cellCheckbox': {
              backgroundColor: '#f5f5f5',
            },
            '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="actions"]': {
              backgroundColor: '#f5f5f5',
            },
          }}
          pageSizeOptions={[5, 10, 50, 100]}

        //                     onRowSelectionModelChange={(newSelectionModel) => {
        //                         let extractedIdsArray = [];

        //                         // Support both old array structures and newer Set-based object shapes defensively
        //                         if (newSelectionModel && typeof newSelectionModel === 'object' && 'ids' in newSelectionModel) {
        //                             // Convert MUI's internal Set back into a standard array for your .includes() calls
        //                             extractedIdsArray = Array.from(newSelectionModel.ids || []);
        //                         } else if (Array.isArray(newSelectionModel)) {
        //                             extractedIdsArray = newSelectionModel;
        //                         }

        //                         // 1. Now safely store a real primitive Array in your state
        //                         setSelectedRowIds(extractedIdsArray);
        //                         dispatch(setSelectedShipments(extractedIdsArray));

        //                         // 2. Sync with your Del checkboxes safely using the extracted array
        //                         setDelCheckedRowIds((prev) => {
        //                             const currentDelIds = Array.isArray(prev) ? prev : [];
        //                             return currentDelIds.filter(id => !extractedIdsArray.includes(id));
        //                         });
        //                     }}
        //                     disableVirtualization={true}
        //                     loading={addToQueueLoading}
        //                     getRowId={(row) => row?.addToQueueId}
        //                     pagination
        //                     hideFooterSelectedRowCount
        //                     paginationMode="server"
        //                     paginationModel={paginationModel || { page: 0, pageSize: 10 }}
        //                     onPaginationModelChange={(newModel) => {
        //                         if (!newModel) return;
        //                         setPaginationModel(newModel);
        //                         dispatch(getShipmentBuildData({
        //                             pageNo: newModel.page + 1,
        //                             pageSize: newModel.pageSize,
        //                             searchStr: shipmentBuildSearchStr,
        //                         }));
        //                     }}
        //                     onPageChange={(newPage) => {
        //                         dispatch(getShipmentBuildData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, searchStr: shipmentBuildSearchStr, }));
        //                     }}
        //                     onPageSizeChange={(newPageSize) => {
        //                         dispatch(getShipmentBuildData({ pageNo: 1, pageSize: newPageSize, searchStr: shipmentBuildSearchStr, }));
        //                     }}
        />
      </Box>
      <AddToQueueSubmitDilog
        open={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        handleConfirm={executeFinalSubmit}
      />
    </Box>
  );
}
