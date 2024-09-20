const httpStatus = {
  OK: 200,
  CREATED: 201,
  UNPROCESSABLE_ENTITY: 422,
  UNAUTHORIZED: 401,
  NOTFOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const

export default httpStatus
