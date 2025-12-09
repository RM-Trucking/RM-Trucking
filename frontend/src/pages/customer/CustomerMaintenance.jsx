import { Outlet } from 'react-router-dom';
import CustomerhomePage from '../../sections/customer/CustomerhomePage';
// ----------------------------------------------------------------------

export default function CustomerMaintenance() {
  return (
    <>
      <CustomerhomePage />
      <Outlet /> 
    </>
  );
}
