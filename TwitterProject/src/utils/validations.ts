import express from "express"
import { body, validationResult, ContextRunner, ValidationChain } from "express-validator"
import { RunnableValidationChains } from "express-validator/lib/middlewares/schema"
import httpStatus from "~/constants/httpStatus"
import { EntityError, ErrorWithStatus } from "~/models/Errors"

// can be reused by many routes
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await validation.run(req)
    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next() // nếu ko lỗi thì chạy tiếp
    }
    const errorsObject = errors.mapped()
    console.log(errorsObject)
    const entityError = new EntityError({ errors: {} })
    for (const key in errorsObject) {
      const { msg } = errorsObject[key]
      // trả về lỗi không phải lỗi do validate
      if (msg instanceof ErrorWithStatus && msg.status !== httpStatus.UNPROCESSABLE_ENTITY) {
        return next(msg) // error handler
      }
      entityError.errors[key] = errorsObject[key]
    }
    // lỗi do validate thông thường
    next(entityError)
  }
}
