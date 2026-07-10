import { Connection } from 'odbc';
import { SCHEMA } from '../../config/db2';
import { Airline } from '../../entities/shipment';

export async function getAirlineDropdown(
  conn: Connection,
  scenarioType?: 'IMPORT' | 'EXPORT',
  airportCode?: string,
  searchTerm?: string
): Promise<Airline[]> {

  let query = `
    SELECT *
    FROM ${SCHEMA}."Airline"
    WHERE 1=1
  `;

  const params: any[] = [];

  // ✅ Add scenarioType condition only if provided
  if (scenarioType) {
    query += ` AND "scenarioType" = ?`;
    params.push(scenarioType);
  }

  // ✅ Add airportCode condition only if provided
  if (airportCode && airportCode.trim() !== '') {
    query += ` AND "airportCode" = ?`;
    params.push(airportCode);
  }

  // ✅ Add searchTerm condition only if provided
  if (searchTerm && searchTerm.trim() !== '') {
    query += `
      AND (
        LOWER("airlineName") LIKE ?
        OR LOWER("airlineCode") LIKE ?
        OR LOWER("airlineNumber") LIKE ?
      )
    `;

    const likeTerm = `%${searchTerm.toLowerCase()}%`;
    params.push(likeTerm, likeTerm, likeTerm);
  }

  query += ` ORDER BY "airlineName"`;

  const result = await conn.query(query, params) as any[];
  return result as Airline[];
}