# DB2 Transaction Management Guide

## Overview

Transactions ensure **ACID** (Atomicity, Consistency, Isolation, Durability) properties for database operations. With this utility, you have multiple ways to handle commits and rollbacks.

## Transaction Methods

### 1. **Automatic Transaction with `withTransaction()` (⭐ RECOMMENDED)**

Best for production code. Handles commit/rollback automatically.

```typescript
const db2 = await initializeDB2Pool();

const result = await db2.withTransaction(async (tx) => {
  // All operations here
  await tx.execute("INSERT INTO TABLE1 VALUES (?, ?)", [val1, val2]);
  await tx.execute("UPDATE TABLE2 SET col = ? WHERE id = ?", [newVal, id]);

  return { success: true };
  // ✓ Auto commits on success
  // ✗ Auto rollbacks on error
});
```

**Advantages:**

- ✅ Automatic commit on success
- ✅ Automatic rollback on error
- ✅ Clean, readable code
- ✅ Exception-safe
- ✅ No manual error handling needed

---

### 2. **Manual Transaction with `getTransaction()`**

Use when you need more control over transaction lifecycle.

```typescript
let transaction = null;

try {
  transaction = await db2.getTransaction();

  // Execute operations
  await transaction.execute("INSERT INTO TABLE1 VALUES (?, ?)", [val1, val2]);
  await transaction.execute("UPDATE TABLE2 SET col = ? WHERE id = ?", [
    newVal,
    id,
  ]);

  // Manual commit
  await transaction.commit();
} catch (error) {
  // Manual rollback
  if (transaction && transaction.isTransactionActive()) {
    await transaction.rollback();
  }
  console.error("Transaction failed:", error);
}
```

**Use Cases:**

- ⚙️ Complex multi-step transactions
- ⚙️ Need to check conditions mid-transaction
- ⚙️ Conditional commits based on query results

---

### 3. **Direct Connection Transaction**

For one-off or development scenarios.

```typescript
const transaction = await createTransaction();

try {
  await transaction.execute("INSERT INTO TABLE VALUES (?, ?)", [val1, val2]);
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
}
```

---

## Real-World Examples

### ✅ Money Transfer (Critical Operation)

```typescript
async function transferMoney(fromAcct, toAcct, amount) {
  const db2 = await initializeDB2Pool();

  return db2.withTransaction(async (tx) => {
    // Debit from source
    await tx.execute("UPDATE ACCOUNTS SET balance = balance - ? WHERE id = ?", [
      amount,
      fromAcct,
    ]);

    // Credit to destination
    await tx.execute("UPDATE ACCOUNTS SET balance = balance + ? WHERE id = ?", [
      amount,
      toAcct,
    ]);

    // Log transaction
    await tx.execute(
      "INSERT INTO TX_LOG (from_id, to_id, amount) VALUES (?, ?, ?)",
      [fromAcct, toAcct, amount]
    );

    return { transferred: amount };
  });
  // If ANY step fails → ALL changes rollback
  // If ALL steps succeed → ALL changes commit
}
```

### ✅ User Registration with Related Data

```typescript
async function registerUser(userData) {
  const db2 = await initializeDB2Pool();

  return db2.withTransaction(async (tx) => {
    // Create user
    const [user] = await tx.execute(
      "INSERT INTO USERS (email, name) VALUES (?, ?) RETURNING id",
      [userData.email, userData.name]
    );

    // Create user profile
    await tx.execute("INSERT INTO USER_PROFILES (user_id, bio) VALUES (?, ?)", [
      user.id,
      userData.bio,
    ]);

    // Assign default role
    await tx.execute("INSERT INTO USER_ROLES (user_id, role) VALUES (?, ?)", [
      user.id,
      "USER",
    ]);

    return user;
  });
  // If profile creation fails → user is also rolled back
}
```

### ✅ Batch Import with Validation

```typescript
async function importRecords(records) {
  const db2 = await initializeDB2Pool();

  return db2.withTransaction(async (tx) => {
    let imported = 0;

    for (const record of records) {
      // Validate before insert
      const exists = await tx.execute(
        "SELECT * FROM RECORDS WHERE unique_id = ?",
        [record.unique_id]
      );

      if (exists.length === 0) {
        await tx.execute(
          "INSERT INTO RECORDS (unique_id, data) VALUES (?, ?)",
          [record.unique_id, record.data]
        );
        imported++;
      }
    }

    return { imported, total: records.length };
  });
  // If ANY insert fails → ALL inserts rollback (atomic operation)
}
```

---

## Transaction Properties

### Check Transaction Status

```typescript
const tx = await db2.getTransaction();

// Check if active
if (tx.isTransactionActive()) {
  console.log("Transaction is running");
}

// Get duration
const duration = tx.getDuration();
console.log(`Transaction duration: ${duration}ms`);
```

---

## Transaction Isolation Levels

DB2 supports multiple isolation levels. The utility sets `REPEATABLE READ` by default:

```
┌─────────────────────────────────────────────┐
│ Isolation Level    │ Dirty Read │ Non-Repea │
├─────────────────────────────────────────────┤
│ READ UNCOMMITTED   │ Possible   │ Possible  │
│ READ COMMITTED     │ No         │ Possible  │
│ REPEATABLE READ    │ No         │ No        │
│ SERIALIZABLE       │ No         │ No        │
└─────────────────────────────────────────────┘
```

To modify isolation level:

```typescript
const tx = await db2.getTransaction();
await tx.execute("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
```

---

## Best Practices

### ✅ DO:

1. **Use `withTransaction()` for production code**

   ```typescript
   await db2.withTransaction(async (tx) => { ... });
   ```

2. **Keep transactions short**

   ```typescript
   // ✓ Good - Quick operations
   await db2.withTransaction(async (tx) => {
     await tx.execute("INSERT ...", params);
   });
   ```

3. **Handle errors explicitly**
   ```typescript
   try {
       result = await db2.withTransaction(...);
   } catch (error) {
       logger.error('Transaction failed', error);
   }
   ```

### ❌ DON'T:

1. **Don't use long-running operations in transactions**

   ```typescript
   // ✗ Bad - Locks tables for too long
   await db2.withTransaction(async (tx) => {
     // ... complex 30-second computation ...
     await tx.execute("UPDATE ...", params);
   });
   ```

2. **Don't nest transactions**

   ```typescript
   // ✗ Bad - DB2 doesn't support nested transactions
   await db2.withTransaction(async (tx1) => {
     await db2.withTransaction(async (tx2) => {
       // Won't work as expected
     });
   });
   ```

3. **Don't forget error handling in manual transactions**
   ```typescript
   // ✗ Bad - Possible resource leak
   const tx = await db2.getTransaction();
   await tx.execute("INSERT ...");
   await tx.commit();
   ```

---

## Transaction Timeout

Set timeout for connection pool in `.env`:

```env
DB2_CONNECTION_TIMEOUT=30000  # 30 seconds
```

If transaction exceeds timeout:

- Connection terminates
- All changes rollback automatically
- Error is thrown

---

## Monitoring Transactions

```typescript
// Log transaction details
await db2.withTransaction(async (tx) => {
  console.log(`Started: ${new Date().toISOString()}`);

  // ... operations ...

  const duration = tx.getDuration();
  console.log(`Duration: ${duration}ms`);
});
```

---

## Summary

| Method              | Use Case                          | Auto Commit |
| ------------------- | --------------------------------- | ----------- |
| `withTransaction()` | Production, critical ops          | ✅ Yes      |
| `getTransaction()`  | Complex scenarios, manual control | ❌ Manual   |
| Direct connection   | Development, one-off              | ❌ Manual   |

**Recommendation:** Use `withTransaction()` for 95% of cases. It's safe, clean, and handles edge cases.
