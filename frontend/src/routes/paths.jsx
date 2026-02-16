// ----------------------------------------------------------------------

function path(root, sublink) {
  return `${root}${sublink}`;
}

const ROOTS_AUTH = '/auth';
const ROOTS_DASHBOARD = '/app';

// ----------------------------------------------------------------------

export const PATH_AUTH = {
  root: ROOTS_AUTH,
  login: path(ROOTS_AUTH, '/login'),
  logout: path(ROOTS_AUTH, '/logout'),
  register: path(ROOTS_AUTH, '/register'),
  loginUnprotected: path(ROOTS_AUTH, '/login-unprotected'),
  registerUnprotected: path(ROOTS_AUTH, '/register-unprotected'),
  verify: path(ROOTS_AUTH, '/verify'),
  resetPassword: path(ROOTS_AUTH, '/reset-password'),
  changePassword: path(ROOTS_AUTH, '/change-password'),
  newPassword: path(ROOTS_AUTH, '/new-password'),
  createNewPassword: path(ROOTS_AUTH, '/create-new-password'),
  successMessage: path(ROOTS_AUTH, '/success-message'),
};

export const PATH_PAGE = {
  comingSoon: '/coming-soon',
  maintenance: '/maintenance',
  page403: '/403',
  page404: '/404',
  page500: '/500',
};

export const PATH_DASHBOARD = {
  root: ROOTS_DASHBOARD,
  general: {
    dashboard: path(ROOTS_DASHBOARD, '/dashboard'),
  },
  shipmentBuilding : path(ROOTS_DASHBOARD, '/shipment-building'),
  warehouseMaintenance : path(ROOTS_DASHBOARD, '/warehouse-maintenance'),
  maintenance: {
    root: path(ROOTS_DASHBOARD, '/maintenance/customer-maintenance'),
    customerMaintenance: {
      root : path(ROOTS_DASHBOARD, '/maintenance/customer-maintenance'),
      customerView : path(ROOTS_DASHBOARD, '/maintenance/customer-maintenance/customer-view'),
      customerStationView : path(ROOTS_DASHBOARD, '/maintenance/customer-maintenance/station-view'),
    },
    carrierMaintenance: {
      root : path(ROOTS_DASHBOARD, '/maintenance/carrier-maintenance'),
      carrierView :  path(ROOTS_DASHBOARD, '/maintenance/carrier-maintenance/carrier-view'),
    },
    zoneMaintenance: path(ROOTS_DASHBOARD, '/maintenance/zone-maintenance'),
    accesorialMaintenance: path(ROOTS_DASHBOARD, '/maintenance/accesorial-maintenance'),
    rateMaintenance : {
      root : path(ROOTS_DASHBOARD,'/maintenance/rate-maintenance'),
      rateView : path(ROOTS_DASHBOARD,'/maintenance/rate-maintenance/rate-view')
    },
  },
};

