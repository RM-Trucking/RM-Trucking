import { Connection } from 'odbc';
import {
    CreateGeneralFuelSurchargeRequest,
    UpdateGeneralFuelSurchargeRequest,
    GeneralFuelSurchargeResponse
} from '../../entities/maintenance/GeneralFuelSurcharge';
import * as generalFuelDb from '../../database/maintenance/generalFuelSurcharge';
import { toUtcDate } from '../../utils/dateFormater';

// ✅ Create General Fuel Surcharge
export async function createGeneralFuelSurcharge(
    conn: Connection,
    body: CreateGeneralFuelSurchargeRequest,
    createdBy: number
): Promise<GeneralFuelSurchargeResponse> {
    const surcharge = await generalFuelDb.insertGeneralFuelSurcharge(conn, body, createdBy);

    return {
        ...surcharge,
        createdAt: surcharge.createdAt ? toUtcDate(surcharge.createdAt) : null,
        updatedAt: surcharge.updatedAt ? toUtcDate(surcharge.updatedAt) : null
    };
}


// ✅ Get All General Fuel Surcharges (with pagination)
export async function getGeneralFuelSurcharges(
    conn: Connection,
    page: number,
    pageSize: number
): Promise<{ surcharges: GeneralFuelSurchargeResponse[]; total: number; page: number; pageSize: number }> {
    const { surcharges, total } = await generalFuelDb.selectAllGeneralFuelSurcharges(conn, page, pageSize);

    // Format timestamps
    const formattedSurcharges = surcharges.map(s => ({
        ...s,
        createdAt: s.createdAt ? toUtcDate(s.createdAt) : null,
        updatedAt: s.updatedAt ? toUtcDate(s.updatedAt) : null
    }));

    return { surcharges: formattedSurcharges, total, page, pageSize };
}


// ✅ Get General Fuel Surcharge by ID
export async function getGeneralFuelSurchargeById(
    conn: Connection,
    id: number
): Promise<GeneralFuelSurchargeResponse | null> {
    const surcharge = await generalFuelDb.selectGeneralFuelSurchargeById(conn, id);

    if (!surcharge) {
        return null;
    }

    return {
        ...surcharge,
        createdAt: surcharge.createdAt ? toUtcDate(surcharge.createdAt) : null,
        updatedAt: surcharge.updatedAt ? toUtcDate(surcharge.updatedAt) : null
    };
}


// ✅ Update General Fuel Surcharge
export async function updateGeneralFuelSurcharge(
    conn: Connection,
    id: number,
    body: UpdateGeneralFuelSurchargeRequest,
    updatedBy: number
): Promise<void> {
    await generalFuelDb.updateGeneralFuelSurcharge(conn, id, body, updatedBy);
}

// ✅ Delete General Fuel Surcharge
export async function deleteGeneralFuelSurcharge(conn: Connection, id: number): Promise<void> {
    await generalFuelDb.deleteGeneralFuelSurcharge(conn, id);
}
