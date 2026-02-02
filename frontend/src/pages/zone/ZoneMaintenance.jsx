import { Outlet } from 'react-router-dom';
import ZoneHomePage from '../../sections/zone/ZoneHomePage';
// ----------------------------------------------------------------------

export default function ZoneMaintenance() {
  return (
    <>
      <ZoneHomePage />
      <Outlet /> 
    </>
  );
}
