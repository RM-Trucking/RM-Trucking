import { Outlet } from 'react-router-dom';
import AirportCodeHomePage from '../../sections/airportcode/AirportCodeHomePage';
// ----------------------------------------------------------------------

export default function AirportCodeMaintenance() {
  return (
    <>
      <AirportCodeHomePage />
      <Outlet /> 
    </>
  );
}
