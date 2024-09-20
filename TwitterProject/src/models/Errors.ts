import httpStatus from "~/constants/httpStatus"
import { userMessages } from "~/constants/message"

type ErrorsType = Record<
  string,
  {
    msg: string
    [key: string]: any
  }
> // [key:string]: {}

/**
 * errors: {
    [field: string]: {
      msg: string
      [key: string]: any
    }
  }
 */

export class ErrorWithStatus {
  message: string
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorsType
  constructor({ message = userMessages.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorsType }) {
    super({ message, status: httpStatus.UNPROCESSABLE_ENTITY }) //super() được dùng để gọi hàm khởi tạo của class cha, đảm bảo rằng các thuộc tính từ class cha được khởi tạo đúng cách.
    this.errors = errors
  }
}
