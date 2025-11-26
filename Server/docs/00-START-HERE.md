# 📚 Documentation

Welcome to the R&M Trucking Backend documentation! This folder contains all guides, references, and examples.

## 🚀 Quick Start (2 minutes)

**New to this project?** Start here:

1. Read: [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) - Commands to get started
2. Run: `npm run dev`
3. Visit: `http://localhost:3000/health`
4. Done! ✅

## 📖 Main Documentation

### Configuration & Setup

- **[`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md)** ⚡ - Fastest way to get started (2 min read)
- **[`DATABASE_CONFIG.md`](./DATABASE_CONFIG.md)** 🗄️ - Complete configuration guide (10-15 min read)
- **[`ENVIRONMENT_SETUP.md`](./ENVIRONMENT_SETUP.md)** 🔧 - Implementation details (8-10 min read)

### Architecture & Design

- **[`INDEX_ENHANCEMENTS.md`](./INDEX_ENHANCEMENTS.md)** 🚀 - Server architecture and features
- **[`CONFIG_FLOW_DIAGRAM.md`](./CONFIG_FLOW_DIAGRAM.md)** 📊 - Visual flowcharts and diagrams
- **[`README_CONFIGURATION.md`](./README_CONFIGURATION.md)** 📚 - Complete documentation index

### Examples & Scenarios

- **[`EXAMPLES.md`](./EXAMPLES.md)** 💡 - 15 real-world usage scenarios
- **[`TRANSACTION_GUIDE.md`](./TRANSACTION_GUIDE.md)** 💳 - Database transactions guide
- **[`README_PARALLEL_FORMS.md`](./README_PARALLEL_FORMS.md)** ⚙️ - Parallel form processing

### Additional

- **[`VISUAL_GUIDE.md`](./VISUAL_GUIDE.md)** 🎨 - Visual explanations
- **[`README.md`](./README.md)** - Main project readme

---

## 🎯 Find What You Need

### "I want to..."

#### ...get started quickly

→ [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md)

#### ...understand all environments

→ [`DATABASE_CONFIG.md`](./DATABASE_CONFIG.md)

#### ...see visual diagrams

→ [`CONFIG_FLOW_DIAGRAM.md`](./CONFIG_FLOW_DIAGRAM.md)

#### ...see real examples

→ [`EXAMPLES.md`](./EXAMPLES.md)

#### ...learn about transactions

→ [`TRANSACTION_GUIDE.md`](./TRANSACTION_GUIDE.md)

#### ...understand parallel forms

→ [`README_PARALLEL_FORMS.md`](./README_PARALLEL_FORMS.md)

#### ...deploy to production

→ [`DATABASE_CONFIG.md`](./DATABASE_CONFIG.md#security-considerations) + [`EXAMPLES.md`](./EXAMPLES.md#scenario-11-dockercontainer-deployment)

---

## 📊 Learning Paths

### Path 1: Just Run It (5 min)

```
QUICK_REFERENCE.md → npm run dev → Done! ✓
```

### Path 2: Understand Configuration (20 min)

```
QUICK_REFERENCE.md
→ DATABASE_CONFIG.md (overview section)
→ CONFIG_FLOW_DIAGRAM.md (decision flow)
→ Ready to use! ✓
```

### Path 3: Full Deep Dive (1-2 hours)

```
QUICK_REFERENCE.md
→ DATABASE_CONFIG.md
→ ENVIRONMENT_SETUP.md
→ CONFIG_FLOW_DIAGRAM.md
→ EXAMPLES.md (all scenarios)
→ INDEX_ENHANCEMENTS.md
→ Expert level! ✓
```

---

## 🗂️ Folder Structure

```
docs/
├── README.md (this file)                 ← START HERE
├── QUICK_REFERENCE.md                   ← 2-min quick start
├── DATABASE_CONFIG.md                   ← Full reference
├── ENVIRONMENT_SETUP.md                 ← Implementation
├── CONFIG_FLOW_DIAGRAM.md               ← Visual diagrams
├── INDEX_ENHANCEMENTS.md                ← Server features
├── README_CONFIGURATION.md              ← Documentation index
├── EXAMPLES.md                          ← 15 scenarios
├── TRANSACTION_GUIDE.md                 ← DB transactions
├── README_PARALLEL_FORMS.md             ← Parallel processing
├── VISUAL_GUIDE.md                      ← Visual explanations
└── README.md (old)                      ← Project readme
```

---

## 🔑 Key Concepts

### Configuration Priority

1. **CLI Arguments** (highest) - `npm run dev -- --mode=prod`
2. **Environment Variables** - `$env:ENVIRONMENT = "prod-rm"`
3. **Default** (lowest) - `dev-local`

### Environments

| Environment | Port | Database             | Use                 |
| ----------- | ---- | -------------------- | ------------------- |
| `dev-local` | 3000 | ss2x @ 172.16.102.12 | Default development |
| `dev-rm`    | 4500 | rmx (RMTDEVEL)       | R&M development     |
| `prod-rm`   | 8080 | rmx (RMTDEVEL)       | R&M production      |
| `live-rm`   | 3000 | rmx (RMTDEVEL)       | R&M live            |
| `prod`      | 3000 | ss2                  | SS2 production      |

### Quick Commands

```powershell
# Default (dev-local)
npm run dev

# Production R&M (port 8080)
$env:ENVIRONMENT = "prod-rm"
npm run dev

# Dev R&M (port 4500)
$env:ENVIRONMENT = "dev-rm"
npm run dev

# Override with CLI (highest priority)
npm run dev -- --mode=prod
```

---

## ✅ Verification

**Verify configuration works:**

```bash
# 1. Server starts without errors
npm run dev

# 2. Check startup banner shows correct database
# Look for: 🗄️ Database: dev-local (or your environment)

# 3. Test health endpoint
curl http://localhost:3000/health

# 4. Response shows database environment
# { "database": "dev-local", ... }
```

---

## 🆘 Help & Troubleshooting

### Common Issues

**"Port already in use"**
→ Use different environment with different port: `$env:ENVIRONMENT = "prod-rm"` (port 8080)

**"Wrong database connecting"**
→ Check server startup banner to see active database  
→ See [`DATABASE_CONFIG.md`](./DATABASE_CONFIG.md#troubleshooting) - Troubleshooting section

**"How do I know which environment is running?"**
→ Look at server startup banner or call `/health` endpoint

**"Configuration not changing"**
→ CLI arguments have highest priority: `npm run dev -- --mode=prod`

---

## 📝 File Quick Reference

| File                     | Purpose                | Read Time | Best For             |
| ------------------------ | ---------------------- | --------- | -------------------- |
| QUICK_REFERENCE.md       | Commands cheat sheet   | 2-3 min   | Quick lookup         |
| DATABASE_CONFIG.md       | Complete guide         | 10-15 min | Full understanding   |
| ENVIRONMENT_SETUP.md     | Implementation details | 8-10 min  | Understanding system |
| CONFIG_FLOW_DIAGRAM.md   | Visual diagrams        | 5-8 min   | Visual learners      |
| EXAMPLES.md              | Real scenarios         | 15-20 min | Learning by example  |
| INDEX_ENHANCEMENTS.md    | Server architecture    | 12-15 min | Server features      |
| README_CONFIGURATION.md  | Documentation index    | 5-10 min  | Finding information  |
| TRANSACTION_GUIDE.md     | DB transactions        | Varies    | Database operations  |
| README_PARALLEL_FORMS.md | Parallel processing    | Varies    | Advanced features    |

---

## 🚀 Next Steps

1. **Read** [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) (2 minutes)
2. **Run** `npm run dev` (1 second)
3. **Test** `curl http://localhost:3000/health` (1 second)
4. **Explore** [`EXAMPLES.md`](./EXAMPLES.md) (when ready)
5. **Deploy** using [`DATABASE_CONFIG.md`](./DATABASE_CONFIG.md) guide

---

**Status**: ✅ Complete | **Version**: 1.0.0 | **Last Updated**: 2025-11-17
