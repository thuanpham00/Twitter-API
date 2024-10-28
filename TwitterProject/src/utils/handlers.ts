import { Request, Response, NextFunction, RequestHandler } from "express"

export const wrapRequestHandler = <P>(func: RequestHandler<P>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error) // error handler tiếp theo
    }
  }
}

// Mong muốn nhận vào là: Request<{username: string}>
// thực nhận là : Request<{[key: string]: string}>