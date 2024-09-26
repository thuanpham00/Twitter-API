import express, { Request, Response, NextFunction } from "express"
import { omit } from "lodash"
import httpStatus from "~/constants/httpStatus"
import { ErrorWithStatus } from "~/models/Errors"

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(omit(err, ["status"]))
  }
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true }) // bật enumerable = true để chuyển lỗi qua json
  })
  res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfo: omit(err, ["stack"])
  })
}
