"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("./db"));
const config_1 = require("./config");
const auth_middleware_1 = require("./auth-middleware");
const router = (0, express_1.Router)();
router.get('/me', (req, res) => {
    const token = req.cookies?.[config_1.COOKIE_NAME];
    if (!token)
        return res.status(401).json({ error: 'No token' });
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.JWT_SECRET);
        const userId = payload.sub;
        const user = (db_1.default.data.users || []).find((u) => u.id === userId);
        if (!user)
            return res.status(401).json({ error: 'User not found' });
        return res.json({ id: user.id, displayName: user.displayName, provider: user.provider, email: user.email });
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});
router.post('/logout', (req, res) => {
    res.clearCookie(config_1.COOKIE_NAME);
    res.json({ ok: true });
});
router.post('/logout-all', auth_middleware_1.requireAuth, async (req, res) => {
    await db_1.default.read();
    const user = (db_1.default.data.users || []).find((u) => u.id === req.user.id);
    if (!user)
        return res.status(400).json({ error: 'User not found' });
    user.sessionVersion = (user.sessionVersion || 1) + 1;
    await db_1.default.write();
    res.clearCookie(config_1.COOKIE_NAME);
    return res.json({ ok: true });
});
// View profile (requires auth)
router.get('/profile', auth_middleware_1.requireAuth, async (req, res) => {
    await db_1.default.read();
    const user = (db_1.default.data.users || []).find((u) => u.id === req.user.id);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    return res.json({ id: user.id, displayName: user.displayName || '', email: user.email || '' });
});
// Update profile (displayName, email)
router.put('/profile', auth_middleware_1.requireAuth, async (req, res) => {
    await db_1.default.read();
    const user = (db_1.default.data.users || []).find((u) => u.id === req.user.id);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    let { displayName, email } = req.body || {};
    if (typeof displayName !== 'string' && typeof email !== 'string') {
        return res.status(400).json({ error: 'Nothing to update' });
    }
    if (typeof displayName === 'string') {
        displayName = displayName.trim();
        if (displayName.length > 120)
            return res.status(400).json({ error: 'Display name too long' });
    }
    if (typeof email === 'string') {
        email = email.trim().toLowerCase();
        if (email && !/^\S+@\S+\.\S+$/.test(email))
            return res.status(400).json({ error: 'Invalid email' });
        // uniqueness
        const exists = (db_1.default.data.users || []).some((u) => u.id !== user.id && (u.email || '').toLowerCase() === email);
        if (email && exists)
            return res.status(400).json({ error: 'Email already in use' });
    }
    if (typeof displayName === 'string')
        user.displayName = displayName;
    if (typeof email === 'string')
        user.email = email;
    user.updatedAt = new Date().toISOString();
    await db_1.default.write();
    return res.json({ ok: true, user: { id: user.id, displayName: user.displayName || '', email: user.email || '' } });
});
exports.default = router;
