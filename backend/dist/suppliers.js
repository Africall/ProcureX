"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("./db"));
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
function ensureSupplierId(req, res) {
    const idParam = req.params?.id;
    if (!idParam) {
        res.status(400).json({ error: 'Supplier id is required' });
        return null;
    }
    const id = Number(idParam);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: 'Invalid supplier id' });
        return null;
    }
    return id;
}
// List suppliers with basic query + pagination
router.get('/', async (req, res) => {
    await db_1.default.read();
    let list = (db_1.default.data?.suppliers || []);
    const q = req.query.q || '';
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '50');
    if (q) {
        const qq = q.toLowerCase();
        list = list.filter(s => s.name.toLowerCase().includes(qq) || (s.contactName || '').toLowerCase().includes(qq));
    }
    const total = list.length;
    const offset = (page - 1) * limit;
    const pageItems = list.slice(offset, offset + limit);
    res.json({ items: pageItems, total });
});
// Get supplier by id
router.get('/:id', async (req, res) => {
    const id = ensureSupplierId(req, res);
    if (id === null)
        return;
    await db_1.default.read();
    const s = (db_1.default.data.suppliers || []).find((x) => x.id === id);
    if (!s)
        return res.status(404).send();
    res.json(s);
});
// Supplier predictive insights (placeholder)
router.get('/:id/insights', async (req, res) => {
    const id = ensureSupplierId(req, res);
    if (id === null)
        return;
    await db_1.default.read();
    const s = (db_1.default.data.suppliers || []).find((x) => x.id === id);
    if (!s)
        return res.status(404).send();
    // Very simple deterministic mock insights based on id
    const deliveryRisk = ((id * 37) % 100) / 100; // 0-0.99
    const leadTimeDays = 7 + ((id * 13) % 21); // 7-27
    const qualityForecast = 0.7 + (((id * 17) % 30) / 100); // 0.7-1.0
    const notes = 'Auto-generated insights. Replace with real analytics when available.';
    res.json({ deliveryRisk, leadTimeDays, qualityForecast, notes });
});
// Supplier metrics (timeseries)
router.get('/:id/metrics', async (req, res) => {
    const id = ensureSupplierId(req, res);
    if (id === null)
        return;
    await db_1.default.read();
    const s = (db_1.default.data.suppliers || []).find((x) => x.id === id);
    if (!s)
        return res.status(404).send();
    // Generate 12 months of synthetic data
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const seed = (id * 13 + i * 7) % 100;
        const onTimeRate = 0.75 + ((seed % 20) / 100); // 0.75 - 0.95
        const defectRate = 0.02 + ((seed % 6) / 100); // 0.02 - 0.08
        const spend = 20000 + (seed * 700); // 20k - 90k approx
        months.push({ month: label, onTimeRate, defectRate, spend });
    }
    res.json({ months });
});
// Supplier timeline (recent events)
router.get('/:id/timeline', async (req, res) => {
    const id = ensureSupplierId(req, res);
    if (id === null)
        return;
    await db_1.default.read();
    const s = (db_1.default.data.suppliers || []).find((x) => x.id === id);
    if (!s)
        return res.status(404).send();
    const base = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);
    const events = [
        { date: fmt(new Date(base.getFullYear(), base.getMonth(), base.getDate() - 5)), type: 'delivery', text: 'PO #1241 delivered 96% on-time' },
        { date: fmt(new Date(base.getFullYear(), base.getMonth(), base.getDate() - 14)), type: 'quality', text: 'Quality inspection passed (AQL 1.0)' },
        { date: fmt(new Date(base.getFullYear(), base.getMonth(), base.getDate() - 21)), type: 'communication', text: 'Price renegotiation completed (-3.2%)' },
    ];
    res.json({ events });
});
// Supplier attachments (static list)
router.get('/:id/attachments', async (req, res) => {
    const id = ensureSupplierId(req, res);
    if (id === null)
        return;
    await db_1.default.read();
    const s = (db_1.default.data.suppliers || []).find((x) => x.id === id);
    if (!s)
        return res.status(404).send();
    const attachments = [
        { name: 'MSA.pdf', url: '#', uploadedAt: '2024-10-12' },
        { name: 'ISO9001-certificate.pdf', url: '#', uploadedAt: '2025-01-09' },
    ];
    res.json({ attachments });
});
// Create supplier
router.post('/', (0, express_validator_1.body)('name').isLength({ min: 1 }), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    await db_1.default.read();
    const data = (db_1.default.data.suppliers || []);
    const id = (db_1.default.data.lastSupplierId || 0) + 1;
    const { name, contactName, email, phone, address } = req.body;
    const supplier = { id, name, contactName: contactName || null, email: email || null, phone: phone || null, address: address || null };
    db_1.default.data.suppliers = [...data, supplier];
    db_1.default.data.lastSupplierId = id;
    await db_1.default.write();
    res.status(201).json(supplier);
});
// Update supplier
router.put('/:id', (0, express_validator_1.body)('name').optional().isLength({ min: 1 }), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const id = ensureSupplierId(req, res);
    if (id === null)
        return;
    await db_1.default.read();
    const list = (db_1.default.data.suppliers || []);
    const s = list.find(x => x.id === id);
    if (!s)
        return res.status(404).send();
    const { name, contactName, email, phone, address } = req.body;
    if (name !== undefined)
        s.name = name;
    if (contactName !== undefined)
        s.contactName = contactName;
    if (email !== undefined)
        s.email = email;
    if (phone !== undefined)
        s.phone = phone;
    if (address !== undefined)
        s.address = address;
    await db_1.default.write();
    res.json(s);
});
// Delete supplier
router.delete('/:id', async (req, res) => {
    const id = ensureSupplierId(req, res);
    if (id === null)
        return;
    await db_1.default.read();
    db_1.default.data.suppliers = (db_1.default.data.suppliers || []).filter((x) => x.id !== id);
    await db_1.default.write();
    res.status(204).send();
});
exports.default = router;
