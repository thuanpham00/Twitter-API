import { NextFunction, Request, Response } from "express"
import userService from "~/services/user.services"
import { ParamsDictionary } from "express-serve-static-core"
import { LogoutBody, RegisterReqBody, TokenPayload } from "~/models/requests/User.requests"
import { ObjectId } from "mongodb"
import User from "~/models/schemas/User.schema"
import { userMessages } from "~/constants/message"
import databaseService from "~/services/database.services"
import httpStatus from "~/constants/httpStatus"

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
// register: nó kiểm tra các input đầu vào (middlewares), xong insert vào db collection (controller)
// login: nó dò tìm tài khoản (email, pass) (middlewares), sau đó lấy ra user_id (tìm thấy) vào (controller) login
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

export const emailVerifyValidator = async (req: Request, res: Response) => {
  const { user_id } = req.decode_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  // nếu không tìm thấy user thì báo lỗi
  if (!user) {
    return res.status(httpStatus.NOTFOUND).json({ message: userMessages.USER_NOT_FOUND })
  }
  // t.h đã verify thì mình sẽ không báo lỗi, mà mình sẽ trả về stt ok với message (đã verify trước đó về)
  if (user.email_verify_token === "") {
    return res.status(httpStatus.OK).json({ message: userMessages.EMAIL_VERIFY_ALREADY_BEFORE })
  }
  const result = await userService.verifyEmail(user_id)
  return res.json({
    message: userMessages.EMAIL_VERIFY_SUCCESS,
    result
  })
}

// lúc register thì có dùng user_id sign ra chuỗi email_verify_token và lưu vào chung db.
// để chạy route này thì truyền "email_verify_token" lên body và decode (verify ngược lại) và lấy ra user_id trong nó -> qua controller -> truyền user_id vào phương thức và nó update (dò theo user_id và set giá trị của email_verify_token = "") -> verify thành công