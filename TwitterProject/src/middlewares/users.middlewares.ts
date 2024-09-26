import { checkSchema } from "express-validator"
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
// dùng `express-validator`
// validate input phía server
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
      password: {
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
      },
      confirm_password: {
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
      },
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
      password: {
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
    },
    ["body"]
  ) // check validate trong phần body
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        notEmpty: {
          errorMessage: userMessages.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            // 'Bearer ewbuhfiewqfhgewqui'
            const accessToken = value.split(" ")[1]
            if (!accessToken) {
              throw new ErrorWithStatus({
                message: userMessages.ACCESS_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const decode_authorization = await verifyToken({ token: accessToken })
              ;(req as Request).decode_authorization = decode_authorization
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
        notEmpty: {
          errorMessage: userMessages.REFRESH_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            try {
              // const decode_authorization = await verifyToken({ token: value })
              // const refresh_token = await databaseService.refreshTokens.findOne({ token: value })
              const [decode_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value }),
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
              throw error
            }
            return true
          }
        }
      }
    },
    ["body"]
  )
)
