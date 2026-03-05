import { Outlet } from 'react-router-dom';
import FuelSurchargeHomePage from '../../sections/customer/FuelSurcharge/FuelSurchargeHomePage';
// ----------------------------------------------------------------------

export default function FuelChargeMaintenance() {
    return (
        <>
            <FuelSurchargeHomePage />
            <Outlet />
        </>
    );
}
