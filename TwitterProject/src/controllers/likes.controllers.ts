import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { LIKE_MESSAGES } from "~/constants/message"
import { BookMarkReqBody } from "~/models/requests/Tweet.requests"
import { TokenPayload } from "~/models/requests/User.requests"
import likeServices from "~/services/like.services"

export const likeTweetController = async (req: Request<ParamsDictionary, any, BookMarkReqBody>, res: Response) => {
  const { tweet_id } = req.body
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await likeServices.likeTweet(tweet_id, user_id)
  return res.json({
    message: LIKE_MESSAGES.LIKE_SUCCESSFULLY,
    result: result
  })
}

export const unLikeTweetController = async (req: Request, res: Response) => {
  const { tweet_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await likeServices.unLikeTweet(tweet_id, user_id)
  return res.json({
    message: LIKE_MESSAGES.UNLIKE_SUCCESSFULLY,
    result: result
  })
}
