import { Outlet } from 'react-router-dom';
import BillOfLadingAuto from '../../sections/shipmentbuilding/BillOfLadingAuto';
// ----------------------------------------------------------------------

export default function BillOfLadingView() {
  return (
    <>
      <BillOfLadingAuto />
      <Outlet /> 
    </>
  );
}
