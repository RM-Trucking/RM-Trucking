import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
const yaml: any = require('js-yaml');

const swaggerDirectory = join(dirname(__filename), '..', 'swagger');

if (!existsSync(swaggerDirectory)) {
    throw new Error(`Swagger documentation directory not found: ${swaggerDirectory}`);
}

const swaggerFiles = readdirSync(swaggerDirectory).filter(
    (file) => file.endsWith('.yaml') || file.endsWith('.yml')
);

function mergeComponents(target: Record<string, any>, source: Record<string, any>) {
    Object.entries(source).forEach(([key, value]) => {
        if (!target[key]) {
            target[key] = value;
            return;
        }

        target[key] = {
            ...target[key],
            ...(value as Record<string, any>),
        };
    });
}

function mergePaths(target: Record<string, any>, source: Record<string, any>) {
    Object.entries(source).forEach(([pathKey, pathValue]) => {
        if (!target[pathKey]) {
            target[pathKey] = pathValue;
            return;
        }

        target[pathKey] = {
            ...target[pathKey],
            ...(pathValue as Record<string, any>),
        };
    });
}

export const swaggerSpec: Record<string, any> = swaggerFiles.reduce(
    (acc: Record<string, any>, file: string) => {
        const filePath = join(swaggerDirectory, file);
        const document = yaml.load(readFileSync(filePath, 'utf8')) as Record<string, any> | null;

        if (!document) {
            return acc;
        }

        if (Array.isArray(document.tags)) {
            acc.tags = [...acc.tags, ...document.tags];
        }

        if (document.paths && typeof document.paths === 'object') {
            mergePaths(acc.paths, document.paths);
        }

        if (document.components && typeof document.components === 'object') {
            mergeComponents(acc.components, document.components);
        }

        return acc;
    },
    {
        openapi: '3.0.0',
        info: {
            title: 'R&M Trucking - Network Service Application - Backend API',
            version: '1.0.0',
            description: 'API documentation for R&M Trucking Backend',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
        paths: {},
        tags: [],
    }
);
