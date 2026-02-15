import express from 'express';
import { getResources, uploadResource, deleteResource } from '../controllers/resourceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply protection to all resource routes
router.use(protect);

router.get('/', getResources);
router.post('/', uploadResource);
router.delete('/:id', deleteResource);

export default router;
