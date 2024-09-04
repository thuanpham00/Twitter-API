import { Request, Response, NextFunction } from "express"
import { checkSchema } from "express-validator"
import { validate } from "~/utils/validations"

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({
      error: "Missing email or password"
    })
  }
  next() // không lỗi thì chạy tiếp đến middleware
}

// dùng `express-validator`
// validate input phía server
export const registerValidator = validate(
  checkSchema({
    name: {
      isLength: {
        options: {
          min: 1,
          max: 100
        }
      },
      notEmpty: true, // không rỗng,
      isString: true,
      trim: true // lọc bỏ khoảng trắng
    },
    email: {
      isEmail: true,
      notEmpty: true, // không rỗng
      trim: true
    },
    password: {
      notEmpty: true,
      isLength: {
        options: {
          min: 6,
          max: 50
        }
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
        errorMessage:
          "Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol"
      }
    },
    confirm_password: {
      notEmpty: true,
      isLength: {
        options: {
          min: 6,
          max: 50
        }
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
        errorMessage:
          "Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol"
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error("Password confirmation does not match password")
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
        }
      } // new Date().toISOString()
    }
  })
)
