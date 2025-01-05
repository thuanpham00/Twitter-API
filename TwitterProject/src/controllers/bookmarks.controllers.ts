import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { BOOKMARK_MESSAGES } from "~/constants/message"
import { BookMarkReqBody } from "~/models/requests/Tweet.requests"
import { TokenPayload } from "~/models/requests/User.requests"
import bookmarkServices from "~/services/bookmark.services"

export const bookmarkTweetController = async (req: Request<ParamsDictionary, any, BookMarkReqBody>, res: Response) => {
  const { tweet_id } = req.body
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await bookmarkServices.bookmarkTweet(tweet_id, user_id)
  return res.json({
    message: BOOKMARK_MESSAGES.BOOKMARK_SUCCESSFULLY,
    result: result
  })
}

export const unBookmarkTweetController = async (req: Request, res: Response) => {
  const { tweet_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await bookmarkServices.unBookmarkTweet(tweet_id, user_id)
  return res.json({
    message: BOOKMARK_MESSAGES.UNBOOKMARK_SUCCESSFULLY,
    result: result
  })
}
