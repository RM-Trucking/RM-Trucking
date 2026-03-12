import { Connection } from 'odbc';
import {
    CreateCustomerFuelSurchargeRequest,
    UpdateCustomerFuelSurchargeRequest,
    CustomerFuelSurchargeResponse
} from '../../entities/maintenance/CustomerFuelSurcharge';
import * as customerFuelDb from '../../database/maintenance/customerFuelSurcharge';

// ✅ Create Customer Fuel Surcharge with expire logic
export async function createCustomerFuelSurcharge(
  conn: Connection,
  body: CreateCustomerFuelSurchargeRequest,
  createdBy: number
): Promise<CustomerFuelSurchargeResponse> {
  // 1. Check if customer already has an active surcharge
  const existing = await customerFuelDb.selectLatestCustomerFuelSurcharge(conn, body.customerId);

  if (existing) {
    // 2. Expire the old surcharge with new effective date/time
    await customerFuelDb.expireCustomerFuelSurcharge(
      conn,
      existing.customerFuelSurchargeId,
      body.effectiveDate,
      body.effectiveTime
    );
  }

  // 3. Insert new surcharge (expireDate/expireTime will be NULL initially)
  return await customerFuelDb.insertCustomerFuelSurcharge(conn, body, createdBy);
}


// ✅ Get All Customer Fuel Surcharges (with pagination)
export async function getCustomerFuelSurcharges(
    conn: Connection,
    page: number,
    pageSize: number
): Promise<{ surcharges: CustomerFuelSurchargeResponse[]; total: number; page: number; pageSize: number }> {
    const { surcharges, total } = await customerFuelDb.selectAllCustomerFuelSurcharges(conn, page, pageSize);
    return { surcharges, total, page, pageSize };
}

// ✅ Get Customer Fuel Surcharge by ID (with stations)
export async function getCustomerFuelSurchargeById(
    conn: Connection,
    id: number
): Promise<CustomerFuelSurchargeResponse | null> {
    return await customerFuelDb.selectCustomerFuelSurchargeById(conn, id);
}

// ✅ Update Customer Fuel Surcharge (and stations)
export async function updateCustomerFuelSurcharge(
    conn: Connection,
    id: number,
    body: UpdateCustomerFuelSurchargeRequest,
    updatedBy: number
): Promise<void> {
    await customerFuelDb.updateCustomerFuelSurcharge(conn, id, body, updatedBy);
}

// ✅ Delete Customer Fuel Surcharge (cascade stations)
export async function deleteCustomerFuelSurcharge(conn: Connection, id: number): Promise<void> {
    await customerFuelDb.deleteCustomerFuelSurcharge(conn, id);
}
