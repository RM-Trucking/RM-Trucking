import { Outlet } from 'react-router-dom';
import FuelSurchargeHomePage from '../../sections/FuelSurcharge/FuelSurchargeHomePage';
// ----------------------------------------------------------------------

export default function FuelChargeMaintenance() {
    return (
        <>
            <FuelSurchargeHomePage />
            <Outlet />
        </>
    );
}
