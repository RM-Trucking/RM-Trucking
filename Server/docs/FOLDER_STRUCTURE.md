# Application Structure

```
src/
├── index.ts                 ← Main Express app
├── utils/
│   ├── db2.ts             ← DB2 connection & utilities
│   └── db2.example.ts     ← DB2 example
│
├── routes/                 ← All route files (module-based)
│   ├── users.ts
│   ├── products.ts
│   ├── orders.ts
│   └── ...
│
├── controllers/            ← All controller files (request handlers)
│   ├── userController.ts
│   ├── productController.ts
│   ├── orderController.ts
│   └── ...
│
├── services/               ← All business logic files
│   ├── userService.ts
│   ├── productService.ts
│   ├── orderService.ts
│   └── ...
│
├── database/               ← All database query files
│   ├── userQueries.ts
│   ├── productQueries.ts
│   ├── orderQueries.ts
│   └── ...
│
├── mappers/                ← All mapper/transformer files
│   ├── userMapper.ts
│   ├── productMapper.ts
│   ├── orderMapper.ts
│   └── ...
│
├── middleware/             ← Express middleware
│   ├── validation.ts
│   ├── errorHandler.ts
│   ├── auth.ts
│   └── ...
│
├── types/                  ← TypeScript types & interfaces
│   ├── index.ts            ← Global types
│   ├── user.ts
│   ├── product.ts
│   ├── order.ts
│   └── ...
│
└── config/                 ← Configuration files
    ├── database.ts
    ├── constants.ts
    └── ...
```

## How to Use

### For Each Module (e.g., Users)

1. **types/user.ts** - Define DTOs and interfaces
2. **database/userQueries.ts** - Write SQL queries
3. **mappers/userMapper.ts** - Map DB2 fields to DTOs
4. **services/userService.ts** - Business logic
5. **controllers/userController.ts** - HTTP handlers
6. **routes/users.ts** - Define routes

### Register in Main App (index.ts)

```typescript
import { userRoutes } from "./routes/users";

app.use("/api/users", userRoutes);
```

Done! Add as many modules as you need.
