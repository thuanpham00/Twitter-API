import { Request, Response } from "express"
import userService from "~/services/user.services"

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

export const registerController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const result = await userService.register({ email, password })
    return res.json({
      message: "register success",
      result
    })
  } catch (error) {
    return res.status(400).json({
      error: "register failed"
    })
  }
}
