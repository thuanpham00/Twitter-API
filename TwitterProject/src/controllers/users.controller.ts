import { NextFunction, Request, Response } from "express"
import userService from "~/services/user.services"
import { ParamsDictionary } from "express-serve-static-core"
import { RegisterReqBody } from "~/models/requests/User.requests"

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === "phamthuan99@gmail.com" && password === "thuan123") {
    return res.json({
      message: "login success"
    })
  }
  return res.status(400).json({
    error: "login failed"
  })
}

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  // throw new Error("Lỗi rồi")
  const result = await userService.register(req.body)
  return res.json({
    message: "register success",
    result
  })
}
