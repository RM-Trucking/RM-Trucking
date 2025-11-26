/**
 * DB2 Utility Usage Examples
 * 
 * Three approaches for DB2 connections:
 * 1. db() - Direct connection (development/one-off queries)
 * 2. DB2 class with getPool() - Connection pooling (production)
 * 3. Transactions with commit/rollback - ACID operations
 */

import { db, DB2, initializeDB2Pool, closeDB2Pool, createTransaction, Transaction } from '../config/db2';

/**
 * Example 1: Using Direct Connection (Development)
 */
export async function exampleDirectConnection() {
    try {
        // Get direct connection
        const connection = await db();

        // Execute query
        const result = await connection.query('SELECT * FROM YOUR_TABLE LIMIT 10');
        console.log('Direct connection result:', result);

        // Close connection
        await connection.close();
    } catch (error) {
        console.error('Direct connection error:', error);
    }
}

/**
 * Example 2: Using Connection Pool (Production)
 */
export async function examplePooledConnection() {
    try {
        // Initialize pool on app startup
        const db2 = await initializeDB2Pool();

        // Query using pool
        const result = await db2.query('SELECT * FROM YOUR_TABLE LIMIT 10');
        console.log('Pooled query result:', result);

        // Get single result
        const singleResult = await db2.queryOne('SELECT * FROM YOUR_TABLE WHERE ID = ?', [1]);
        console.log('Single result:', singleResult);

        // Health check
        const isHealthy = await db2.healthCheck();
        console.log('Pool health:', isHealthy);

        // Close pool on app shutdown
        await closeDB2Pool();
    } catch (error) {
        console.error('Pooled connection error:', error);
    }
}

/**
 * Example 3: Using Singleton Pattern
 */
export async function exampleSingletonPattern() {
    try {
        // Get singleton instance
        const db2 = DB2.getInstance();

        // Initialize if not already done
        if (!db2.isPoolConnected()) {
            await db2.initialize();
        }

        // Use the pool
        const results = await db2.query('SELECT * FROM YOUR_TABLE');
        console.log('Singleton results:', results);
    } catch (error) {
        console.error('Singleton error:', error);
    }
}

/**
 * Example 4: Manual Transaction with Commit/Rollback
 */
export async function exampleManualTransaction() {
    let transaction: Transaction | null = null;

    try {
        // Create transaction
        transaction = await createTransaction();

        // Execute multiple queries within transaction
        const insert1 = await transaction.execute(
            'INSERT INTO YOUR_TABLE (id, name) VALUES (?, ?)',
            [1, 'John']
        );

        const insert2 = await transaction.execute(
            'INSERT INTO YOUR_TABLE (id, name) VALUES (?, ?)',
            [2, 'Jane']
        );

        // If all operations succeed, commit
        await transaction.commit();
        console.log('Transaction committed successfully');
    } catch (error) {
        // If any operation fails, rollback
        if (transaction && transaction.isTransactionActive()) {
            await transaction.rollback();
        }
        console.error('Transaction rolled back due to error:', error);
    }
}

/**
 * Example 5: Automatic Transaction with withTransaction (Recommended)
 */
export async function exampleAutoTransaction() {
    try {
        const db2 = await initializeDB2Pool();

        // withTransaction automatically commits on success, rolls back on error
        const result = await db2.withTransaction(async (tx) => {
            // Execute queries
            await tx.execute('INSERT INTO YOUR_TABLE (id, name) VALUES (?, ?)', [1, 'John']);
            await tx.execute('INSERT INTO YOUR_TABLE (id, name) VALUES (?, ?)', [2, 'Jane']);
            await tx.execute('UPDATE YOUR_TABLE SET status = ? WHERE id = ?', ['active', 1]);

            return { success: true, message: 'All operations completed' };
        });

        console.log('Auto transaction result:', result);
    } catch (error) {
        console.error('Auto transaction error:', error);
    }
}

/**
 * Example 6: Transfer Money Transaction (Real-world scenario)
 */
export async function exampleMoneyTransfer() {
    try {
        const db2 = await initializeDB2Pool();

        // Transfer $100 from account A to account B
        const transferResult = await db2.withTransaction(async (tx) => {
            // Debit from account A
            await tx.execute(
                'UPDATE ACCOUNTS SET balance = balance - ? WHERE account_id = ?',
                [100, 'ACCT_A']
            );

            // Credit to account B
            await tx.execute(
                'UPDATE ACCOUNTS SET balance = balance + ? WHERE account_id = ?',
                [100, 'ACCT_B']
            );

            // Log transaction
            await tx.execute(
                'INSERT INTO TRANSACTION_LOG (from_acct, to_acct, amount, status) VALUES (?, ?, ?, ?)',
                ['ACCT_A', 'ACCT_B', 100, 'completed']
            );

            return { success: true, amount: 100 };
        });

        console.log('Money transfer completed:', transferResult);
        // Both operations succeed or both fail - no partial transfers!
    } catch (error) {
        console.error('Money transfer failed - transaction rolled back:', error);
        // All operations are rolled back automatically
    }
}

/**
 * Example 7: Transaction with Savepoint (Advanced)
 */
export async function exampleTransactionWithSavepoint() {
    let transaction: Transaction | null = null;

    try {
        transaction = await createTransaction();

        // First set of operations
        await transaction.execute('INSERT INTO LOG (message) VALUES (?)', ['Operation 1 started']);

        // Create savepoint (DB2 specific syntax)
        await transaction.execute('SAVEPOINT sp1');

        // Try risky operation
        try {
            await transaction.execute('INSERT INTO CRITICAL_DATA (data) VALUES (?)', ['risky_data']);
        } catch (error) {
            console.warn('Risky operation failed, rolling back to savepoint');
            // Rollback to savepoint, not full transaction
            await transaction.execute('ROLLBACK TO SAVEPOINT sp1');
        }

        // Continue with safe operations
        await transaction.execute('INSERT INTO LOG (message) VALUES (?)', ['Operation 2 completed']);

        // Commit all changes after savepoint
        await transaction.commit();
    } catch (error) {
        if (transaction && transaction.isTransactionActive()) {
            await transaction.rollback();
        }
        console.error('Error:', error);
    }
}
