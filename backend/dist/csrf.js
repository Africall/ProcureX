"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCsrfToken = generateCsrfToken;
exports.setCsrfCookie = setCsrfCookie;
exports.validateCsrf = validateCsrf;
exports.csrfProtection = csrfProtection;
const crypto_1 = __importDefault(require("crypto"));
function generateCsrfToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
function setCsrfCookie(res) {
    const token = generateCsrfToken();
    res.cookie('csrf_token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    });
    return token;
}
function validateCsrf(req) {
    const tokenFromCookie = req.cookies?.csrf_token;
    const tokenFromHeader = req.headers['x-csrf-token'];
    return tokenFromCookie && tokenFromHeader && tokenFromCookie === tokenFromHeader;
}
function csrfProtection(req, res, next) {
    const method = req.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return next();
    }
    if (!validateCsrf(req)) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next();
}
