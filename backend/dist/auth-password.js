"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("./db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
const csrf_1 = require("./csrf");
const nodemailer_1 = __importDefault(require("nodemailer"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_middleware_1 = require("./auth-middleware");
// Lightweight event logger for auth flows
function logEvent(event, data) {
    try {
        console.log(`[event] ${event}`, data || {});
    }
    catch { }
}
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
// Endpoint-specific rate limiters
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later.' }
});
const forgotLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many password reset requests, please try again later.' }
});
// Helper: prune expired password reset tokens
async function pruneExpiredTokens() {
    const data = await db_1.dbManager.read();
    const list = data.passwordResetTokens || [];
    const now = Date.now();
    const pruned = list.filter((t) => t.expires > now);
    if (pruned.length !== list.length) {
        data.passwordResetTokens = pruned;
        await db_1.dbManager.write();
    }
}
function hashResetToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
// Password policy: length >= 12, at least 3 of 4 character classes
function passwordPolicyIssues(pw) {
    const issues = [];
    if (pw.length < 12)
        issues.push('Password must be at least 12 characters long');
    const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
    const present = classes.filter(r => r.test(pw)).length;
    if (present < 3)
        issues.push('Password must include at least 3 of: lowercase, uppercase, number, symbol');
    // Basic common weak patterns (can expand or externalize)
    const lowered = pw.toLowerCase();
    const weakList = ['password', 'letmein', 'qwerty', '123456', 'welcome'];
    if (weakList.some(w => lowered.includes(w)))
        issues.push('Password contains common insecure pattern');
    return issues;
}
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password)
            return res.status(400).json({ error: 'email and password required' });
        const issues = passwordPolicyIssues(password);
        if (issues.length)
            return res.status(400).json({ error: 'weak password', details: issues });
        const norm = normalizeEmail(email);
        const data = await db_1.dbManager.read();
        const users = data.users || [];
        if (users.find((u) => u.email && normalizeEmail(u.email) === norm))
            return res.status(400).json({ error: 'email already registered' });
        const hash = await bcryptjs_1.default.hash(password, 10);
        const newId = Math.max(0, ...users.map((u) => u.id)) + 1;
        const now = new Date().toISOString();
        const user = {
            id: newId,
            provider: 'password',
            email: norm,
            passwordHash: hash,
            createdAt: now,
            updatedAt: now,
            displayName: norm.split('@')[0],
            sessionVersion: 1,
            role: 'viewer',
            isActive: true
        };
        const createdUser = await db_1.dbManager.createUser(user);
        const token = jsonwebtoken_1.default.sign({ sub: createdUser.id, email: createdUser.email, sv: createdUser.sessionVersion }, config_1.JWT_SECRET, { expiresIn: '7d' });
        const isProduction = config_1.NODE_ENV === 'production';
        res.cookie(config_1.COOKIE_NAME, token, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'strict' : 'lax' });
        const csrf = (0, csrf_1.setCsrfCookie)(res);
        logEvent('auth.register', { userId: user.id, email: user.email });
        return res.status(201).json({ user: { id: user.id, email: user.email, displayName: user.displayName }, csrf });
    }
    catch (error) {
        console.error(`[${req.id}] Register error:`, error);
        return res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password)
            return res.status(400).json({ error: 'email and password required' });
        const norm = normalizeEmail(email);
        const data = await db_1.dbManager.read();
        const user = data.users.find((u) => u.email && normalizeEmail(u.email) === norm);
        if (!user || !user.passwordHash)
            return res.status(401).json({ error: 'invalid credentials' });
        const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!ok) {
            logEvent('auth.login.fail', { email: norm });
            return res.status(401).json({ error: 'invalid credentials' });
        }
        // Initialize sessionVersion if missing (legacy users)
        if (!user.sessionVersion) {
            user.sessionVersion = 1;
            await db_1.dbManager.updateUser(user.id, { sessionVersion: 1 });
        }
        const token = jsonwebtoken_1.default.sign({ sub: user.id, email: user.email, sv: user.sessionVersion }, config_1.JWT_SECRET, { expiresIn: '7d' });
        const isProduction = config_1.NODE_ENV === 'production';
        res.cookie(config_1.COOKIE_NAME, token, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'strict' : 'lax' });
        const csrf = (0, csrf_1.setCsrfCookie)(res);
        logEvent('auth.login.success', { userId: user.id, email: user.email });
        return res.json({ user: { id: user.id, email: user.email, displayName: user.displayName }, csrf });
    }
    catch (error) {
        console.error(`[${req.id}] Login error:`, error);
        return res.status(500).json({ error: 'Login failed', details: error.message });
    }
});
router.post('/forgot', forgotLimiter, async (req, res) => {
    const { email } = req.body || {};
    if (!email)
        return res.status(400).json({ error: 'email required' });
    const norm = normalizeEmail(email);
    await pruneExpiredTokens();
    const data = await db_1.dbManager.read();
    const users = data.users;
    const user = users.find((u) => u.email && normalizeEmail(u.email) === norm);
    // Always respond success to avoid account enumeration
    const rawToken = crypto_1.default.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(rawToken);
    // 15 minute expiration window
    const expires = Date.now() + 15 * 60 * 1000;
    const existing = data.passwordResetTokens || [];
    // Remove existing tokens for this user
    const filtered = user ? existing.filter((t) => t.userId !== user.id) : existing;
    data.passwordResetTokens = user ? [...filtered, { tokenHash, userId: user.id, expires }] : filtered;
    await db_1.dbManager.write();
    // In dev, return raw token to simplify testing; never return in production
    if (config_1.NODE_ENV === 'development') {
        logEvent('auth.forgot.dev', { email: norm, userId: user?.id });
        return res.json({ ok: true, token: rawToken, expires });
    }
    // Production-like path: send email if user exists and SMTP configured
    if (user && config_1.SMTP_HOST && config_1.SMTP_USER && config_1.SMTP_PASS) {
        try {
            const transporter = nodemailer_1.default.createTransport({
                host: config_1.SMTP_HOST,
                port: config_1.SMTP_PORT,
                secure: config_1.SMTP_PORT === 465,
                auth: { user: config_1.SMTP_USER, pass: config_1.SMTP_PASS }
            });
            const resetLink = `${config_1.APP_ORIGIN}/reset-password?token=${rawToken}`;
            const subject = 'Password Reset Instructions';
            const text = `A password reset was requested for your account. If this was you, open the link below to reset your password.\n\n${resetLink}\n\nIf you did not request this, you can ignore this message.`;
            const html = `<p>A password reset was requested for your account.</p><p><a href="${resetLink}">Click here to reset your password</a></p><p>If you did not request this, you can ignore this message.</p>`;
            await transporter.sendMail({ from: config_1.EMAIL_FROM, to: user.email, subject, text, html });
            logEvent('auth.forgot.email.sent', { email: norm, userId: user.id });
        }
        catch (err) {
            logEvent('auth.forgot.email.error', { email: norm, error: err.message });
            // Intentionally do not reveal error specifics to client
        }
    }
    logEvent('auth.forgot.request', { email: norm, userId: user?.id });
    return res.json({ ok: true });
});
router.post('/reset', async (req, res) => {
    const { token, password } = req.body || {};
    if (!token || !password)
        return res.status(400).json({ error: 'token and password required' });
    const issues = passwordPolicyIssues(password);
    if (issues.length)
        return res.status(400).json({ error: 'weak password', details: issues });
    await pruneExpiredTokens();
    const data = await db_1.dbManager.read();
    const list = data.passwordResetTokens || [];
    const tokenHash = hashResetToken(token);
    const record = list.find((r) => r.tokenHash === tokenHash);
    if (!record || record.expires < Date.now())
        return res.status(400).json({ error: 'invalid or expired token' });
    const users = data.users || [];
    const user = users.find((u) => u.id === record.userId);
    if (!user)
        return res.status(400).json({ error: 'user not found' });
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    await db_1.dbManager.updateUser(user.id, { passwordHash, updatedAt: new Date().toISOString() });
    data.passwordResetTokens = list.filter((r) => r.tokenHash !== tokenHash);
    await db_1.dbManager.write();
    logEvent('auth.reset.success', { userId: user.id });
    return res.json({ ok: true });
});
router.post('/change-password', auth_middleware_1.requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword)
        return res.status(400).json({ error: 'currentPassword and newPassword required' });
    const issues = passwordPolicyIssues(newPassword);
    if (issues.length)
        return res.status(400).json({ error: 'weak password', details: issues });
    const data = await db_1.dbManager.read();
    const user = data.users.find((u) => u.id === req.user.id);
    if (!user || !user.passwordHash)
        return res.status(400).json({ error: 'user not found or password auth not set' });
    const ok = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
    if (!ok) {
        logEvent('auth.change-password.fail', { userId: user.id });
        return res.status(401).json({ error: 'invalid current password' });
    }
    const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
    await db_1.dbManager.updateUser(user.id, { passwordHash, updatedAt: new Date().toISOString() });
    // Invalidate any outstanding reset tokens for this user
    const list = data.passwordResetTokens || [];
    data.passwordResetTokens = list.filter((r) => r.userId !== user.id);
    await db_1.dbManager.write();
    logEvent('auth.change-password.success', { userId: user.id });
    return res.json({ ok: true });
});
exports.default = router;
