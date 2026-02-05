import { Outlet } from 'react-router-dom';
import AccessorialHomePage from '../../sections/accessorial/AccessorialHomePage';
// ----------------------------------------------------------------------

export default function AccessorialMaintenance() {
  return (
    <>
      <AccessorialHomePage />
      <Outlet /> 
    </>
  );
}
