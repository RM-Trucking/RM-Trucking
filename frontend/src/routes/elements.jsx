import { Suspense, lazy } from 'react';
// components
import LoadingScreen from '../components/loading-screen';

// ----------------------------------------------------------------------

const Loadable = (Component) => (props) =>
  (
    <Suspense fallback={<LoadingScreen />}>
      <Component {...props} />
    </Suspense>
  );

// ----------------------------------------------------------------------

// AUTH
export const LoginPage = Loadable(lazy(() => import('../pages/auth/LoginPage')));

// Dashboard Page
export const DashboardPage = Loadable(lazy(() => import('../pages/dashboard/DashboardPage')));
export const ShipmentBuildingPage = Loadable(lazy(() => import('../pages/shipment/ShipmentBuildingPage')));
export const CustomerMaintenancePage = Loadable(lazy(() => import('../pages/customer/CustomerMaintenance')));
export const CustomerLayout = Loadable(lazy(() => import('../pages/customer/CustomerLayout')));
export const CustomerViewPage = Loadable(lazy(() => import('../pages/customer/CustomerViewPage')));
export const RateViewPage = Loadable(lazy(() => import('../pages/rate/RateViewPage')));
export const CarrierViewPage = Loadable(lazy(() => import('../pages/carrier/CarrierViewPage')));
export const CustomerStationViewPage = Loadable(lazy(() => import('../pages/customer/CustomerStationView')));
export const WarehouseMaintenancePage = Loadable(lazy(() => import('../pages/warehouse/WarehouseMaintenance')));
export const ZoneMaintenancePage = Loadable(lazy(() => import('../pages/zone/ZoneMaintenance')));
export const RateLayout = Loadable(lazy(() => import('../pages/rate/RateLayout')));
export const ZoneLayout = Loadable(lazy(() => import('../pages/zone/ZoneLayout')));
export const CarrierLayout = Loadable(lazy(() => import('../pages/carrier/CarrierLayout')));
export const AccessorialLayout = Loadable(lazy(() => import('../pages/accesorial/AccessorialLayout')));
export const RateMaintenancePage = Loadable(lazy(() => import('../pages/rate/RateMaintenance')));
export const CarrierMaintenancePage = Loadable(lazy(() => import('../pages/carrier/CarrierMaintenance')));
export const AccesorialMaintenancePage = Loadable(lazy(() => import('../pages/accesorial/AccesorialMaintenance')));

// Error pages
export const Page500 = Loadable(lazy(() => import('../pages/Page500')));
export const Page403 = Loadable(lazy(() => import('../pages/Page403')));
export const Page404 = Loadable(lazy(() => import('../pages/Page404')));