import { Router } from "express"
import {
  changePasswordController,
  followController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  loginGoogleController,
  logoutController,
  refreshTokenController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  unfollowController,
  updateMeController,
  verifyEmailController,
  verifyForgotPasswordController
} from "~/controllers/users.controllers"
import { filterMiddleware } from "~/middlewares/common.middlewares"
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordTokenValidator
} from "~/middlewares/users.middlewares"
import { UpdateMeReqBody } from "~/models/requests/User.requests"
import { wrapRequestHandler } from "~/utils/handlers"

// xử lý các api liên quan tới user
const userRouter = Router()

/**
 * Description: Register a new user
 * Path: /register
 * Method: POST
 * Body: { name: string, email: string, password: string, confirm_password, data_of_birth: ISO8601}
 */
userRouter.post("/register", registerValidator, wrapRequestHandler(registerController))

/**
 * Description: login user
 * Path: /login
 * Method: POST
 * Body: { email: string, password: string}
 */
userRouter.post("/login", loginValidator, wrapRequestHandler(loginController))

/**
 * Description: OAuth with Google
 * Path: /oauth/google
 * Method: GET
 * Query: {code: string}
 */
userRouter.get("/oauth/google", wrapRequestHandler(loginGoogleController))

/**
 * Description: Logout a new user
 * Path: /logout
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: { refresh_token: string }
 */
userRouter.post("/logout", accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

/**
 * Description: Refresh token
 * Path: /refresh-token
 * Method: POST
 * Body: { refresh_token: string }
 */
userRouter.post("/refresh-token", refreshTokenValidator, wrapRequestHandler(refreshTokenController))

/**
 * Description: verify email when user click on the link in email
 * Path: /verify-email
 * Method: POST
 * Body: { email_verify_token: string }
 */
userRouter.post("/verify-email", emailVerifyTokenValidator, wrapRequestHandler(verifyEmailController))

/**
 * Description: verify email when user click on the link in email
 * Path: /resend-verify-email
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: {}
 */
userRouter.post("/resend-verify-email", accessTokenValidator, wrapRequestHandler(resendVerifyEmailController))

/**
 * Description: submit email to reset password
 * Path: /forgot-password
 * Method: POST
 * Body: {email: string}
 */
userRouter.post("/forgot-password", forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

/**
 * Description: verify link in email when user click on the link in email
 * Path: /verify-forgot-password
 * Method: POST
 * Body: {forgot_password_token: string}
 */
userRouter.post(
  "/verify-forgot-password",
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)

/**
 * Description: reset password
 * Path: /reset-password
 * Method: POST
 * Body: {forgot_password_token: string, password: string, confirm_password: string}
 */
userRouter.post("/reset-password", resetPasswordValidator, wrapRequestHandler(resetPasswordController))

/**
 * Description: get my profile
 * Path: /me
 * Method: GET
 * Header: {Authorization: Bearer <access_token>}
 * Body: {}
 */
userRouter.get("/me", accessTokenValidator, wrapRequestHandler(getMeController))

/**
 * Description: update my profile
 * Path: /me
 * Method: PATCH
 * Header: {Authorization: Bearer <access_token>}
 * Body: UserSchema
 */
userRouter.patch(
  "/me",
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeReqBody>([
    "name",
    "date_of_birth",
    "bio",
    "location",
    "website",
    "username",
    "avatar",
    "cover_photo"
  ]),
  wrapRequestHandler(updateMeController)
)

/**
 * Description: get user profile
 * Path: /:username
 * Method: GET
 */
userRouter.get("/:username", wrapRequestHandler(getProfileController))

/**
 * Description: Follow someone
 * Path: /follow
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: {followed_user_id: string}
 */
userRouter.post(
  "/follow",
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(followController)
)

/**
 * Description: unFollow someone
 * Path: /follow/:user_id
 * Method: DELETE
 * Header: {Authorization: Bearer <access_token>}
 */
userRouter.delete(
  "/follow/:user_id",
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapRequestHandler(unfollowController)
)

/**
 * Description: change password user
 * Path: /change-password
 * Method: PUT
 * Header: {Authorization: Bearer <access_token>}
 * Body: {old_password: string, password: string, confirm_password: string}
 */
userRouter.put(
  "/change-password",
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)

export default userRouter

// validate: check lỗi middleware, nếu có lỗi ko chạy đến controller

// userRouter.post(
//   "/register",
//   registerValidator,
//   // request handler
//   (req, res, next) => {
//     console.log("request handler 1")
//     // next(new Error("lỗi rồi"))
//     throw new Error("Lỗi rồi")
//   },
//   (req, res, next) => {
//     console.log("request handler 2")
//     next()
//   },
//   // synchronous handler
//   (req, res, next) => {
//     console.log("request handler 3")
//     next()
//   },
//   // error handler
//   // có lỗi nó chạy xuống đây
//   (err, req, res, next) => {
//     console.log("Lỗi là: ", err.message)
//     res.status(400).json({ error: err.message })
//   }
// )
// có 2 loại handler
// request handler 3 tham số (req, res, next)
// error handler 4 tham số (err, req, res, next)

// nó sẽ chạy lần lượt request handler
// ko lỗi thì nó next() // nếu ko next() nó dừng tại đó
// nếu có lỗi thì nó chạy tới error handler

/**
 * - Gọi `next()` để chuyển request sang request handler tiếp theo
   - Gọi `next(err)` để chuyển request sang error handler tiếp theo
  Khi xảy ra lỗi trong synchronous handler thì tự động sẽ được chuyển sang error handler
  Khi xảy ra lỗi trong asynchronous handler thì phải gọi `next(err)` để chuyển sang error handler
 */

// route nào cần AccessToken thì mới cần truyền vào headers để xác thực người dùng ,còn route nào ko cần AccessToken thì ko cần truyền
