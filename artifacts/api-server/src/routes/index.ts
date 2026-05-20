import { Router, type IRouter } from "express";
import healthRouter from "./health";
import palmRouter from "./palm";
import chatRouter from "./chat";
import authRouter from "./auth";
import readingsRouter from "./readings";
import horoscopeRouter from "./horoscope";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/palm", palmRouter);
router.use("/palm", chatRouter);
router.use("/readings", readingsRouter);
router.use("/horoscope", horoscopeRouter);

export default router;
