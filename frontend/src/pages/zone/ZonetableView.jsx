import { Outlet } from 'react-router-dom';
import ZoneTableViewPage from '../../sections/zone/ZoneTableViewPage';
// ----------------------------------------------------------------------

export default function ZoneTableView() {
  return (
    <>
      <ZoneTableViewPage />
      <Outlet /> 
    </>
  );
}
