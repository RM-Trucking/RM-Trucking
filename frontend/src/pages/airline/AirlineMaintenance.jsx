import { Outlet } from 'react-router-dom';
import AirlineHomePage from '../../sections/airline/AirlineHomePage';
// ----------------------------------------------------------------------

export default function AirlineMaintenance() {
  return (
    <>
      <AirlineHomePage />
      <Outlet /> 
    </>
  );
}
