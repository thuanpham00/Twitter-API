import { checkSchema, ParamSchema } from "express-validator"
import { JsonWebTokenError } from "jsonwebtoken"
import httpStatus from "~/constants/httpStatus"
import { userMessages } from "~/constants/message"
import { ErrorWithStatus } from "~/models/Errors"
import databaseService from "~/services/database.services"
import userService from "~/services/user.services"
import { verifyToken } from "~/utils/jwt"
import { hashPassword } from "~/utils/scripto"
import { validate } from "~/utils/validations"
import { Request } from "express"
import { ObjectId } from "mongodb"
// dùng `express-validator`
// validate input phía server

const passwordSchema: ParamSchema = {
  isString: {
    errorMessage: userMessages.PASSWORD_MUST_BE_A_STRING
  },
  notEmpty: { errorMessage: userMessages.PASSWORD_IS_REQUIRED },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: userMessages.PASSWORD_LENGTH
  },
  isStrongPassword: {
    // độ mạnh password
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minSymbols: 1,
      minNumbers: 1
    },
    errorMessage: userMessages.PASSWORD_STRONG
  }
}

const confirmPasswordSchema: ParamSchema = {
  isString: {
    errorMessage: userMessages.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  notEmpty: {
    errorMessage: userMessages.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: userMessages.CONFIRM_PASSWORD_LENGTH
  },
  isStrongPassword: {
    // độ mạnh password
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minSymbols: 1,
      minNumbers: 1
    },
    errorMessage: userMessages.CONFIRM_PASSWORD_STRONG
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(userMessages.CONFIRM_PASSWORD_NOT_MATCH)
      }
      return true
    }
  }
}

const forgotPasswordSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          message: userMessages.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: httpStatus.UNAUTHORIZED
        })
      }
      try {
        const decode_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: process.env.JWT_FORGOT_PASSWORD_SECRET as string
        })
        const user = await databaseService.users.findOne({
          _id: new ObjectId(decode_forgot_password_token.user_id)
        })
        if (user === null) {
          throw new ErrorWithStatus({
            message: userMessages.USER_NOT_FOUND,
            status: httpStatus.NOTFOUND
          })
        }
        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: userMessages.FORGOT_PASSWORD_TOKEN_IS_INVALID,
            status: httpStatus.UNAUTHORIZED
          })
        }
        ;(req as Request).decode_forgot_password_token = decode_forgot_password_token
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: error.message,
            status: httpStatus.UNAUTHORIZED
          })
        }
        throw error
      }
      return true
    }
  }
}

export const registerValidator = validate(
  checkSchema(
    {
      name: {
        isLength: {
          options: {
            min: 1,
            max: 100
          },
          errorMessage: userMessages.NAME_LENGTH
        },
        notEmpty: {
          errorMessage: userMessages.NAME_IS_REQUIRED
        }, // không rỗng,
        isString: {
          errorMessage: userMessages.NAME_MUST_BE_A_STRING
        },
        trim: true // lọc bỏ khoảng trắng
      },
      email: {
        isEmail: {
          errorMessage: userMessages.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value) => {
            const isExistEmail = await userService.checkEmailExits(value)
            if (isExistEmail) {
              throw new Error(userMessages.EMAIL_ALREADY_EXISTS)
              // throw new ErrorWithStatus({ message: "Email already exists", status: 401 })
            }
            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      date_of_birth: {
        isISO8601: {
          options: {
            strict: true, // yc tuân thủ chuẩn iso 8601
            strictSeparator: true // yc dấu phân cách "-" giữa ngày tháng năm của date (2024-01-01)
          },
          errorMessage: userMessages.DATE_OF_BIRTH_MUST_BE_STRING
        } // new Date().toISOString()
      }
    },
    ["body"]
  ) // check validate trong phần body
)

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: userMessages.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (user === null) {
              throw new Error(userMessages.EMAIL_OR_PASSWORD_IS_INCORRECT)
              // throw new ErrorWithStatus({ message: "Email already exists", status: 401 })
            }
            // nếu tìm thấy user -> controller xử lý tiếp
            req.user = user
            return true
          }
        }
      },
      password: passwordSchema
    },
    ["body"]
  ) // check validate trong phần body
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value: string, { req }) => {
            // 'Bearer ewbuhfiewqfhgewqui'
            // kiểm tra có AT không
            // verify ngược lại
            const accessToken = (value || "").split(" ")[1]
            if (!accessToken) {
              throw new ErrorWithStatus({
                message: userMessages.ACCESS_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const decode_authorization = await verifyToken({
                token: accessToken,
                secretOrPublicKey: process.env.JWT_ACCESS_TOKEN_SECRET as string
              })
              ;(req as Request).decode_authorization = decode_authorization // chứa user_id
            } catch (error) {
              throw new ErrorWithStatus({
                message: (error as JsonWebTokenError).message,
                status: httpStatus.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ["headers"]
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: userMessages.REFRESH_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              // const decode_authorization = await verifyToken({ token: value })
              // const refresh_token = await databaseService.refreshTokens.findOne({ token: value })
              const [decode_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_REFRESH_TOKEN_SECRET as string }),
                databaseService.refreshTokens.findOne({ token: value })
              ])
              ;(req as Request).decode_refresh_token = decode_refresh_token
              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: userMessages.REFRESH_TOKEN_USED_OR_NOT_EXISTS,
                  status: httpStatus.UNAUTHORIZED
                })
              }
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: error.message,
                  status: httpStatus.UNAUTHORIZED
                })
              }
              throw error // có tác dụng truyền tiếp lỗi lên các lớp trên của ứng dụng nếu lỗi không thuộc loại JsonWebTokenError
            }
            return true
          }
        }
      }
    },
    ["body"]
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: userMessages.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const decode_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_VERIFY_EMAIL_SECRET as string
              })
              ;(req as Request).decode_email_verify_token = decode_email_verify_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: error.message,
                  status: httpStatus.UNAUTHORIZED
                })
              }
              throw error // có tác dụng truyền tiếp lỗi lên các lớp trên của ứng dụng nếu lỗi không thuộc loại JsonWebTokenError
            }
            return true
          }
        }
      }
    },
    ["body"]
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: userMessages.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value
            })
            if (user === null) {
              throw new Error(userMessages.USER_NOT_FOUND)
            }
            // nếu tìm thấy user -> controller xử lý tiếp
            req.user = user
            return true
          }
        }
      }
    },
    ["body"]
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordSchema
    },
    ["body"]
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      forgot_password_token: forgotPasswordSchema
    },
    ["body"]
  )
)
