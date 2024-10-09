import User from "~/models/schemas/User.schema"
import databaseService from "./database.services"
import { RegisterReqBody } from "~/models/requests/User.requests"
import { hashPassword } from "~/utils/scripto"
import { signToken } from "~/utils/jwt"
import { TokenType, UserVerifyStatus } from "~/constants/enum"
import RefreshToken from "~/models/schemas/RefreshToken.schema"
import { ObjectId } from "mongodb"
import { config } from "dotenv"
import { userMessages } from "~/constants/message"
config()
class UserService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      privateKey: process.env.JWT_ACCESS_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }

  private signRefreshToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      privateKey: process.env.JWT_REFRESH_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }

  private signEmailVerify(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken
      },
      privateKey: process.env.JWT_VERIFY_EMAIL_SECRET as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_EXPIRES_IN
      }
    })
  }

  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }

  async register(payload: RegisterReqBody) {
    // thêm data vào collection users
    const user_id = new ObjectId() // 1 là tự tạo 2 là MongoDB tự tạo giùm
    const emailVerifyToken = await this.signEmailVerify(user_id.toString())
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token: emailVerifyToken,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    ) // await đợi 1 kết quả trả về từ 'promise'
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id.toString())

    // thêm data vào collection refresh_tokens
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )
    // console.log("email-verify-token: ", emailVerifyToken)
    return { access_token, refresh_token }
  }

  // check email đã tồn tại chưa
  async checkEmailExits(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  // chỉ có register, login, verify-email mới sign và trả về AT và RT
  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )
    return { access_token, refresh_token }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: userMessages.LOGOUT_SUCCESS
    }
  }

  async verifyEmail(user_id: string) {
    // tạo giá trị cập nhật
    // mongoDB cập nhật giá trị

    // await databaseService.users.updateOne(
    //   {
    //     _id: new ObjectId(user_id) // dò tìm theo id và set giá trị nhanh hơn
    //   },
    //   {
    //     $set: {
    //       email_verify_token: "",
    //       updated_at: new Date()
    //     }
    //   }
    // )
    // const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id.toString())
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken(user_id.toString()),
      databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id) // dò tìm theo id và set giá trị nhanh hơn
        },
        {
          $set: {
            email_verify_token: "",
            verify: UserVerifyStatus.Verified
            // updated_at: new Date() // tạo giá trị cập nhập
          },
          $currentDate: {
            updated_at: true // MongoDB tự cập nhật giá trị (Date)
          }
        }
      )
    ])
    const [access_token, refresh_token] = token
    return {
      access_token,
      refresh_token
    }
  }

  // reset lại email-verify-token
  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerify(user_id)
    console.log("Gửi email: ", email_verify_token)

    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )

    return {
      message: userMessages.RESEND_EMAIL_VERIFY_SUCCESS
    }
  }
}

const userService = new UserService()
export default userService
// nơi đây thực hiện các method logic xử lý db
