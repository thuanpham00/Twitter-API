import { Router } from "express"
import { loginController, registerController } from "~/controllers/users.controller"
import { loginValidator, registerValidator } from "~/middlewares/users.middlewares"
import { wrapRequestHandler } from "~/utils/handlers"

const userRouter = Router()

userRouter.post("/login", loginValidator, loginController)
/**
 * Description
 * Path: /register
 * Method: POST
 * Body: { name: string, email: string, password: string, confirm_password, data_of_birth: ISO8601}
 */
userRouter.post("/register", registerValidator, wrapRequestHandler(registerController))

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
