import type { Request, Response, NextFunction } from "express";
import { YDocStateService } from "../services/ydocstate-service.js";

export async function getYDocStates(req: Request, res: Response, next: NextFunction) {
  try {
    const ydocStates = await YDocStateService.getYDocStates(req.userId);
    res.status(200).json({ ydocStates });
  } catch (error) {
    next(error);
  }
}
