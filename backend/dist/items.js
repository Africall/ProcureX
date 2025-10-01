"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("./db"));
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        await db_1.default.read();
        const q = req.query.q || '';
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '50');
        const sort = req.query.sort || 'id';
        const location = req.query.location || '';
        let items = (db_1.default.data?.items || []);
        if (q) {
            const qq = q.toLowerCase();
            items = items.filter(i => i.name.toLowerCase().includes(qq) || (i.sku || '').toLowerCase().includes(qq));
        }
        if (location)
            items = items.filter(i => i.location === location);
        const total = items.length;
        if (sort)
            items.sort((a, b) => (a[sort] || '').toString().localeCompare((b[sort] || '').toString()));
        const offset = (page - 1) * limit;
        const pageItems = items.slice(offset, offset + limit);
        res.json({ items: pageItems, total });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Unable to fetch items' });
    }
});
router.post('/', (0, express_validator_1.body)('name').isLength({ min: 1 }), (0, express_validator_1.body)('quantity').isInt({ min: 0 }), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    try {
        await db_1.default.read();
        const { name, sku, quantity, location, minStock, maxStock, unitPrice, category, description, tags } = req.body;
        const id = (db_1.default.data.lastId || 0) + 1;
        const now = new Date().toISOString();
        const item = {
            id,
            name,
            sku: sku || null,
            quantity,
            location: location || null,
            minStock: minStock || Math.max(1, Math.floor(quantity * 0.2)),
            maxStock: maxStock || Math.floor(quantity * 2),
            unitPrice: unitPrice || 0,
            category: category || 'General',
            description: description || '',
            tags: tags || [],
            isActive: true,
            createdAt: now,
            updatedAt: now
        };
        db_1.default.data.items = (db_1.default.data.items || []).concat([item]);
        db_1.default.data.lastId = id;
        await db_1.default.write();
        res.status(201).json(item);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Unable to create item' });
    }
});
router.put('/:id', (0, express_validator_1.body)('name').optional().isLength({ min: 1 }), (0, express_validator_1.body)('quantity').optional().isInt({ min: 0 }), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    try {
        const idParam = req.params?.id;
        if (!idParam)
            return res.status(400).json({ error: 'Item id is required' });
        const id = Number(idParam);
        if (Number.isNaN(id))
            return res.status(400).json({ error: 'Invalid item id' });
        await db_1.default.read();
        const item = (db_1.default.data.items || []).find((x) => x.id === id);
        if (!item)
            return res.status(404).send();
        const { name, sku, quantity, location } = req.body;
        if (name !== undefined)
            item.name = name;
        if (sku !== undefined)
            item.sku = sku;
        if (quantity !== undefined)
            item.quantity = quantity;
        if (location !== undefined)
            item.location = location;
        await db_1.default.write();
        res.json(item);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Unable to update item' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const idParam = req.params?.id;
        if (!idParam)
            return res.status(400).json({ error: 'Item id is required' });
        const id = Number(idParam);
        if (Number.isNaN(id))
            return res.status(400).json({ error: 'Invalid item id' });
        await db_1.default.read();
        db_1.default.data.items = (db_1.default.data.items || []).filter((x) => x.id !== id);
        await db_1.default.write();
        res.status(204).send();
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Unable to delete item' });
    }
});
exports.default = router;
