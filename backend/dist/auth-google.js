"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("./db"));
const config_1 = require("./config");
const csrf_1 = require("./csrf");
const router = (0, express_1.Router)();
// Only initialize Google OAuth if credentials are present
if (config_1.GOOGLE_CLIENT_ID && config_1.GOOGLE_CLIENT_SECRET) {
    passport_1.default.use(new GoogleStrategy({
        clientID: config_1.GOOGLE_CLIENT_ID,
        clientSecret: config_1.GOOGLE_CLIENT_SECRET,
        callbackURL: config_1.GOOGLE_CALLBACK
    }, function (accessToken, refreshToken, profile, cb) {
        // simple user upsert in lowdb
        (async () => {
            await db_1.default.read();
            const users = db_1.default.data.users || [];
            let user = users.find((u) => u.providerId === profile.id && u.provider === 'google');
            if (!user) {
                const newId = (db_1.default.data.lastUserId || 0) + 1;
                const now = new Date().toISOString();
                user = {
                    id: newId,
                    provider: 'google',
                    providerId: profile.id,
                    displayName: profile.displayName,
                    email: Array.isArray(profile.emails) && profile.emails[0]?.value ? String(profile.emails[0].value).toLowerCase() : null,
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
            return cb(null, user);
        })().catch((err) => cb(err));
    }));
}
router.get('/google', async (req, res, next) => {
    // If not configured, provide a dev-mode fallback to allow seamless sign-in
    if (!(config_1.GOOGLE_CLIENT_ID && config_1.GOOGLE_CLIENT_SECRET)) {
        if (config_1.NODE_ENV === 'production') {
            return res.status(501).send('Google OAuth not configured. Set GOOGLE_CLIENT_ID/SECRET.');
        }
        try {
            await db_1.default.read();
            const users = db_1.default.data.users || [];
            const existing = users.find(u => u.provider === 'google' && u.providerId === 'dev-google');
            let user = existing;
            if (!user) {
                const newId = (db_1.default.data.lastUserId || 0) + 1;
                const now = new Date().toISOString();
                user = {
                    id: newId,
                    provider: 'google',
                    providerId: 'dev-google',
                    displayName: 'Dev Google User',
                    email: 'dev.google@example.com',
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
            return res.status(500).send('Google dev sign-in failed: ' + (err?.message || 'unknown'));
        }
    }
    return passport_1.default.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: '/' }), (req, res) => {
    const user = req.user;
    if (!user)
        return res.redirect('/');
    const token = jsonwebtoken_1.default.sign({ sub: user.id, name: user.displayName }, config_1.JWT_SECRET, { expiresIn: '7d' });
    const isProduction = config_1.NODE_ENV === 'production';
    res.cookie(config_1.COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax'
    });
    (0, csrf_1.setCsrfCookie)(res);
    res.redirect('/');
});
exports.default = router;
