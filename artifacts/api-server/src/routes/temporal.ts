import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

const DRUGS = ["Atorvastatin", "Amiodarone", "Warfarin", "Ibuprofen", "Clopidogrel"];
const QUARTERS = [
  "2021-Q1", "2021-Q2", "2021-Q3", "2021-Q4",
  "2022-Q1", "2022-Q2", "2022-Q3", "2022-Q4",
  "2023-Q1", "2023-Q2", "2023-Q3", "2023-Q4",
  "2024-Q1", "2024-Q2", "2024-Q3", "2024-Q4",
];

function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateTrends() {
  const trends: Array<{
    quarter: string;
    drug: string;
    prr: number;
    ror: number;
    ic: number;
    ebgm: number;
    nCases: number;
  }> = [];

  DRUGS.forEach((drug, di) => {
    let basePrr = 1.5 + seeded(di * 7 + 1) * 3;
    let baseRor = 1.8 + seeded(di * 11 + 3) * 3.5;
    let baseIc = 0.5 + seeded(di * 13 + 5) * 2;
    let baseEbgm = 1.2 + seeded(di * 17 + 7) * 2.8;
    let baseN = 15 + Math.floor(seeded(di * 19 + 9) * 60);

    QUARTERS.forEach((quarter, qi) => {
      const drift = seeded(di * 100 + qi * 7 + 3) * 0.4 - 0.2;
      const spike = qi === 5 || qi === 11 ? seeded(di * 43 + qi) * 1.5 : 0;

      basePrr = Math.max(0.5, basePrr + drift + spike * 0.3);
      baseRor = Math.max(0.5, baseRor + drift + spike * 0.4);
      baseIc = baseIc + drift * 0.5 + spike * 0.2;
      baseEbgm = Math.max(0.3, baseEbgm + drift * 0.6 + spike * 0.35);
      baseN = Math.max(5, baseN + Math.floor(drift * 10) + Math.floor(spike * 8));

      trends.push({
        quarter,
        drug,
        prr: parseFloat(basePrr.toFixed(2)),
        ror: parseFloat(baseRor.toFixed(2)),
        ic: parseFloat(baseIc.toFixed(2)),
        ebgm: parseFloat(baseEbgm.toFixed(2)),
        nCases: baseN,
      });
    });
  });

  return trends;
}

const ALL_TRENDS = generateTrends();

// GET /api/temporal/trends
router.get("/temporal/trends", (req: Request, res: Response): void => {
  const { drug, metric } = req.query;
  let trends = ALL_TRENDS;
  if (typeof drug === "string" && drug) {
    trends = trends.filter((t) => t.drug === drug);
  }
  res.json(trends);
});

export default router;
