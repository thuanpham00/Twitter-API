import User from "~/models/schemas/User.schema"
import databaseService from "./database.services"
import { RegisterReqBody, UpdateMeReqBody } from "~/models/requests/User.requests"
import { hashPassword } from "~/utils/scripto"
import { signToken } from "~/utils/jwt"
import { TokenType, UserVerifyStatus } from "~/constants/enum"
import RefreshToken from "~/models/schemas/RefreshToken.schema"
import { ObjectId } from "mongodb"
import { config } from "dotenv"
import { userMessages } from "~/constants/message"
import { ErrorWithStatus } from "~/models/Errors"
import httpStatus from "~/constants/httpStatus"
import Followers from "~/models/schemas/Followers.schema"
import axios from "axios"
config()
class UserService {
  // các phương thức (method)
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        verify,
        token_type: TokenType.AccessToken
      },
      // khi decode có thể lấy ra trạng thái user verify
      privateKey: process.env.JWT_ACCESS_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }

  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        verify,
        token_type: TokenType.RefreshToken
      },
      privateKey: process.env.JWT_REFRESH_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }

  private signEmailVerify({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        verify,
        token_type: TokenType.EmailVerifyToken
      },
      privateKey: process.env.JWT_VERIFY_EMAIL_SECRET as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_EXPIRES_IN
      }
    })
  }

  private signForgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        verify,
        token_type: TokenType.ForgotPasswordToken
      },
      privateKey: process.env.JWT_FORGOT_PASSWORD_SECRET as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_EXPIRES_IN
      }
    })
  }

  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  async register(payload: RegisterReqBody) {
    // thêm data vào collection users
    const user_id = new ObjectId() // 1 là tự tạo 2 là MongoDB tự tạo giùm
    const emailVerifyToken = await this.signEmailVerify({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id.toString()}`,
        email_verify_token: emailVerifyToken,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    ) // await đợi 1 kết quả trả về từ 'promise'
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })

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
  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id,
      verify: verify
    })

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )
    return { access_token, refresh_token }
  }

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code"
    }

    const { data } = await axios.post("https://oauth2.googleapis.com/token", body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }) // gửi giá trị code lên api google và lấy được id_token và access_token

    return data as {
      access_token: string
      id_token: string
    }
  }

  private async getGoogleInfo(id_token: string, access_token: string) {
    // gửi giá trị AT và id_token lên api google và lấy được info user
    const { data } = await axios.get("https://www.googleapis.com/oauth2/v1/userinfo", {
      params: {
        access_token,
        alt: "json"
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      family_name: string
      picture: string
    }
  }

  async loginGoogle(code: string) {
    const { access_token, id_token } = await this.getOauthGoogleToken(code)
    const userInfo = await this.getGoogleInfo(id_token, access_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: userMessages.EMAIL_NOT_VERIFIED,
        status: httpStatus.BAD_REQUESTED
      })
    }
    // nếu tồn tại email trong DB thì login vào (login)
    // còn chưa tồn tại thì tạo mới user (register)
    const findUser = await databaseService.users.findOne({ email: userInfo.email })
    if (findUser) {
      const user_id = findUser?._id as ObjectId
      const verifyStatus = findUser?.verify as UserVerifyStatus
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user_id.toString(),
        verify: verifyStatus
      })

      await databaseService.refreshTokens.insertOne(new RefreshToken({ user_id: user_id, token: refresh_token }))
      return {
        access_token,
        refresh_token,
        newUser: 0,
        verify: userInfo.verified_email
      }
    } else {
      // random password
      const random = Math.random().toString(36).substring(2, 15)
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password: random,
        confirm_password: random
      })

      // trong method register có xử lý sign token và lưu vào db
      return {
        ...data,
        newUser: 1,
        verify: UserVerifyStatus.Unverified
      }
    }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: userMessages.LOGOUT_SUCCESS
    }

    // RT sẽ lưu ở cookie - xóa ở cookie tại đây (client)
    // AT sẽ lưu ở localStorage - xóa ở fe (client)

    // Khi refresh_token hết hạn hay logout, server từ chối yêu cầu từ client (401) → client lúc này sẽ logout (xóa RT trong DB và đồng thời xóa cả AT và RT ở client) → login lại để được cấp lại AT và RT → tiếp tục.
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
      this.signAccessAndRefreshToken({
        user_id: user_id.toString(),
        verify: UserVerifyStatus.Verified
      }),
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
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )
    return {
      access_token,
      refresh_token
    }
  }

  // reset lại email-verify-token
  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerify({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
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

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPassword({
      user_id: user_id.toString(),
      verify: verify
    })
    // tạo token forgot password
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )

    // gửi email kèm đường link đến email người dùng: https://twitter/forgot-password?token=token
    console.log("forgot-password: ", forgot_password_token)
    return {
      message: userMessages.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }

  async resetPassword(user_id: string, password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          forgot_password_token: "",
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: userMessages.RESET_PASSWORD_IS_SUCCESS
    }
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          // lọc thuộc tính trả về // ko trả về password ...
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...(_payload as UpdateMeReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: "after", // cập nhật liền sau khi update (trên postman)
        projection: {
          // lọc thuộc tính trả về // ko trả về password ...
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username: username },
      {
        projection: {
          // lọc thuộc tính trả về // ko trả về password ...
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )
    if (user === null) {
      throw new ErrorWithStatus({ message: userMessages.USER_NOT_FOUND, status: httpStatus.NOTFOUND })
    }
    return user
  }

  async follow(user_id: string, followed_user_id: string) {
    const followed_user = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      follower_user_id: new ObjectId(followed_user_id)
    })
    // check xem đã follow chưa, nếu follow rồi thì không insert nữa, nếu chưa follow thì có thể insert
    if (followed_user === null) {
      await databaseService.followers.insertOne(
        new Followers({
          user_id: new ObjectId(user_id),
          follower_user_id: new ObjectId(followed_user_id)
        })
      )
      return {
        message: userMessages.FOLLOW_SUCCESS
      }
    }
    return {
      message: userMessages.FOLLOW_ALREADY
    }
  }

  async unfollow(user_id: string, followed_user_id: string) {
    const follow_user = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      follower_user_id: new ObjectId(followed_user_id)
    })
    // check xem đã unfollow chưa, nếu unfollow rồi thì không delete nữa, nếu chưa follow thì có thể delete
    if (follow_user !== null) {
      await databaseService.followers.deleteOne({
        user_id: new ObjectId(user_id),
        follower_user_id: new ObjectId(followed_user_id)
      })
      return {
        message: userMessages.UNFOLLOW_SUCCESS
      }
    }
    return {
      message: userMessages.UNFOLLOW_ALREADY
    }
  }

  async changePassword(user_id: string, password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: userMessages.CHANGE_PASSWORD_SUCCESS
    }
  }
}

const userService = new UserService()
export default userService
// nơi đây thực hiện các method logic xử lý db

// updateOne (chỉ update, ko trả về document)
// findOneAndUpdate (update, và trả về document)
// insertOne (trả về document)
// findOne (trả về document)
// deleteOne
