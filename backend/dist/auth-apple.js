"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("./db"));
const config_1 = require("./config");
const csrf_1 = require("./csrf");
const router = (0, express_1.Router)();
// NOTE: This is a scaffold. To enable real Apple Sign In, wire Apple's OAuth similarly to Google.
router.get('/apple', async (_req, res) => {
    // Provide a simple dev-mode fallback user when Apple OAuth is not configured
    if (config_1.NODE_ENV === 'production') {
        return res.status(501).send('Apple OAuth not configured. Configure Apple client and callback.');
    }
    try {
        await db_1.default.read();
        const users = db_1.default.data.users || [];
        let user = users.find(u => u.provider === 'apple' && u.providerId === 'dev-apple');
        if (!user) {
            const newId = (db_1.default.data.lastUserId || 0) + 1;
            const now = new Date().toISOString();
            user = {
                id: newId,
                provider: 'apple',
                providerId: 'dev-apple',
                displayName: 'Dev Apple User',
                email: 'dev.apple@example.com',
                createdAt: now,
                updatedAt: now,
                sessionVersion: 1,
                role: 'viewer',
                isActive: true
            };
            users.push(user);
            db_1.default.data.users = users;
            db_1.default.data.lastUserId = newId;
            await db_1.default.write();
        }
        const token = jsonwebtoken_1.default.sign({ sub: user.id, name: user.displayName }, config_1.JWT_SECRET, { expiresIn: '7d' });
        const isProduction = config_1.NODE_ENV === 'production';
        res.cookie(config_1.COOKIE_NAME, token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax'
        });
        (0, csrf_1.setCsrfCookie)(res);
        return res.redirect('/');
    }
    catch (err) {
        return res.status(500).send('Apple dev sign-in failed: ' + (err?.message || 'unknown'));
    }
});
exports.default = router;
