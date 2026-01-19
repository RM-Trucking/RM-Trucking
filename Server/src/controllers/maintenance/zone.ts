import { Request, Response } from 'express';
import { Connection } from 'odbc';
import {
    createZoneService,
    getAllZonesService,
    getZoneByIdService,
    addZoneZipService,
    getZoneZipsByZoneService,
    getAllZoneZipsService
} from '../../services/maintenance/zone';

export async function createZoneHandler(req: Request, res: Response, conn: Connection) {
    const { zoneName } = req.body;
    try {
        const id = await createZoneService(conn, zoneName);
        res.status(201).json({ zoneId: id });
    } catch (error) {
        console.error('Error creating zone:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function getAllZonesHandler(req: Request, res: Response, conn: Connection) {
    try {
        const zones = await getAllZonesService(conn);
        res.status(200).json(zones);
    } catch (error) {
        console.error('Error fetching zones:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function getZoneByIdHandler(req: Request, res: Response, conn: Connection) {
    const zoneId = Number(req.params.zoneId);
    try {
        const zone = await getZoneByIdService(conn, zoneId);
        if (!zone) return res.status(404).json({ message: 'Zone not found' });
        res.status(200).json(zone);
    } catch (error) {
        console.error('Error fetching zone by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function addZoneZipHandler(req: Request, res: Response, conn: Connection) {
    const { zoneId, zipCode, rangeStart, rangeEnd } = req.body;
    try {
        const id = await addZoneZipService(conn, zoneId, zipCode, rangeStart, rangeEnd);
        res.status(201).json({ zoneZipId: id });
    } catch (error) {
        console.error('Error adding zone zip:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function getZoneZipsByZoneHandler(req: Request, res: Response, conn: Connection) {
    const zoneId = Number(req.params.zoneId);
    try {
        const zips = await getZoneZipsByZoneService(conn, zoneId);
        res.status(200).json(zips);
    } catch (error) {
        console.error('Error fetching zone zips:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function getAllZoneZipsHandler(req: Request, res: Response, conn: Connection) {
    try {
        const zips = await getAllZoneZipsService(conn);
        res.status(200).json(zips);
    } catch (error) {
        console.error('Error fetching all zone zips:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
