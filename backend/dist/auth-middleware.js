"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const config_1 = require("./config");
const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.[config_1.COOKIE_NAME];
        if (!token)
            return res.status(401).json({ error: 'Not authenticated' });
        const payload = jsonwebtoken_1.default.verify(token, config_1.JWT_SECRET);
        const userId = payload.sub;
        const tokenSv = payload.sv;
        const data = await db_1.dbManager.read();
        const user = data.users.find((u) => u.id === userId);
        if (!user)
            return res.status(401).json({ error: 'User not found' });
        if (user.sessionVersion && tokenSv && tokenSv !== user.sessionVersion) {
            return res.status(401).json({ error: 'Session revoked' });
        }
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
exports.requireAuth = requireAuth;
const requireRole = (role) => (req, res, next) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: 'Not authenticated' });
    if (!(user.roles || []).includes(role))
        return res.status(403).json({ error: 'Forbidden' });
    next();
};
exports.requireRole = requireRole;
