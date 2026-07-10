import { Connection } from 'odbc';
import * as airlineDB from '../../database/maintenance/airline';
import { Airline } from '../../entities/shipment';

export async function getAirlineDropdown(conn: Connection, scenarioType?: 'IMPORT' | 'EXPORT', airportCode?: string, searchTerm?: string): Promise<Airline[]> {
    return await airlineDB.getAirlineDropdown(conn, scenarioType, airportCode, searchTerm);
}