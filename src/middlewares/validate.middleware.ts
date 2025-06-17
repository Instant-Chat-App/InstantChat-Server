import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";
import { DataResponse } from "../dtos/responses/DataResponse";

export const validate = (schema: ZodSchema<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      result.error.errors.forEach(err => {
        return res.status(400).json(DataResponse.badRequest(err.message));
      });
    }
    next();
  };
