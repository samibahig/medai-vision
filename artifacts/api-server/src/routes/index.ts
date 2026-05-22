import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pharmacovigilanceRouter from "./pharmacovigilance";
import temporalRouter from "./temporal";
import mlRouter from "./ml";
import summaryRouter from "./summary";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pharmacovigilanceRouter);
router.use(temporalRouter);
router.use(mlRouter);
router.use(summaryRouter);

export default router;
