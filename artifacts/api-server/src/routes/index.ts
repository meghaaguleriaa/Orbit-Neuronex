import { Router, type IRouter } from "express";
import healthRouter from "./health";
import candidatesRouter from "./candidates";
import jobsRouter from "./jobs";
import pipelineRouter from "./pipeline";
import debatesRouter from "./debates";
import chemistryRouter from "./chemistry";
import autopilotRouter from "./autopilot";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/candidates", candidatesRouter);
router.use("/jobs", jobsRouter);
router.use("/pipeline", pipelineRouter);
router.use("/debates", debatesRouter);
router.use("/chemistry", chemistryRouter);
router.use("/autopilot", autopilotRouter);
router.use("/analytics", analyticsRouter);

export default router;
