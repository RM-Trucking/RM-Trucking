# Database Configuration Guide

## Overview

The server now supports multiple database environments with flexible configuration options. The connection string is determined by **environment variables** and **command-line arguments**, with the following priority order:

1. **Command-line arguments** (highest priority) - `--mode=prod` or `--mode=dev`
2. **ENVIRONMENT variable** (medium priority) - `ENVIRONMENT=prod-rm`, `ENVIRONMENT=dev-rm`, etc.
3. **Default** (lowest priority) - `dev-local`

## Configuration Methods

### 1. Command-Line Arguments (Highest Priority)

Use `--mode` flag when starting the server:

```bash
# Production mode (IBM i DSN connection)
npm run dev -- --mode=prod

# Development mode (SS2 DSN connection)
npm run dev -- --mode=dev
```

### 2. Environment Variables (Medium Priority)

Set `ENVIRONMENT` variable before starting:

**Windows PowerShell:**

```powershell
$env:ENVIRONMENT = "prod-rm"
npm run dev

$env:ENVIRONMENT = "dev-rm"
npm run dev

$env:ENVIRONMENT = "live-rm"
npm run dev

$env:ENVIRONMENT = "prod"
npm run dev

$env:ENVIRONMENT = "dev-local"
npm run dev
```

**Linux/Mac/Git Bash:**

```bash
export ENVIRONMENT=prod-rm
npm run dev

export ENVIRONMENT=dev-rm
npm run dev
```

**Windows CMD:**

```cmd
set ENVIRONMENT=prod-rm
npm run dev
```

### 3. Environment File (.env)

Add to `.env`:

```env
ENVIRONMENT=dev-local
PORT=3000
NODE_ENV=development
```

## Available Environments

### 1. **prod-rm** (Production R&M)

- **Port**: 8080
- **Database**: DSN=rmx
- **Database**: RMTDEVEL
- **User**: manzar
- **Host**: localhost
- **Use Case**: Production environment for R&M system

```powershell
$env:ENVIRONMENT = "prod-rm"
npm run dev
# Server: http://localhost:8080
# Database: prod-rm
```

### 2. **dev-rm** (Development R&M)

- **Port**: 4500
- **Database**: DSN=rmx
- **Database**: RMTDEVEL
- **User**: manzar
- **Host**: localhost
- **Use Case**: Development environment for R&M system

```powershell
$env:ENVIRONMENT = "dev-rm"
npm run dev
# Server: http://localhost:4500
# Database: dev-rm
```

### 3. **live-rm** (Live R&M)

- **Port**: 3000
- **Database**: DSN=rmx
- **Database**: RMTDEVEL
- **User**: manzar
- **Host**: localhost
- **Use Case**: Live environment for R&M system

```powershell
$env:ENVIRONMENT = "live-rm"
npm run dev
# Server: http://localhost:3000
# Database: live-rm
```

### 4. **prod** (Production SS2)

- **Port**: 3000
- **Database**: DSN=ss2
- **Database**: Ss2
- **User**: dbuser
- **Host**: localhost
- **Use Case**: Production environment for SS2 system

```powershell
$env:ENVIRONMENT = "prod"
npm run dev
# Server: http://localhost:3000
# Database: prod
```

### 5. **dev-local** (Development Local) - **DEFAULT**

- **Port**: 3000
- **Database**: DSN=ss2x
- **Database**: Ss2
- **User**: odbcuser
- **Host**: 172.16.102.12
- **Use Case**: Local development with remote connection
- **Used When**: No ENVIRONMENT variable or `--mode` specified

```powershell
npm run dev
# Server: http://localhost:3000
# Database: dev-local
```

### 6. **prod** (CLI Mode) - Command-line override

- **Driver**: IBM i Access ODBC Driver
- **System**: 192.168.180.2
- **User**: manzar
- **Use Case**: Direct IBM i connection

```bash
npm run dev -- --mode=prod
# Server: http://localhost:3000
# Database: prod (CLI)
```

### 7. **dev** (CLI Mode) - Command-line override

- **Database**: DSN=SS2
- **Database**: Ss2
- **User**: odbcuser
- **Host**: 172.16.102.12
- **Use Case**: CLI-specified development connection

```bash
npm run dev -- --mode=dev
# Server: http://localhost:3000
# Database: dev (CLI)
```

## Priority Examples

### Example 1: Which config takes precedence?

```powershell
# Scenario: Environment variable + CLI argument
$env:ENVIRONMENT = "dev-local"
npm run dev -- --mode=prod

# Result: --mode=prod WINS (CLI args highest priority)
# Database: prod (CLI)
# Connection String: IBM i Access ODBC Driver connection
```

### Example 2: Default behavior

```powershell
# No environment variable, no CLI args
npm run dev

# Result: Uses default dev-local
# Database: dev-local
# Connection String: DSN=ss2x with 172.16.102.12
```

### Example 3: Environment-based port

```powershell
# Production environment
$env:ENVIRONMENT = "prod-rm"
npm run dev

# Result:
# Server: http://localhost:8080 (prod-rm uses port 8080)
# Database: prod-rm
```

## Server Startup Banner

When the server starts, it displays which database environment is being used:

```
╔════════════════════════════════════════════════════════════════╗
║                R&M TRUCKING BACKEND SERVER                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║ 🚀 Server:       http://localhost:8080                        ║
║ 🌍 Environment:  development                                  ║
║ 🗄️  Database:     prod-rm                                     ║
║ ✓ Status:        Running                                      ║
║ ⏰ Started:       2025-11-17T10:53:50.838Z                   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

## Health Check Endpoint

The `/health` endpoint now includes database environment information:

```bash
curl http://localhost:3000/health
```

Response:

```json
{
  "status": "OK",
  "timestamp": "2025-11-17T10:53:50.838Z",
  "environment": "development",
  "database": "dev-local",
  "uptime": 42.5,
  "memory": {
    "rss": 52428800,
    "heapTotal": 33554432,
    "heapUsed": 20971520,
    "external": 1048576
  }
}
```

## Accessing Connection String in Code

The connection string is available throughout the application via the server config:

```typescript
// In src/index.ts
console.log(serverConfig.database.connectionString);
console.log(serverConfig.database.environment);

// In DB2 utility
import { DB2Config } from "./db2";
const config: DB2Config = {
  connectionString: serverConfig.database.connectionString,
  poolSize: 5,
  timeout: 30000,
};
```

## Integration with DB2 Utility

Update your `db2.ts` initialization to use the server configuration:

```typescript
// In src/index.ts startServer() function
import { initializeDB2Pool } from "./utils/db2";

async function startServer(): Promise<void> {
  try {
    // Initialize database pool with configured connection string
    await initializeDB2Pool({
      connectionString: serverConfig.database.connectionString,
      poolSize: 5,
      timeout: 30000,
    });

    server = app.listen(PORT, () => {
      console.log(
        `Server started on port ${PORT} with database: ${serverConfig.database.environment}`
      );
    });
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }
}
```

## Migration from Old Config

If you were using the old hardcoded approach:

**Before:**

```typescript
if (args[args.indexOf("--mode=prod")]) {
  DB_UTIL.connectionString = "Driver={IBM i Access...";
}
```

**After:**

```typescript
// No changes needed! Just start the server:
npm run dev -- --mode=prod
// Connection string is automatically set
```

## Troubleshooting

### Port Already in Use

If you get `EADDRINUSE` error:

```powershell
# Try different environment with different port
$env:ENVIRONMENT = "prod-rm"  # Uses port 8080
npm run dev
```

### Wrong Database Connection

Check the server startup banner to see which database is configured:

```powershell
# If wrong database is shown:
$env:ENVIRONMENT = ""  # Clear the environment variable
npm run dev -- --mode=prod  # Explicitly specify with CLI arg
```

### Connection String Not Found

```
❌ Database connection string not configured
```

Make sure `ENVIRONMENT` variable is set or `--mode` argument is passed:

```powershell
$env:ENVIRONMENT = "dev-local"
npm run dev
```

## Environment Setup Scripts

### Quick Setup Scripts (PowerShell)

Create `setup-dev.ps1`:

```powershell
$env:ENVIRONMENT = "dev-local"
$env:NODE_ENV = "development"
npm run dev
```

Create `setup-prod.ps1`:

```powershell
$env:ENVIRONMENT = "prod-rm"
$env:NODE_ENV = "production"
npm run build
npm run start
```

Run with:

```powershell
./setup-dev.ps1
./setup-prod.ps1
```

## Configuration Schema

```typescript
interface ServerConfig {
  port: number; // Server port
  env: string; // NODE_ENV value
  isProduction: boolean; // NODE_ENV === 'production'
  isDevelopment: boolean; // NODE_ENV !== 'production'
  database: {
    connectionString: string; // ODBC connection string
    environment: string; // Environment name (e.g., 'prod-rm', 'dev-local')
  };
}
```

---

**Last Updated**: 2025-11-17 | **Status**: ✅ Production Ready
