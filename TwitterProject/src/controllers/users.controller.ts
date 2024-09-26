import { NextFunction, Request, Response } from "express"
import userService from "~/services/user.services"
import { ParamsDictionary } from "express-serve-static-core"
import { LogoutBody, RegisterReqBody } from "~/models/requests/User.requests"
import { ObjectId } from "mongodb"
import User from "~/models/schemas/User.schema"
import { userMessages } from "~/constants/message"

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  // throw new Error("Lỗi rồi")
  const result = await userService.register(req.body)
  return res.json({
    message: userMessages.REGISTER_SUCCESS,
    result
  })
}

export const loginController = async (req: Request, res: Response) => {
  const { user } = req
  const user_id = (user as User)._id as ObjectId
  // throw new Error("Not implemented")
  const result = await userService.login(user_id.toString())
  return res.json({
    message: userMessages.LOGIN_SUCCESS,
    result
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await userService.logout(refresh_token)
  return res.json({
    message: result.message
  })
}
