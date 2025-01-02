import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { TweetReqBody } from "~/models/requests/Tweet.requests"
import { TokenPayload } from "~/models/requests/User.requests"
import tweetServices from "~/services/tweet.services"

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await tweetServices.createTweet(req.body, user_id)
  return res.json({
    message: "Create tweet success",
    result: result
  })
}

export const getTweetController = async (req: Request, res: Response) => {
  return res.json({
    message: "Create tweet success",
    result: "Ok"
  })
}
