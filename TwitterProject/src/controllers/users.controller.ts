import { NextFunction, Request, Response } from "express"
import userService from "~/services/user.services"
import { ParamsDictionary } from "express-serve-static-core"
import {
  ForgotPasswordBody,
  LogicReqBody,
  LogoutBody,
  RegisterReqBody,
  ResetPasswordBody,
  TokenPayload,
  UpdateMeReqBody,
  VerifyEmailBody,
  VerifyForgotPasswordBody
} from "~/models/requests/User.requests"
import { ObjectId } from "mongodb"
import User from "~/models/schemas/User.schema"
import { userMessages } from "~/constants/message"
import databaseService from "~/services/database.services"
import httpStatus from "~/constants/httpStatus"
import { UserVerifyStatus } from "~/constants/enum"
import { pick } from "lodash"

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
export const loginController = async (req: Request<ParamsDictionary, any, LogicReqBody>, res: Response) => {
  const { user } = req
  const user_id = (user as User)._id as ObjectId
  // throw new Error("Not implemented")
  const result = await userService.login({ user_id: user_id.toString(), verify: (user as User).verify })
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

export const verifyEmailController = async (req: Request<ParamsDictionary, any, VerifyEmailBody>, res: Response) => {
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

export const resendVerifyEmailController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(httpStatus.NOTFOUND).json({
      message: userMessages.USER_NOT_FOUND
    })
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.status(httpStatus.OK).json({
      message: userMessages.EMAIL_VERIFY_ALREADY_BEFORE
    })
  }
  const result = await userService.resendVerifyEmail(user_id.toString())
  return res.json({
    message: result.message
  })
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordBody>,
  res: Response
) => {
  const { user } = req
  const user_id = (user as User)._id
  const result = await userService.forgotPassword({
    user_id: (user_id as ObjectId)?.toString(),
    verify: (user as User).verify
  })

  return res.json({
    message: result.message
  })
}
// đầu tiên gửi email từ body lên và dò tìm nếu tìm thấy trả về user
// từ user lấy ra user_id truyền vào method
// cập nhật db và thêm forgot_password_token vào

export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordBody>,
  res: Response
) => {
  return res.json({
    message: userMessages.VERIFY_FORGOT_PASSWORD_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordBody>,
  res: Response
) => {
  const { user_id } = req.decode_forgot_password_token as TokenPayload
  const { password } = req.body
  const result = await userService.resetPassword(user_id, password)
  return res.json({
    message: result.message
  })
}

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const user = await userService.getMe(user_id)
  return res.json({
    message: userMessages.GET_PROFILE_IS_SUCCESS,
    result: user
  })
}

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { body } = req
  console.log(body);
  const result = await userService.updateMe(user_id, body)
  return res.json({
    message: userMessages.UPDATE_PROFILE_USER_IS_SUCCESS,
    result
  })
}

/**
 * POST - /register: truyền body {email, password, confirm_password, date_of_birth, name} -> validate các input -> truyền body {} vào services tạo AT và RT trả về; lưu RT vào db

 * POST - /login: truyền body {email, password} -> validate các input -> dò tìm user lấy ra user_id -> truyền user_id vào services tạo AT và RT trả về; lưu RT vào db

 * POST - /logout: truyền body {refresh_token} -> validate các input -> xóa refresh_token khỏi db

 * POST - /verify-email: truyền body {email_verify_token}: đã tạo lúc register -> verify ra lấy user_id -> truyền user_id vào services -> update email_verify_token = "" -> tạo AT và RT trả về db

 * POST - /resend-verify-email: truyền body {rỗng} -> sử dụng AT -> verify ra lấy user_id -> truyền user_id vào services tạo lại email_verify_token

 * POST - /forgot-password: truyền body {email} -> dò tìm email -> và lấy ra user_id -> truyền user_id vào services -> update forgot_password_token (tạo ra)

 * POST - /verify-forgot-password: truyền body {forgot_password_token} -> verify xong lấy ra user_id -> truyền user_id để dò tìm user -> thành công

 * POST - /reset-password: truyền body {forgot_password_token, password, confirm_password} -> validate các input -> verify forgot_password_token -> lấy ra user_id -> truyền user_id và password vào services -> dò tìm và update password mới và forgot_password_token: ""

 * GET - /me -> verify AT -> lấy user_id -> truyền user_id vào services -> trả về user

 * PATCH - /me -> verify AT -> lấy verify -> check trạng thái verify -> đã verify thì được update
*/
