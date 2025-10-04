"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Mock marketplace suppliers data
const marketplaceSuppliers = [
    { id: 'mkt-1', name: 'Global Tech Supplies', category: 'Electronics', rating: 4.8 },
    { id: 'mkt-2', name: 'Prime Materials Co', category: 'Raw Materials', rating: 4.5 },
    { id: 'mkt-3', name: 'Swift Logistics Ltd', category: 'Shipping', rating: 4.2 },
    { id: 'mkt-4', name: 'EcoPackaging Pro', category: 'Packaging', rating: 4.6 },
    { id: 'mkt-5', name: 'Quality Parts Inc', category: 'Components', rating: 4.7 },
    { id: 'mkt-6', name: 'Industrial Metals', category: 'Metals', rating: 4.3 },
    { id: 'mkt-7', name: 'ChemSupply Direct', category: 'Chemicals', rating: 4.4 },
    { id: 'mkt-8', name: 'Office Solutions+', category: 'Office Supplies', rating: 4.5 },
];
// GET /api/marketplace/suppliers - List available suppliers in marketplace
router.get('/suppliers', (_req, res) => {
    res.json(marketplaceSuppliers);
});
exports.default = router;
