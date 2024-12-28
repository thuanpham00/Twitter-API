import { NextFunction, Request, Response } from "express"
import userService from "~/services/user.services"
import { ParamsDictionary } from "express-serve-static-core"
import {
  ChangePasswordReqBody,
  FollowReqBody,
  ForgotPasswordBody,
  LogicReqBody,
  LogoutBody,
  RefreshTokenBody,
  RegisterReqBody,
  ResetPasswordBody,
  TokenPayload,
  UnFollowReqParams,
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
import { config } from "dotenv"
config()

// nó phân biệt và hiển thị dựa theo user_id (phân biệt như mã người dùng và select query ra danh sách ... dựa trên mã người dùng đó)

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
  const verify = (user as User).verify
  // throw new Error("Not implemented")
  const result = await userService.login({ user_id: user_id.toString(), verify: verify })
  return res.json({
    message: userMessages.LOGIN_SUCCESS,
    result
  })
}

export const loginGoogleController = async (req: Request, res: Response) => {
  const { code } = req.query
  const result = await userService.loginGoogle(code as string)

  // RT luu cookie tại backEnd
  // AT luu localStorage tại frontEnd
  // res.cookie("refresh_token", result.refresh_token, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "strict",
  //   maxAge: 100 * 24 * 60 * 60 * 1000, // Đồng bộ thời gian sống cookie (100 ngày)
  //   path: "/",
  // });

  const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&new_user=${result.newUser}&verify=${result.verify}`
  return res.redirect(urlRedirect)
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await userService.logout(refresh_token)
  return res.json({
    message: result.message
  })
}

export const refreshTokenController = async (req: Request<ParamsDictionary, any, RefreshTokenBody>, res: Response) => {
  const { user_id, verify, exp } = req.decode_refresh_token as TokenPayload
  const { refresh_token } = req.body
  const result = await userService.refreshToken({ user_id, verify, exp, refresh_token })
  return res.json({
    message: userMessages.REFRESH_TOKEN_IS_SUCCESS,
    result: result
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
  if (user.verify === UserVerifyStatus.Verified) {
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
  const verify = user?.verify as UserVerifyStatus
  const result = await userService.forgotPassword({
    user_id: (user_id as ObjectId)?.toString(),
    verify: verify
  }) // giống loginController

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
  console.log(body)
  const result = await userService.updateMe(user_id, body)
  return res.json({
    message: userMessages.UPDATE_PROFILE_USER_IS_SUCCESS,
    result
  })
}

export const getProfileController = async (req: Request<{ username: string }>, res: Response) => {
  const { username } = req.params // truyền theo kiểu params !== body
  const result = await userService.getProfile(username)
  return res.json({
    message: userMessages.GET_USER_PROFILE_IS_SUCCESS,
    result
  })
}

export const followController = async (req: Request<ParamsDictionary, any, FollowReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { followed_user_id } = req.body
  const result = await userService.follow(user_id, followed_user_id)
  return res.json({
    message: result.message
  })
}

export const unfollowController = async (req: Request<{ user_id: string }>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { user_id: followed_user_id } = req.params
  const result = await userService.unfollow(user_id, followed_user_id)
  return res.json({
    message: result.message
  })
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { password } = req.body
  const result = await userService.changePassword(user_id, password)
  return res.json({
    message: result.message
  })
}
