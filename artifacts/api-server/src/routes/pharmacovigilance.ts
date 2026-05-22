import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

// ── Synthetic pharmacovigilance data ────────────────────────────────────────

const DRUGS = [
  "Atorvastatin", "Metformin", "Amiodarone", "Warfarin", "Ibuprofen",
  "Clopidogrel", "Lisinopril", "Omeprazole", "Metoprolol", "Amlodipine",
];

const ADRS = [
  "Hepatotoxicity", "Rhabdomyolysis", "QT Prolongation", "GI Bleeding",
  "Renal Failure", "Thrombocytopenia", "Anaphylaxis", "Stevens-Johnson",
  "Hyponatremia", "Agranulocytosis",
];

interface Signal {
  id: string;
  drug: string;
  adr: string;
  prr: number;
  prrLower: number;
  prrUpper: number;
  ror: number;
  rorLower: number;
  rorUpper: number;
  ic: number;
  ic025: number;
  ebgm: number;
  eb05: number;
  nCases: number;
  pValue: number;
  priority: "high" | "medium" | "low";
  status: "confirmed" | "potential" | "under_review" | "closed";
}

function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateSignals(): Signal[] {
  const signals: Signal[] = [];
  let id = 1;
  for (const drug of DRUGS) {
    for (const adr of ADRS) {
      const s = seeded(id * 17 + 3);
      const s2 = seeded(id * 31 + 7);
      const s3 = seeded(id * 13 + 11);

      const nCases = Math.floor(s * 180) + 10;
      const ror = parseFloat((0.8 + s2 * 8).toFixed(2));
      const prr = parseFloat((0.7 + s3 * 7).toFixed(2));
      const ic = parseFloat((-1.5 + s * 5).toFixed(2));
      const ebgm = parseFloat((0.5 + s2 * 6).toFixed(2));
      const pValue = parseFloat((seeded(id * 7 + 5) * 0.2).toFixed(4));

      const priority: Signal["priority"] =
        ror > 4 && nCases > 50 ? "high" : ror > 2 ? "medium" : "low";
      const statuses: Signal["status"][] = ["confirmed", "potential", "under_review", "closed"];
      const status = statuses[Math.floor(s3 * 4)];

      signals.push({
        id: String(id++),
        drug,
        adr,
        prr,
        prrLower: parseFloat((prr * 0.78).toFixed(2)),
        prrUpper: parseFloat((prr * 1.28).toFixed(2)),
        ror,
        rorLower: parseFloat((ror * 0.75).toFixed(2)),
        rorUpper: parseFloat((ror * 1.35).toFixed(2)),
        ic,
        ic025: parseFloat((ic - 0.8).toFixed(2)),
        ebgm,
        eb05: parseFloat((ebgm * 0.7).toFixed(2)),
        nCases,
        pValue,
        priority,
        status,
      });
    }
  }
  return signals;
}

const ALL_SIGNALS = generateSignals();

// GET /api/signals
router.get("/signals", (req: Request, res: Response): void => {
  const { drug, minPrr } = req.query;
  let signals = ALL_SIGNALS;
  if (typeof drug === "string" && drug) {
    signals = signals.filter((s) => s.drug.toLowerCase().includes(drug.toLowerCase()));
  }
  if (typeof minPrr === "string" && !isNaN(parseFloat(minPrr))) {
    signals = signals.filter((s) => s.prr >= parseFloat(minPrr));
  }
  res.json(signals);
});

// GET /api/signals/volcano
router.get("/signals/volcano", (_req: Request, res: Response): void => {
  const points = ALL_SIGNALS.map((s) => ({
    drug: s.drug,
    adr: s.adr,
    logRor: parseFloat(Math.log(s.ror).toFixed(3)),
    negLogP: parseFloat((-Math.log10(s.pValue + 0.0001)).toFixed(3)),
    ror: s.ror,
    pValue: s.pValue,
    nCases: s.nCases,
    significant: s.ror > 2 && s.pValue < 0.05,
    priority: s.priority,
  }));
  res.json(points);
});

// GET /api/signals/heatmap
router.get("/signals/heatmap", (_req: Request, res: Response): void => {
  const selectedDrugs = DRUGS.slice(0, 8);
  const selectedAdrs = ADRS.slice(0, 8);

  const matrix: number[][] = selectedDrugs.map((drug, di) =>
    selectedAdrs.map((adr, ai) => {
      const sig = ALL_SIGNALS.find((s) => s.drug === drug && s.adr === adr);
      return sig ? parseFloat(sig.ror.toFixed(2)) : 0;
    })
  );

  res.json({ drugs: selectedDrugs, adrs: selectedAdrs, matrix });
});

export default router;
