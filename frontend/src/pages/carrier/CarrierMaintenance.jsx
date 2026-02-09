import { Outlet } from 'react-router-dom';
import CarrierHomePage from '../../sections/carrier/CarrierHomePage';
// ----------------------------------------------------------------------

export default function CarrierMaintenance() {
  return (
    <>
      <Outlet />
      <CarrierHomePage />
    </>
  );
}
