import { Router } from 'express';
import { join } from 'path';
import fs from 'fs';

const router = Router();

// List of mount points and the corresponding route file name (without extension)
// The file is searched under src/routes/<file>.ts or src/routes/<file>/index.ts (or .js equivalents)
const routeDefinitions: Array<{ path: string; file: string }> = [
    { path: '/auth', file: 'auth' },
    { path: '/id-form', file: 'id-form' },
    { path: '/warehouse-form', file: 'warehouse-form' },
    { path: '/cargo-spectre', file: 'cargo-spectre-route' },
    { path: '/shipment-form', file: 'shipment-form-route' },
    { path: '/en-route', file: 'en-route-route' },
    { path: '/maintenance', file: 'maintenance' },
];

function tryRequireRoute(fileName: string): any | null {
    const baseDir = join(__dirname);
    const candidates = [
        join(baseDir, `${fileName}.ts`),
        join(baseDir, `${fileName}.js`),
        join(baseDir, fileName, 'index.ts'),
        join(baseDir, fileName, 'index.js'),
    ];

    for (const p of candidates) {
        if (fs.existsSync(p)) {
            // require the module (works both in ts-node and compiled JS)
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require(p);
        }
    }

    return null;
}

for (const def of routeDefinitions) {
    try {
        const mod = tryRequireRoute(def.file);
        if (mod) {
            const mounted = mod.default || mod;
            router.use(def.path, mounted);
            console.log(`Mounted routes: ${def.path} -> ${def.file}`);
        } else {
            console.warn(`Route file not found for ${def.path}: tried ${def.file}`);
        }
    } catch (err) {
        console.error(`Error loading route ${def.file} for mount ${def.path}:`, err);
    }
}

export default router;
