import { Router } from 'express';
import { authenticateJWT } from '../../middleware/auth';
import * as authorizationController from '../../controllers/authorization/authorizationController';
import { db } from '../../config/db2';

const router = Router();

// LOGIN
router.post('/login', async (req, res) => {
    const conn = await db();
    await authorizationController.login(req, res, conn);
    conn.close();
});

// REFRESH TOKEN
router.post('/refresh', async (req, res) => {
    const conn = await db();
    await authorizationController.refreshToken(req, res, conn);
    conn.close();
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
    const conn = await db();
    await authorizationController.forgotPassword(req, res, conn);
    conn.close();
});

// VALIDATE RESET TOKEN
router.post('/validate-reset-token', async (req, res) => {
    const conn = await db();
    await authorizationController.validateResetToken(req, res, conn);
    conn.close();
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
    const conn = await db();
    await authorizationController.resetPassword(req, res, conn);
    conn.close();
});

// CREATE ROLE
router.post('/roles', authenticateJWT, async (req, res) => {
    const conn = await db();
    await authorizationController.createRole(req, res, conn);
    conn.close();
});

// GET ALL ROLES
router.get('/roles', authenticateJWT, async (req, res) => {
    const conn = await db();
    await authorizationController.listRoles(req, res, conn);
    conn.close();
});

// ACTIVE ROLES FOR DROPDOWNS
router.get('/roles/options', authenticateJWT, async (req, res) => {
    const conn = await db();
    try {
        await authorizationController.getRoleOptions(req, res, conn);
    } finally {
        await conn.close();
    }
});

// GET USERS ASSIGNED TO A ROLE
router.get('/roles/:roleId/users', authenticateJWT, async (req, res) => {
    const conn = await db();
    try {
        await authorizationController.listUsersByRole(req, res, conn);
    } finally {
        await conn.close();
    }
});

// ROLE SUMMARY
router.get('/roles/summary', authenticateJWT, async (req, res) => {
    const conn = await db();
    await authorizationController.getUserRoleSummary(req, res, conn);
    conn.close();
});

// GET ROLE DETAILS
router.get('/roles/:roleId', authenticateJWT, async (req, res) => {
    const conn = await db();
    try {
        await authorizationController.getRoleDetails(req, res, conn);
    } finally {
        await conn.close();
    }
});

// UPDATE ROLE
router.put('/roles/:roleId', authenticateJWT, async (req, res) => {
    const conn = await db();
    await authorizationController.updateRole(req, res, conn);
    conn.close();
});

// DEACTIVATE ROLE
router.delete('/roles/:roleId', authenticateJWT, async (req, res) => {
    const conn = await db();
    try {
        await authorizationController.deactivateRole(req, res, conn);
    } finally {
        await conn.close();
    }
});

// GET ALL USERS
router.get('/users', authenticateJWT, async (req, res) => {
    const conn = await db();
    await authorizationController.listUsers(req, res, conn);
    conn.close();
});

// GET USER BY ID
router.get('/users/:userId', authenticateJWT, async (req, res) => {
    const conn = await db();
    try {
        await authorizationController.getUserById(req, res, conn);
    } finally {
        await conn.close();
    }
});

// CREATE USER
router.post('/users', authenticateJWT, async (req, res) => {
    const conn = await db();
    await authorizationController.createUser(req, res, conn);
    conn.close();
});

// UPDATE USER
router.put('/users/:userId', authenticateJWT, async (req, res) => {
    const conn = await db();
    await authorizationController.updateUser(req, res, conn);
    conn.close();
});

// UPDATE USER ACTIVE STATUS
router.patch('/users/:userId/status', authenticateJWT, async (req, res) => {
    const conn = await db();
    try {
        await authorizationController.updateUserStatus(req, res, conn);
    } finally {
        await conn.close();
    }
});

// REMOVE ROLE FROM USER
router.delete('/users/:userId/roles/:roleId', authenticateJWT, async (req, res) => {
    const conn = await db();
    try {
        await authorizationController.removeRole(req, res, conn);
    } finally {
        await conn.close();
    }
});

// GET PERMISSION MASTER
router.get('/permissions/catalog', authenticateJWT, async (req, res) => {
    const conn = await db();
    try {
        await authorizationController.getPermissionCatalog(req, res, conn);
    } finally {
        await conn.close();
    }
});

export default router;
