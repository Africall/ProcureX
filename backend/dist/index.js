"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const items_1 = __importDefault(require("./items"));
const suppliers_1 = __importDefault(require("./suppliers"));
const dashboardApi_1 = __importDefault(require("./dashboardApi"));
const financeApi_1 = __importDefault(require("./financeApi"));
const marketplace_1 = __importDefault(require("./marketplace"));
const fxApi_1 = __importDefault(require("./fxApi"));
const seedData_1 = require("./seedData");
const financeDb_1 = require("./financeDb");
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
require("express-async-errors");
const config_1 = require("./config");
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
// --------- readiness flags ----------
const ready = { db: false, cache: false }; // add more flags if needed
// OPTIONAL: plug in your real connectors here
async function connectDB() {
    // e.g., await prisma.$connect()
    // Seed enterprise data for dashboard
    await (0, seedData_1.seedEnterpriseData)();
    // Seed finance data in PostgreSQL
    await (0, financeDb_1.seedFinanceData)();
    ready.db = true;
}
async function connectCache() {
    // e.g., await redis.connect()
    ready.cache = true;
}
// Simple request gate: only allow health checks until ready.
function readinessGate(req, res, next) {
    const isReady = ready.db && ready.cache;
    const isHealthPath = ['/live', '/ready', '/health'].includes(req.path);
    console.log(`[${req.id}] Readiness check:`, { isReady, isHealthPath, path: req.path });
    if (isReady || isHealthPath) {
        return next();
    }
    console.warn(`[${req.id}] Blocking request due to service not ready:`, { path: req.path, ready });
    res.status(503).json({ ok: false, reason: 'service_not_ready', path: req.path });
}
const app = (0, express_1.default)();
// trust first proxy (needed for secure cookies behind reverse proxies)
app.set('trust proxy', 1);
// Security & core middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: config_1.NODE_ENV === 'production' ? config_1.APP_ORIGIN : true, credentials: true }));
app.use(express_1.default.json({ limit: '1mb' }));
// Dev logging only (keeps prod leaner)
if (config_1.NODE_ENV !== 'production')
    app.use((0, morgan_1.default)('dev'));
else
    app.use((0, morgan_1.default)('combined'));
// Request ID and detailed logging middleware
app.use((req, res, next) => {
    req.id = crypto_1.default.randomUUID();
    res.setHeader('X-Request-Id', req.id);
    // Log request details for debugging 500s
    console.log(`[${req.id}] ${req.method} ${req.path}`, {
        headers: req.headers,
        body: req.method !== 'GET' ? req.body : undefined,
        query: req.query,
        ip: req.ip
    });
    next();
});
// rate limiter (configurable)
if (config_1.RATE_LIMIT_ENABLED) {
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: config_1.RATE_LIMIT_WINDOW,
        max: config_1.RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => ['/', '/live', '/ready', '/health'].includes(req.path) || req.method === 'OPTIONS',
        keyGenerator: (req) => (req.ip || req.headers['x-forwarded-for'] || 'unknown').toString(),
        message: { ok: false, error: 'too_many_requests', hint: 'Please slow down and try again shortly.' }
    });
    // apply limiter to API only (avoid throttling static assets)
    app.use('/api', limiter);
}
// Liveness & readiness (for compose / load balancers / k8s)
app.get('/live', (_req, res) => res.json({ ok: true }));
app.get('/ready', (_req, res) => {
    const isReady = ready.db && ready.cache;
    res.status(isReady ? 200 : 503).json({ ok: isReady, ...ready });
});
// Keep your existing /health too
app.get('/health', (_req, res) => res.json({ ok: true, env: config_1.NODE_ENV, uptime: process.uptime(), version: process.env.APP_VERSION || '0.1.0' }));
// Gate non-auth traffic until deps are ready (so we can listen immediately)
app.use(readinessGate);
// In production, serve the built frontend (same-origin)
let staticDir = '';
if (config_1.NODE_ENV === 'production') {
    // Frontend build output is at repo root /dist; compiled backend runs from backend/dist
    staticDir = path_1.default.resolve(__dirname, '../../dist');
    app.use(express_1.default.static(staticDir, { index: false, maxAge: '1h', setHeaders(res) { res.setHeader('Cache-Control', 'public, max-age=3600'); } }));
}
// Routers
app.use('/api/items', items_1.default);
app.use('/api/suppliers', suppliers_1.default);
app.use('/api/dashboard', dashboardApi_1.default);
app.use('/api/finance', financeApi_1.default);
app.use('/api/marketplace', marketplace_1.default);
app.use('/api/fx', fxApi_1.default);
// SPA fallback: send index.html for non-API routes
if (config_1.NODE_ENV === 'production') {
    app.get(/^\/(?!api|health|live|ready).*/, (_req, res) => {
        res.sendFile(path_1.default.join(staticDir, 'index.html'));
    });
}
// Enhanced global error handler with detailed logging
app.use((err, req, res, _next) => {
    const requestId = req.id || 'unknown';
    const errorDetails = {
        requestId,
        method: req.method,
        path: req.path,
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack,
            status: err.status || err.statusCode,
            code: err.code
        },
        body: req.method !== 'GET' ? req.body : undefined,
        headers: req.headers
    };
    console.error(`[${requestId}] 500 ERROR CAUGHT:`, JSON.stringify(errorDetails, null, 2));
    // Send structured error response
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        error: err.message || 'Internal Server Error',
        requestId,
        ...(config_1.NODE_ENV === 'development' && { stack: err.stack })
    });
});
let server;
if (config_1.NODE_ENV !== 'test') {
    const start = Date.now();
    // Bind explicitly to 127.0.0.1 in dev to avoid IPv6/localhost resolution issues on Windows
    const listenHost = config_1.NODE_ENV === 'production' ? undefined : '127.0.0.1';
    const portNum = Number(config_1.PORT);
    server = listenHost ? app.listen(portNum, listenHost, () => {
        console.log(`ProcureX backend listening on ${portNum} (${config_1.NODE_ENV}) bound to ${listenHost} in ${Date.now() - start}ms`);
        void init();
    }) : app.listen(portNum, () => {
        console.log(`ProcureX backend listening on ${portNum} (${config_1.NODE_ENV}) in ${Date.now() - start}ms`);
        void init();
    });
}
// Graceful shutdown
process.on('SIGTERM', () => { server?.close(() => process.exit(0)); });
process.on('SIGINT', () => { server?.close(() => process.exit(0)); });
exports.default = app;
// ---------- async init in parallel ----------
async function init() {
    const t0 = Date.now();
    try {
        const results = await Promise.allSettled([
            connectDB(),
            connectCache(),
            // add other short warmups here (feature flags, small caches) — avoid long tasks
        ]);
        // Log any failed initializations
        results.forEach((result, index) => {
            const names = ['connectDB', 'connectCache'];
            if (result.status === 'rejected') {
                console.error(`Init failed for ${names[index]}:`, result.reason);
            }
        });
        const ms = Date.now() - t0;
        console.log(`ProcureX init complete in ${ms}ms`, ready);
    }
    catch (error) {
        console.error('Init error:', error);
        // Don't crash the server, just log and continue
    }
}
