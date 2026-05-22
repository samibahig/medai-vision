import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

// GET /api/summary/kpis
router.get("/summary/kpis", (_req: Request, res: Response): void => {
  res.json({
    totalSignals: 247,
    highPrioritySignals: 34,
    drugsMonitored: 10,
    adverseEventsTracked: 10,
    modelAuc: 0.9312,
    reportsAnalyzed: 124872,
    newSignalsThisMonth: 12,
    signalDetectionRate: 0.867,
  });
});

export default router;
