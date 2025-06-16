import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate = (schema: ZodSchema<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path.length > 0) {
          const field = err.path[0];
          errors[field] = err.message;
        }
      });

      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }
    next();
  };
