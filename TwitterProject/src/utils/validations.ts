import express from "express"
import { body, validationResult, ContextRunner, ValidationChain } from "express-validator"
import { RunnableValidationChains } from "express-validator/lib/middlewares/schema"

// can be reused by many routes
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await validation.run(req)
    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next() // nếu ko lỗi thì chạy tiếp
    }
    res.status(400).json({ error: errors.mapped() }) // in ds lỗi nếu có
  }
}
