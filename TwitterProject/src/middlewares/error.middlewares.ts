import express, { Request, Response, NextFunction } from "express"
import { omit } from "lodash"
import httpStatus from "~/constants/httpStatus"
import { ErrorWithStatus } from "~/models/Errors"

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  try {
    if (err instanceof ErrorWithStatus) {
      return res.status(err.status).json(omit(err, ["status"]))
    }
    const finalError: any = {}
    Object.getOwnPropertyNames(err).forEach((key) => {
      if (
        !Object.getOwnPropertyDescriptor(err, key)?.configurable ||
        !Object.getOwnPropertyDescriptor(err, key)?.writable 
      ) {
        // trường hợp có thể lỗi do inActive key từ aws
        return
      }
      finalError[key] = err[key]
    })
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: finalError.message,
      errorInfo: omit(finalError, ["stack"])
    })
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
      errorInfo: omit(error as any, ["stack"])
    })
  }
}

// Object.getOwnPropertyDescriptor: Trả về một descriptor object mô tả các thuộc tính của một thuộc tính cụ thể trên đối tượng.
// Object.getOwnPropertyNames: Trả về một mảng chứa tất cả các tên thuộc tính (cả enumerable và non-enumerable) trên đối tượng được chỉ định.