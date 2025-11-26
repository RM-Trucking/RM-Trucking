import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// @mui
import {
  Box, Stack, Drawer
} from '@mui/material';
// hooks
import useResponsive from '../../../hooks/useResponsive';
// config
import { NAV } from '../../../config';
// components
import Scrollbar from '../../../components/scrollbar';
import { NavSectionVertical } from '../../../components/nav-section';
// routes
import { PATH_DASHBOARD } from '../../../routes/paths';


// ----------------------------------------------------------------------

NavVertical.propTypes = {
};

export default function NavVertical({ }) {
  const { pathname } = useLocation();
  const navConfig = [
    {
      "title": "Dashboard",
      "path": "/app/dashboard",
      "icon": null
    },
    {
      "title": "Shipment Building",
      "path": "/app/shipment-building",
      "icon": null
    },
    {

      "title": "Maintenance",
      "path": "/app/maintenance/customer-maintenance",
      "icon": null,
      "children": [
        {
          "title": "Customer Maintenance",
          "path": "/app/maintenance/customer-maintenance"
        },
        {
          "title": "Carrier Maintenance",
          "path": "/app/maintenance/carrier-maintenance"
        },
        {
          "title": "Rate Maintenance",
          "path": "/app/maintenance/rate-maintenance"
        },
        {
          "title": "Zone Maintenance",
          "path": "/app/maintenance/zone-maintenance"
        },
        {
          "title": "Accesorial Maintenance",
          "path": "/app/maintenance/accesorial-maintenance"
        }
      ]
    }
  ];

  const renderContent = (
    <Scrollbar
      sx={{
        height: 1,
        '& .simplebar-content': {
          height: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {navConfig && <NavSectionVertical data={navConfig} />}
      <Box sx={{ flexGrow: 1 }} />
    </Scrollbar>
  );

  return (
    <Box
      component="nav"
    >
      <Drawer
        open
        variant="permanent"
        PaperProps={{
          sx: {
            width: NAV.W_DASHBOARD,
            bgcolor: '#A22',
            border: "none",
            marginTop: 7.4,
            display: { xs: "none", sm: "block" }
          },
        }}
      >
        {renderContent}
      </Drawer>

    </Box>
  );
}
