import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { Pagination, TweetParams, TweetQuery, TweetReqBody } from "~/models/requests/Tweet.requests"
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
  const { tweet_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await tweetServices.increaseView(tweet_id, user_id)
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views,
    updated_at: result.updated_at
  }
  return res.json({
    message: "Get tweet success",
    result: tweet
  })
}

export const getTweetChildrenController = async (req: Request<TweetParams, any, any, TweetQuery>, res: Response) => {
  const { tweet_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const tweet_type = Number(req.query.tweet_type)
  const { tweets, total } = await tweetServices.getTweetChildren({ tweet_id, limit, page, tweet_type, user_id })

  return res.json({
    message: "Get tweet children success",
    result: {
      tweets: tweets,
      tweet_type,
      limit,
      page,
      total_page: Math.ceil(total / limit) // làm tròn lên
    }
  })
}

export const getNewFeedsController = async (req: Request<ParamsDictionary, any, any, Pagination>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const { tweets, total } = await tweetServices.getNewFeed({ user_id, limit, page })
  return res.json({
    message: "Get new feeds success",
    result: {
      tweets: tweets,
      limit,
      page,
      total_page: Math.ceil(total / limit) // làm tròn lên
    }
  })
}
