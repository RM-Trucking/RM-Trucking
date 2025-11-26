# Quick Reference - Database Configuration

## 🚀 Start Server with Different Environments

### Default (dev-local) - 172.16.102.12

```powershell
npm run dev
# Port: 3000, Database: dev-local
```

### Production R&M - Port 8080

```powershell
$env:ENVIRONMENT = "prod-rm"
npm run dev
# Port: 8080, Database: prod-rm
```

### Development R&M - Port 4500

```powershell
$env:ENVIRONMENT = "dev-rm"
npm run dev
# Port: 4500, Database: dev-rm
```

### Live R&M - Port 3000

```powershell
$env:ENVIRONMENT = "live-rm"
npm run dev
# Port: 3000, Database: live-rm
```

### Production SS2 - Port 3000

```powershell
$env:ENVIRONMENT = "prod"
npm run dev
# Port: 3000, Database: prod
```

### CLI Override - IBM i Direct Connection

```powershell
npm run dev -- --mode=prod
# Port: 3000, Database: prod (CLI)
```

### CLI Override - SS2 Dev Connection

```powershell
npm run dev -- --mode=dev
# Port: 3000, Database: dev (CLI)
```

## 📋 Environment Variables

| ENVIRONMENT           | Port | Database DSN | Host          | User     |
| --------------------- | ---- | ------------ | ------------- | -------- |
| `prod-rm`             | 8080 | rmx          | localhost     | manzar   |
| `dev-rm`              | 4500 | rmx          | localhost     | manzar   |
| `live-rm`             | 3000 | rmx          | localhost     | manzar   |
| `prod`                | 3000 | ss2          | localhost     | dbuser   |
| `dev-local` (default) | 3000 | ss2x         | 172.16.102.12 | odbcuser |

## 🔧 Priority Order

1. **CLI Args** (highest): `npm run dev -- --mode=prod`
2. **Environment Variable**: `$env:ENVIRONMENT = "prod-rm"`
3. **Default** (lowest): `dev-local`

## 📡 Check Current Configuration

```bash
# Visit health endpoint
curl http://localhost:3000/health

# Response includes:
# - environment: development/production
# - database: dev-local/prod-rm/etc
# - uptime: server uptime
# - memory: heap usage
```

## 📌 Server Banner Shows Active Config

```
║ 🚀 Server:       http://localhost:8080                    ║
║ 🌍 Environment:  development                              ║
║ 🗄️  Database:     prod-rm                                 ║
```

## 💡 Tips

- **CLI args override environment variables** - use `--mode=prod` to override `$env:ENVIRONMENT`
- **Each environment has its own port** - helps prevent conflicts
- **Check banner on startup** - confirms which database is connected
- **Connection string validation** - server exits if no connection string configured

## 🔐 Credentials in Configuration

- **prod-rm / dev-rm / live-rm**: User=manzar (database password included in connection string)
- **prod**: User=dbuser (database password included in connection string)
- **dev-local**: User=odbcuser (database password included in connection string)

---

For detailed documentation, see `DATABASE_CONFIG.md`
