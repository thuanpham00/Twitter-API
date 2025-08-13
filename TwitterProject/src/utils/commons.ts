import { Request } from "express"
import httpStatus from "~/constants/httpStatus"
import { userMessages } from "~/constants/message"
import { ErrorWithStatus } from "~/models/Errors"
import { verifyToken } from "./jwt"
import { JsonWebTokenError } from "jsonwebtoken"

export const convertEnumArray = (numberEnum: { [key: string]: string | number }) => {
  return Object.values(numberEnum).filter((value) => typeof value === "number") as Number[]
}

export const verifyAccessToken = async (accessToken: string, req?: Request) => {
  if (!accessToken) {
    throw new ErrorWithStatus({
      message: userMessages.ACCESS_TOKEN_IS_REQUIRED,
      status: httpStatus.UNAUTHORIZED
    })
  }
  try {
    const decode_authorization = await verifyToken({
      token: accessToken,
      secretOrPublicKey: process.env.JWT_ACCESS_TOKEN_SECRET as string
    })
    if (req) {
      ;(req as Request).decode_authorization = decode_authorization // chứa user_id và verify
      return true
      // tham số req dùng trong hàm middlewares (expressJS) (truyền vào ở đó) còn dùng cho socket.io thì trả về thẳng thay vì gán vào req.decode ...
    }
    return decode_authorization
  } catch (error) {
    throw new ErrorWithStatus({
      message: (error as JsonWebTokenError).message, // lỗi trong hàm verifyToken
      status: httpStatus.UNAUTHORIZED
    })
  }
}
