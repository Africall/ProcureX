"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// Simple in-memory cache with optional file persistence
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const CACHE_FILE = path_1.default.resolve(__dirname, '../db/fx_cache.json');
let cache = null;
function loadCacheFromFile() {
    try {
        if (fs_1.default.existsSync(CACHE_FILE)) {
            const raw = fs_1.default.readFileSync(CACHE_FILE, 'utf8');
            cache = JSON.parse(raw);
        }
    }
    catch (err) {
        console.warn('Failed to load FX cache file:', err);
    }
}
function persistCacheToFile() {
    try {
        const dir = path_1.default.dirname(CACHE_FILE);
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        fs_1.default.writeFileSync(CACHE_FILE, JSON.stringify(cache || {}, null, 2), 'utf8');
    }
    catch (err) {
        console.warn('Failed to persist FX cache file:', err);
    }
}
async function fetchRatesFromProvider(base = 'KES', symbols = ['USD', 'EUR', 'GBP']) {
    const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${symbols.map(encodeURIComponent).join(',')}`;
    const res = await (0, node_fetch_1.default)(url, { method: 'GET' });
    if (!res.ok)
        throw new Error(`FX provider error: ${res.status}`);
    const body = await res.json();
    return { base: body.base || base, rates: body.rates || {}, fetchedAt: Date.now() };
}
// GET /api/fx/latest?base=KES&symbols=USD,EUR
router.get('/latest', async (req, res) => {
    try {
        const base = req.query.base || 'KES';
        const symbolsQ = req.query.symbols || 'USD,EUR,GBP';
        const symbols = symbolsQ.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
        // load cached file on first request
        if (cache === null)
            loadCacheFromFile();
        const now = Date.now();
        const isExpired = !cache || (now - (cache.fetchedAt || 0)) > CACHE_TTL_MS || cache.base !== base;
        if (!isExpired) {
            // serve from cache but filter rates to requested symbols
            const filtered = {};
            for (const s of symbols)
                if (cache.rates[s])
                    filtered[s] = cache.rates[s];
            return res.json({ source: 'cache', base: cache.base, rates: filtered, fetchedAt: cache.fetchedAt });
        }
        // fetch fresh
        const fresh = await fetchRatesFromProvider(base, symbols);
        cache = { base: fresh.base, rates: fresh.rates, fetchedAt: fresh.fetchedAt };
        try {
            persistCacheToFile();
        }
        catch (err) { /* swallow */ }
        return res.json({ source: 'provider', base: cache.base, rates: cache.rates, fetchedAt: cache.fetchedAt });
    }
    catch (err) {
        console.error('FX latest error', err);
        // If cache present, reply with stale data and a warning
        if (cache) {
            return res.status(200).json({ source: 'stale_cache', base: cache.base, rates: cache.rates, fetchedAt: cache.fetchedAt, warning: 'provider_unavailable' });
        }
        res.status(502).json({ error: 'failed_to_fetch_fx_rates', detail: err.message });
    }
});
exports.default = router;
