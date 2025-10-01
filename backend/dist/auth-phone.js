"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const twilio_1 = __importDefault(require("twilio"));
const config_1 = require("./config");
const csrf_1 = require("./csrf");
const router = (0, express_1.Router)();
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
// Start phone flow: accept { phone } and send a code (mocked)
router.post('/phone', async (req, res) => {
    const phone = req.body.phone || req.query.phone;
    if (!phone)
        return res.status(400).json({ error: 'phone required' });
    const code = generateCode();
    const data = await db_1.dbManager.read();
    const pending = data.pendingPhoneCodes || [];
    const entry = { phone, code, expires: Date.now() + 5 * 60 * 1000 };
    const filtered = pending.filter((p) => p.phone !== phone);
    filtered.push(entry);
    data.pendingPhoneCodes = filtered;
    await db_1.dbManager.write();
    // Try to send via Twilio if configured
    if (config_1.TWILIO_SID && config_1.TWILIO_TOKEN && config_1.TWILIO_FROM) {
        const client = (0, twilio_1.default)(config_1.TWILIO_SID, config_1.TWILIO_TOKEN);
        client.messages.create({ body: `Your ProcureX code is ${code}`, from: config_1.TWILIO_FROM, to: phone }).then(() => {
            return res.json({ ok: true });
        }).catch((err) => {
            console.error('Twilio send failed', err);
            // fallback to returning code only in dev mode
            if (config_1.NODE_ENV === 'development') {
                return res.json({ ok: true, code });
            }
            return res.status(500).json({ error: 'SMS service unavailable' });
        });
    }
    else {
        // Only return code in development mode for testing
        if (config_1.NODE_ENV === 'development') {
            return res.json({ ok: true, code });
        }
        return res.status(500).json({ error: 'SMS service not configured' });
    }
});
// Verify code: { phone, code }
router.post('/phone/verify', async (req, res) => {
    const { phone, code } = req.body;
    if (!phone || !code)
        return res.status(400).json({ error: 'phone and code required' });
    const data = await db_1.dbManager.read();
    const pending = data.pendingPhoneCodes || [];
    const entry = pending.find((p) => p.phone === phone && p.code === code);
    if (!entry || entry.expires < Date.now())
        return res.status(400).json({ error: 'Invalid or expired code' });
    // Upsert user
    const users = data.users || [];
    let user = users.find((u) => u.provider === 'phone' && u.providerId === phone);
    if (!user) {
        const newId = Math.max(0, ...users.map((u) => u.id)) + 1;
        const now = new Date().toISOString();
        const userData = { provider: 'phone', providerId: phone, displayName: phone, createdAt: now, updatedAt: now, sessionVersion: 1, role: 'viewer', isActive: true };
        user = await db_1.dbManager.createUser(userData);
    }
    // cleanup pending code
    data.pendingPhoneCodes = pending.filter((p) => !(p.phone === phone && p.code === code));
    await db_1.dbManager.write();
    const token = jsonwebtoken_1.default.sign({ sub: user.id, name: user.displayName }, config_1.JWT_SECRET, { expiresIn: '7d' });
    const isProduction = config_1.NODE_ENV === 'production';
    res.cookie(config_1.COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax'
    });
    (0, csrf_1.setCsrfCookie)(res);
    return res.json({ ok: true, user: { id: user.id, displayName: user.displayName } });
});
exports.default = router;
