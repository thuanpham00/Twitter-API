import { JwtPayload } from "jsonwebtoken"
import { TokenType, UserVerifyStatus } from "~/constants/enum"

// định nghĩa interface request body gửi lên
export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface UpdateMeReqBody {
  name?: string
  date_of_birth?: string
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}
export interface LogicReqBody {
  email: string
  password: string
}
export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
}

export interface LogoutBody {
  refresh_token: string
}

export interface VerifyEmailBody {
  email_verify_token: string
}

export interface ForgotPasswordBody {
  email: string
}

export interface VerifyForgotPasswordBody {
  forgot_password_token: string
}

export interface ResetPasswordBody extends VerifyForgotPasswordBody {
  password: string
  confirm_password: string
}
