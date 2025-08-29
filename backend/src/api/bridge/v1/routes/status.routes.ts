import { Router } from 'express';
import { statusController } from '../controllers/status.controller';

const router = Router();

/**
 * @route   GET /api/bridge/v1/status
 * @desc    Get comprehensive API status
 * @access  Public
 */
router.get('/', statusController.getStatus.bind(statusController));

/**
 * @route   GET /api/bridge/v1/status/simple
 * @desc    Get simple UP/DOWN status
 * @access  Public
 */
router.get('/simple', statusController.getSimpleStatus.bind(statusController));

/**
 * @route   GET /api/bridge/v1/status/metrics
 * @desc    Get detailed metrics
 * @access  Public
 */
router.get('/metrics', statusController.getMetrics.bind(statusController));

export default router;