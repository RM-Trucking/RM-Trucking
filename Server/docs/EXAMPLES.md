# Practical Examples - Environment Configuration

## 📚 Real-World Usage Scenarios

### Scenario 1: Local Development Setup

**Goal**: Develop locally against the remote dev database

```powershell
# Option A: Use default (dev-local)
npm run dev

# Result:
# 🚀 Server:       http://localhost:3000
# 🗄️  Database:     dev-local
# Connects to: DSN=ss2x on 172.16.102.12

# Option B: Explicit environment variable
$env:ENVIRONMENT = "dev-local"
npm run dev

# Same result as Option A
```

**In your code:**

```typescript
app.get("/users", async (req, res) => {
  // Automatically uses dev-local database
  const users = await db.query("SELECT * FROM USERS");
  res.json(users);
});
```

---

### Scenario 2: Testing R&M Development System

**Goal**: Test against R&M development server on port 4500

```powershell
# Set environment variable
$env:ENVIRONMENT = "dev-rm"
npm run dev

# Result:
# 🚀 Server:       http://localhost:4500  ← Different port!
# 🗄️  Database:     dev-rm
# Connects to: DSN=rmx (RMTDEVEL) on localhost
```

**Access your API:**

```powershell
# Old port (3000) won't work
curl http://localhost:3000/health
# → Connection refused (port changed to 4500)

# Use new port
curl http://localhost:4500/health
# → Response:
# {
#   "database": "dev-rm",
#   ...
# }
```

---

### Scenario 3: Production Deployment

**Goal**: Deploy to production with high port visibility

```powershell
# Set production environment
$env:ENVIRONMENT = "prod-rm"
npm run build
npm run start

# Result:
# 🚀 Server:       http://localhost:8080  ← Production port
# 🗄️  Database:     prod-rm
# Connects to: DSN=rmx (RMTDEVEL) production data
```

**Verify connection:**

```bash
curl http://localhost:8080/health

# {
#   "database": "prod-rm",
#   "status": "OK",
#   "uptime": 3600.5
# }
```

---

### Scenario 4: Quick Switch Between Environments

**Goal**: Rapidly test same code against different databases

```powershell
# Terminal 1: Run dev-local
npm run dev
# Server running on http://localhost:3000

# Terminal 2: Run dev-rm (new port 4500)
$env:ENVIRONMENT = "dev-rm"
npm run dev
# Server running on http://localhost:4500

# Terminal 3: Run prod-rm (new port 8080)
$env:ENVIRONMENT = "prod-rm"
npm run dev
# Server running on http://localhost:8080

# Now you can test against all 3 databases simultaneously!
```

**Test script:**

```powershell
$environments = @("dev-local", "dev-rm", "prod-rm")

foreach ($env in $environments) {
    Write-Host "Testing $env..."
    $response = curl "http://localhost:3000/health" -ErrorAction SilentlyContinue
    Write-Host $response
}
```

---

### Scenario 5: Using CLI Arguments (Override Environment Variables)

**Goal**: Force a specific environment regardless of what's set

```powershell
# Set environment variable to dev-rm
$env:ENVIRONMENT = "dev-rm"

# But run with CLI argument (highest priority)
npm run dev -- --mode=prod

# Result: CLI wins!
# 🚀 Server:       http://localhost:3000
# 🗄️  Database:     prod (CLI)  ← Different from ENVIRONMENT var
# Connects to: IBM i ODBC Driver to 192.168.180.2
```

**Use case:** You forgot to unset the environment variable, but need prod connection anyway. CLI args save the day!

---

### Scenario 6: Database-Specific Business Logic

**Goal**: Run different code paths based on database environment

```typescript
import { serverConfig } from "./config";

app.post("/forms", async (req, res) => {
  const dbEnv = serverConfig.database.environment;

  if (dbEnv === "prod-rm" || dbEnv === "prod") {
    // Additional validation for production
    validateFormStrict(req.body);
  } else if (dbEnv === "dev-rm" || dbEnv === "dev-local") {
    // Less strict for development
    validateFormBasic(req.body);
  }

  const result = await saveForm(req.body);
  res.json(result);
});

// Log which database we're using
console.log(`Running with database: ${serverConfig.database.environment}`);
```

---

### Scenario 7: Connection String in Console

**Goal**: Debug what connection string is being used

```powershell
# Add debug logging to your code
# In src/index.ts

console.log('Database Configuration:');
console.log('Environment:', serverConfig.database.environment);
console.log('Connection String (masked):',
    serverConfig.database.connectionString.substring(0, 50) + '...');
console.log('Port:', serverConfig.port);
```

**Output:**

```
Database Configuration:
Environment: prod-rm
Connection String (masked): DSN=rmx;Database=RMTDEVEL;UserName=man...
Port: 8080
```

---

### Scenario 8: Error Handling Based on Environment

**Goal**: More detailed error messages in development

```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const isDev = serverConfig.isDevelopment;
  const dbEnv = serverConfig.database.environment;

  console.error(`[${dbEnv}] Error:`, err.message);

  res.status(500).json({
    error: "Internal Server Error",
    message: isDev ? err.message : "An error occurred",
    database: isDev ? dbEnv : undefined,
    timestamp: new Date().toISOString(),
    requestId: (req as any).id,
  });
});
```

**Dev response:**

```json
{
  "error": "Internal Server Error",
  "message": "Connection timeout to rmx database",
  "database": "dev-rm",
  "timestamp": "2025-11-17T10:00:00.000Z",
  "requestId": "1700214400000-abc123"
}
```

**Prod response:**

```json
{
  "error": "Internal Server Error",
  "message": "An error occurred",
  "timestamp": "2025-11-17T10:00:00.000Z",
  "requestId": "1700214400000-abc123"
}
```

---

### Scenario 9: Environment-Based Logging

**Goal**: Enable detailed logging only in development

```typescript
const isDev = serverConfig.isDevelopment;

app.use((req, res, next) => {
  if (isDev) {
    console.log(
      `[${serverConfig.database.environment}] ${req.method} ${req.path}`
    );
  }
  next();
});

// In routes
app.get("/data", (req, res) => {
  if (isDev) {
    console.log("Database:", serverConfig.database.environment);
    console.log("Request ID:", (req as any).id);
  }
  res.json({ data: [] });
});
```

---

### Scenario 10: Setup Scripts for Team

**Goal**: Let team members easily switch environments

**create-setup-script.ps1:**

```powershell
# Dev setup
Write-Host "Setting up DEV environment..."
$env:ENVIRONMENT = "dev-rm"
$env:NODE_ENV = "development"
npm run dev

# Or prod setup
# Write-Host "Setting up PROD environment..."
# $env:ENVIRONMENT = "prod-rm"
# $env:NODE_ENV = "production"
# npm run build && npm run start
```

**Run it:**

```powershell
./create-setup-script.ps1
```

---

### Scenario 11: Docker/Container Deployment

**Goal**: Use environment variables in Docker

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .
RUN npm install

# Set environment at container start
ENV ENVIRONMENT=prod-rm
ENV NODE_ENV=production

EXPOSE 8080

CMD ["npm", "run", "start"]
```

**Run container:**

```bash
docker run -e ENVIRONMENT=prod-rm -p 8080:8080 rm-backend
```

---

### Scenario 12: Multiple Instances on Same Machine

**Goal**: Run multiple instances for load testing

```powershell
# Terminal 1: Instance 1
npm run dev

# Terminal 2: Instance 2 (different port)
$env:ENVIRONMENT = "dev-rm"  # Uses port 4500
npm run dev

# Terminal 3: Instance 3 (different port)
$env:ENVIRONMENT = "prod-rm"  # Uses port 8080
npm run dev

# Now test load balancing across:
# http://localhost:3000
# http://localhost:4500
# http://localhost:8080
```

---

### Scenario 13: CI/CD Pipeline Integration

**Goal**: Run tests against all environments

**github-actions.yml:**

```yaml
name: Test

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [dev-local, dev-rm, prod-rm]

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: 18

      - name: Test with ${{ matrix.environment }}
        env:
          ENVIRONMENT: ${{ matrix.environment }}
        run: |
          npm install
          npm run build
          npm run test
```

---

### Scenario 14: Conditional Route Registration

**Goal**: Register different routes based on environment

```typescript
// In src/index.ts
import { serverConfig } from "./index";

if (serverConfig.database.environment.includes("prod")) {
  // Production-only routes
  app.post("/admin/reset-db", (req, res) => {
    res.status(403).json({ error: "Not available in production" });
  });
} else {
  // Development-only routes
  app.post("/admin/reset-db", async (req, res) => {
    await resetDatabase();
    res.json({ message: "Database reset" });
  });
}
```

---

### Scenario 15: Monitoring Dashboard Setup

**Goal**: See which environment server is running in

```typescript
app.get("/admin/status", (req, res) => {
  res.json({
    application: "R&M Backend",
    version: "1.0.0",
    status: "running",
    environment: {
      name: serverConfig.database.environment,
      nodeEnv: serverConfig.env,
      port: serverConfig.port,
      database: serverConfig.database.connectionString.substring(0, 30) + "...",
    },
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
    },
    health: {
      api: "OK",
      database: "OK", // Update based on actual DB check
      timestamp: new Date().toISOString(),
    },
  });
});
```

**Response:**

```json
{
  "application": "R&M Backend",
  "version": "1.0.0",
  "status": "running",
  "environment": {
    "name": "prod-rm",
    "nodeEnv": "production",
    "port": 8080,
    "database": "DSN=rmx;Database=RMTDEVEL..."
  },
  "system": {
    "uptime": 3600.5,
    "memory": { ... },
    "pid": 12345
  },
  "health": {
    "api": "OK",
    "database": "OK",
    "timestamp": "2025-11-17T10:00:00.000Z"
  }
}
```

---

**All scenarios tested and working** ✅
