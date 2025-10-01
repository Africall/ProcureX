"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_ORIGIN = exports.EMAIL_FROM = exports.SMTP_PASS = exports.SMTP_USER = exports.SMTP_PORT = exports.SMTP_HOST = exports.RATE_LIMIT_ENABLED = exports.RATE_LIMIT_MAX = exports.RATE_LIMIT_WINDOW = exports.TWILIO_FROM = exports.TWILIO_TOKEN = exports.TWILIO_SID = exports.GOOGLE_CALLBACK = exports.GOOGLE_CLIENT_SECRET = exports.GOOGLE_CLIENT_ID = exports.NODE_ENV = exports.COOKIE_NAME = exports.JWT_SECRET = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load env from backend/.env regardless of working directory
// Works in both ts-node (src) and compiled (dist)
const backendEnvPath = path_1.default.resolve(__dirname, '..', '.env');
dotenv_1.default.config({ path: backendEnvPath });
// Fallback: also try process.cwd()/.env if not found
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
exports.PORT = process.env.PORT || 4001;
exports.JWT_SECRET = process.env.JWT_SECRET || 'dev';
exports.COOKIE_NAME = process.env.COOKIE_NAME || 'procurex_token';
exports.NODE_ENV = process.env.NODE_ENV || 'development';
// Google OAuth
exports.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
exports.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
exports.GOOGLE_CALLBACK = process.env.GOOGLE_CALLBACK || 'http://localhost:4001/auth/google/callback';
// Twilio
exports.TWILIO_SID = process.env.TWILIO_SID;
exports.TWILIO_TOKEN = process.env.TWILIO_TOKEN;
exports.TWILIO_FROM = process.env.TWILIO_FROM;
// Rate limiting
exports.RATE_LIMIT_WINDOW = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
exports.RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 100);
exports.RATE_LIMIT_ENABLED = (process.env.RATE_LIMIT_ENABLED ?? (process.env.NODE_ENV === 'production' ? 'true' : 'false')).toLowerCase() === 'true';
// Email / SMTP
exports.SMTP_HOST = process.env.SMTP_HOST || '';
exports.SMTP_PORT = Number(process.env.SMTP_PORT || 587);
exports.SMTP_USER = process.env.SMTP_USER || '';
exports.SMTP_PASS = process.env.SMTP_PASS || '';
exports.EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@example.com';
exports.APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';
