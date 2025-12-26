import { Outlet } from 'react-router-dom';
import RatehomePage from '../../sections/rate/RatehomePage';
// ----------------------------------------------------------------------

export default function RateMaintenance() {
  return (
    <>
      <RatehomePage />
      <Outlet /> 
    </>
  );
}
