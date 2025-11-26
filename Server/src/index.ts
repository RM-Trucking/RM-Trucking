import express, { Express, Request, Response, NextFunction } from 'express';
import { config } from 'dotenv';
import { Server } from 'http';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from './config/swagger';

// Load environment variables
config();

// ============================================================================
// CONFIGURATION
// ============================================================================

interface ServerConfig {
    port: number;
    env: string;
    isProduction: boolean;
    isDevelopment: boolean;
    database: {
        connectionString: string;
        environment: string;
    };
}

/**
 * Get database connection string based on environment
 */
function getDatabaseConnectionString(): { connectionString: string; environment: string } {
    const args = process.argv.slice(2);
    const environment = process.env.ENVIRONMENT || 'dev-local';

    // Check command-line arguments first (highest priority)
    if (args.includes('--mode=prod')) {
        return {
            connectionString: "Driver={IBM i Access ODBC Driver};System=192.168.180.2;UserID=manzar;Password=Ed/1fgiz;NAM=1;CCSID=1208;IgnoreWarnings=1;DefaultLibraries=,RANDM_TST",
            environment: 'prod (CLI)'
        };
    }

    if (args.includes('--mode=dev')) {
        return {
            connectionString: "DSN=SS2;Database=Ss2;UserName=odbcuser;Password=odbcuser;Host=172.16.102.12",
            environment: 'dev (CLI)'
        };
    }

    // Fall back to ENVIRONMENT variable
    switch (environment) {
        case 'prod':
            return {
                connectionString: "DSN=ss2;Database=Ss2;UserName=dbuser;Password=dbuser123;Host=localhost",
                environment: 'prod'
            };

        case 'live-rm':
            return {
                connectionString: "DSN=rmx;Database=RMTDEVEL;UserName=manzar;Password=Ed/1fgiz;Host=localhost",
                environment: 'live-rm'
            };

        case 'prod-rm':
            return {
                connectionString: "DSN=rmx;Database=RMTDEVEL;UserName=manzar;Password=Ed/1fgiz;Host=localhost",
                environment: 'prod-rm'
            };

        case 'dev-rm':
            return {
                connectionString: "DSN=rmx;Database=RMTDEVEL;UserName=manzar;Password=Ed/1fgiz;Host=localhost",
                environment: 'dev-rm'
            };

        case 'dev-local':
        default:
            return {
                connectionString: "DSN=ss2x;Database=Ss2;UserName=odbcuser;Password=odbcuser;Host=172.16.102.12",
                environment: 'dev-local'
            };
    }
}

/**
 * Get port based on environment
 */
function getPort(): number {
    const environment = process.env.ENVIRONMENT || 'dev-local';

    // Command-line override takes precedence
    if (process.env.PORT) {
        return parseInt(process.env.PORT, 10);
    }

    // Environment-based port defaults
    switch (environment) {
        case 'prod-rm':
            return 8080;
        case 'dev-rm':
            return 4500;
        default:
            return 3000;
    }
}

const dbConfig = getDatabaseConnectionString();
const port = getPort();

const serverConfig: ServerConfig = {
    port,
    env: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV !== 'production',
    database: {
        connectionString: dbConfig.connectionString,
        environment: dbConfig.environment
    }
};

// Validate configuration
if (isNaN(serverConfig.port) || serverConfig.port < 1 || serverConfig.port > 65535) {
    console.error('❌ Invalid PORT configuration. Must be between 1 and 65535');
    process.exit(1);
}

if (!serverConfig.database.connectionString) {
    console.error('❌ Database connection string not configured');
    process.exit(1);
}

// Initialize Express app
const app: Express = express();
const PORT: number = serverConfig.port;
const NODE_ENV: string = serverConfig.env;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware (for tracing)
app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] as string || generateRequestId();
    (req as any).id = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
});

// Enhanced request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = (req as any).id;

    // Log request
    const logData = {
        timestamp: new Date().toISOString(),
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
    };

    // Capture response
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
        const duration = Date.now() - startTime;
        console.log(JSON.stringify({
            ...logData,
            status: res.statusCode,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        }));
        return originalJson(body);
    };

    next();
});

// Async error handler utility for routes/controllers
const use = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// ============================================================================
// SWAGGER SETUP
// ============================================================================
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============================================================================
// ROUTES
// ============================================================================

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        database: serverConfig.database.environment,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    });
});

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
    res.status(200).json({
        service: 'R&M Trucking Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
    });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'Welcome to R&M Trucking API',
        documentation: '/api/docs',
        health: '/health'
    });
});


// ============================================================================
// SERVE REACT STATIC BUILD (../webapp)
// ============================================================================
// const DIST_FOLDER = join(process.cwd(), '../webapp');
// app.use(express.static(DIST_FOLDER, { maxAge: '1y' }));
// app.get('*', (req, res) => {
//     res.sendFile(join(DIST_FOLDER, 'index.html'));
// });

// ============================================================================
// ERROR HANDLERS
// ============================================================================

// 404 handler (must be before error handler)
app.use((req: Request, res: Response) => {
    const requestId = (req as any).id;
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        requestId,
        timestamp: new Date().toISOString(),
    });
});

// Global error handling middleware (must be last)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as any).id;

    console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        error: err.message,
        stack: serverConfig.isDevelopment ? err.stack : undefined,
        method: req.method,
        path: req.path,
        ip: req.ip
    }, null, 2));

    res.status(500).json({
        error: 'Internal Server Error',
        message: serverConfig.isDevelopment ? err.message : 'An unexpected error occurred',
        requestId,
        timestamp: new Date().toISOString(),
    });
});

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

let server: Server | null = null;

/**
 * Start server
 */
function startServer(): void {
    server = app.listen(PORT, () => {
        console.log(`Server started on http://localhost:${PORT} | Env: ${NODE_ENV} | DB: ${serverConfig.database.environment} | Started: ${new Date().toISOString()}`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is already in use`);
            process.exit(1);
        }
        console.error('❌ Server error:', err.message);
        process.exit(1);
    });
}

/**
 * Graceful shutdown handler
 */
function gracefulShutdown(signal: string): void {
    console.log(`\n📍 ${signal} received - starting graceful shutdown...`);

    if (!server) {
        process.exit(0);
    }

    // Set timeout for forceful shutdown (30 seconds)
    const shutdownTimeout = setTimeout(() => {
        console.error('❌ Graceful shutdown timeout - forcing exit');
        process.exit(1);
    }, 30000);

    server.close(async () => {
        clearTimeout(shutdownTimeout);
        console.log('✓ HTTP server closed');

        try {
            // Close DB2 pool
            // await closeDB2Pool(); // Uncomment when DB2 is initialized
        } catch (err) {
            console.error('Error closing database:', err);
        }

        console.log('✓ All resources cleaned up');
        process.exit(0);
    });

    // Close any open connections after timeout
    setTimeout(() => {
        console.error('❌ Forced shutdown - closing all connections');
        process.exit(1);
    }, 35000);
}

// ============================================================================
// PROCESS EVENT HANDLERS
// ============================================================================

// Graceful shutdown on SIGTERM (Docker, Kubernetes)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exceptions
process.on('uncaughtException', (err: Error) => {
    console.error('❌ Uncaught Exception:', err.message);
    console.error(err.stack);
    process.exit(1);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    process.exit(1);
});

// ============================================================================
// START SERVER
// ============================================================================

startServer();

export default app;
