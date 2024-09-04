import { Router } from "express"
import { loginController, registerController } from "~/controllers/users.controller"
import { loginValidator, registerValidator } from "~/middlewares/users.middlewares"

const userRouter = Router()

userRouter.post("/login", loginValidator, loginController)
/**
 * Description
 * Path: /register
 * Method: POST
 * Body: { name: string, email: string, password: string, confirm_password, data_of_birth: ISO8601}
 */
userRouter.post("/register", registerValidator, registerController)

export default userRouter

// validate: check lỗi middleware, nếu có lỗi ko chạy đến controller
