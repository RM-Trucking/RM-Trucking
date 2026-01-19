import { Connection } from 'odbc';
import { SCHEMA } from '../../config/db2';
import { EntityAccessorialMap } from '../../entities/maintenance/EntityAccessorialMap';

/**
 * Create a new entity-accessorial mapping
 */
export async function createEntityAccessorialMap(
  conn: Connection,
  entityId: number,
  accessorialId: number,
  chargeType: string,
  chargeValue: number,
  noteThreadId: number
): Promise<number> {
  const query = `
    SELECT "entityAccessorialId"
    FROM FINAL TABLE (
      INSERT INTO ${SCHEMA}."Entity_Accessorial_Map"
      ("entityId","accessorialId","chargeType","chargeValue","noteThreadId")
      VALUES (?, ?, ?, ?, ?)
    )
  `;

  const result = (await conn.query(query, [entityId, accessorialId, chargeType, chargeValue, noteThreadId])) as any[];
  return result[0]?.entityAccessorialId;
}

/**
 * Get all accessorial mappings for a given entity
 */
export async function getAccessorialsForEntity(
  conn: Connection,
  entityId: number
): Promise<EntityAccessorialMap[]> {
  const query = `
    SELECT eam."entityAccessorialId",
           eam."entityId",
           eam."accessorialId",
           eam."chargeType",
           eam."chargeValue",
           eam."noteThreadId",
           a."accessorialName"
    FROM ${SCHEMA}."Entity_Accessorial_Map" eam
    JOIN ${SCHEMA}."Accessorial" a 
      ON eam."accessorialId" = a."accessorialId"
    WHERE eam."entityId" = ?
    ORDER BY a."accessorialName" ASC
  `;

  const result = (await conn.query(query, [entityId])) as any[];
  return result as EntityAccessorialMap[];
}

/**
 * Update an entity-accessorial mapping
 */
export async function updateEntityAccessorialMap(
  conn: Connection,
  entityAccessorialId: number,
  chargeType: string,
  chargeValue: number
): Promise<void> {
  const query = `
    UPDATE ${SCHEMA}."Entity_Accessorial_Map"
    SET "chargeType" = ?, "chargeValue" = ?
    WHERE "entityAccessorialId" = ?
  `;
  await conn.query(query, [chargeType, chargeValue, entityAccessorialId]);
}

/**
 * Get single mapping by ID (to fetch noteThreadId)
 */
export async function getAccessorialById(
  conn: Connection,
  entityAccessorialId: number
): Promise<EntityAccessorialMap | null> {
  const query = `
    SELECT eam."entityAccessorialId",
           eam."entityId",
           eam."accessorialId",
           eam."chargeType",
           eam."chargeValue",
           eam."noteThreadId",
           a."accessorialName"
    FROM ${SCHEMA}."Entity_Accessorial_Map" eam
    JOIN ${SCHEMA}."Accessorial" a 
      ON eam."accessorialId" = a."accessorialId"
    WHERE eam."entityAccessorialId" = ?
  `;
  const result = (await conn.query(query, [entityAccessorialId])) as any[];
  return result.length ? (result[0] as EntityAccessorialMap) : null;
}


/**
 * Delete an entity-accessorial mapping
 */
export async function deleteEntityAccessorialMap(
  conn: Connection,
  entityAccessorialId: number
): Promise<void> {
  const query = `
    DELETE FROM ${SCHEMA}."Entity_Accessorial_Map"
    WHERE "entityAccessorialId" = ?
  `;
  await conn.query(query, [entityAccessorialId]);
}
