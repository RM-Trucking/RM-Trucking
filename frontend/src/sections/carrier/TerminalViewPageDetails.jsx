import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button
} from '@mui/material';
import Iconify from '../../components/iconify';
import { PATH_DASHBOARD } from '../../routes/paths';
import { useDispatch, useSelector } from '../../redux/store';
import TerminalDetails from './TerminalDetails';
import TerminalViewTabs from './TerminalViewTabs';
import TerminalViewPageTable from './TerminalViewPageTable';
// ----------------------------------------------------------------------

export default function TerminalViewPageDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    selectedCarrierTabRowDetails
  } = useSelector(({ carrierdata }) => carrierdata);
  const handleBack = () => {
    navigate(PATH_DASHBOARD?.maintenance?.carrierMaintenance?.carrierView);
  }
  // route back if it reloads
  useEffect(() => {
    if (location?.pathname === '/app/maintenance/carrier-maintenance/terminal-view' && Object.keys(selectedCarrierTabRowDetails).length === 0) {
      navigate(PATH_DASHBOARD?.maintenance?.carrierMaintenance?.root);
    }
  }, [location]);
  return (
    <>
      <Box
        sx={{
          display: 'flex', // Use flexbox for layout
          alignItems: 'center', // Center items vertically
          justifyContent: 'space-between', // Push left and right elements to ends
          padding: '8px 16px', // Standard MUI spacing for padding
        }}
      >
        {/* Left side: Back icon and "Customer" text */}
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleBack}>
          <Iconify icon="weui:back-filled" sx={{ mr: 1 }} />
          <Typography variant="h7" fontWeight={700} component="span" color="text.primary">
            Carrier Maintenance / Terminal
          </Typography>
        </Box>

        {/* Right side: "Back" button */}
        <Button
          variant="outlined"
          onClick={handleBack}
          sx={{
            height: '22px',
            fontWeight: 600,
            color: '#000',
            textTransform: 'none', // Prevent uppercase styling
            '&.MuiButton-outlined': {
              borderRadius: '4px',
              color: '#000',
              boxShadow: 'none',
              p: '2px 16px',
              bgcolor: '#fff',
              borderColor: '#000'
            },
          }}
        >
          Back
        </Button>
      </Box>
      {/* carrier details content  */}
      <Box sx={{
        p: 2,
        ml: 2,
        bgcolor: "#fff",
        borderRadius: '10px',
        mt: 2,
      }}>
        <TerminalDetails type={'View'} selectedCarrierTabRowDetails={selectedCarrierTabRowDetails} />
        <TerminalViewTabs />
        <TerminalViewPageTable />
      </Box>
    </>
  );
}
