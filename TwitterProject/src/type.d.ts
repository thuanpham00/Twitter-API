import { Request } from "express"
import User from "./models/schemas/User.schema"
import { TokenPayload } from "./models/requests/User.requests"
declare module "express" {
  interface Request {
    user?: User
    decode_authorization?: TokenPayload
    decode_refresh_token?: TokenPayload
    decode_email_verify_token?: TokenPayload
    decode_forgot_password_token?: TokenPayload
  }
}
// mở rộng kiểu dữ liệu Request
