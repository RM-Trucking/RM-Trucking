import { Navigate, useRoutes } from 'react-router-dom';
import AuthGuard from '../auth/AuthGuard';
import GuestGuard from '../auth/GuestGuard';
// layouts
import DashboardLayout from '../layouts/dashboard';
import MainLayout from '../layouts/main';
// config
import { PATH_AFTER_LOGIN } from '../config';
//
import {
  // Auth
  LoginPage,
  DashboardPage,
  ShipmentBuildingPage,
  CustomerMaintenancePage,
  CustomerViewPage,
  RateViewPage,
  CarrierViewPage,
  CustomerStationViewPage,
  CustomerLayout,
  WarehouseMaintenancePage,
  RateLayout,
  ZoneLayout,
  AccessorialLayout,
  CarrierLayout,
  RateMaintenancePage,
  ZoneMaintenancePage,
  ZoneTableView,
  TerminalViewPage,
  CarrierMaintenancePage,
  AccesorialMaintenancePage,
  Page500,
  Page403,
  Page404,
} from './elements';


// ----------------------------------------------------------------------

export default function Router() {
  return useRoutes([


    // Auth
    {
      path: 'auth',
      children: [
        {
          path: 'login',
          element: (
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          ),
        },

        {
          path: 'logout',
          element: (
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          ),
        },
      ],
    },

    // Dashboard
    {
      path: 'app',
      element: (
        <AuthGuard>
          <DashboardLayout />
        </AuthGuard>
      ),
      children: [
        { element: <Navigate to={PATH_AFTER_LOGIN} replace />, index: true },
        { path: 'dashboard', element: <DashboardPage /> },
        { path: 'shipment-building', element: <ShipmentBuildingPage /> },
        {
          path: 'maintenance',
          children: [
            { element: <Navigate to="/app/maintenance/customer-maintenance" replace />, index: true },
            {
              path: 'customer-maintenance',
              element: <CustomerLayout />,
              children: [
                { index: true, element: <CustomerMaintenancePage /> },
                { path: 'customer-view', element: <CustomerViewPage /> },
                { path: 'station-view', element: <CustomerStationViewPage /> },
                { path: 'rate-maintenance', element: <RateMaintenancePage /> },
              ]
            },
            {
              path: 'carrier-maintenance',
              element: <CarrierLayout />,
              children: [
                { index:true, element : <CarrierMaintenancePage /> },
                { path: 'carrier-view', element: <CarrierViewPage /> },
                { path: 'terminal-view', element: <TerminalViewPage /> },
                { path: 'rate-maintenance', element: <RateMaintenancePage /> },
              ]
            },
            {
              path: 'rate-maintenance',
              element: <RateLayout />,
              children: [
                { index: true, element: <RateMaintenancePage /> },
                { path: 'rate-view', element: <RateViewPage /> },
              ]
            },
            {
              path: 'zone-maintenance',
              element: <ZoneLayout />,
              children: [
                { index: true, element: <ZoneMaintenancePage /> },
                { path: 'zone-table-view', element: <ZoneTableView /> }
              ]
            },
            {
              path: 'accesorial-maintenance',
              element: <AccessorialLayout />,
              children: [
                { index: true, element: <AccesorialMaintenancePage /> }
              ]
            },
          ],
        },
      ],
    },
    {
      element: <MainLayout />,
      children: [
        { element: <Navigate to="/auth/login" replace />, index: true },
      ],
    },
    { path: '500', element: <Page500 /> },
    { path: '404', element: <Page404 /> },
    { path: '403', element: <Page403 /> },
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
