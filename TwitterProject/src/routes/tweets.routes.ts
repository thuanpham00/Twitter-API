import { Router } from "express"
import {
  createTweetController,
  getNewFeedsController,
  getTweetChildrenController,
  getTweetController
} from "~/controllers/tweets.controllers"
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  paginationValidator,
  tweetIdValidator
} from "~/middlewares/tweet.middlewares"
import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from "~/middlewares/users.middlewares"
import { wrapRequestHandler } from "~/utils/handlers"

const tweetRouter = Router()

/**
 * Description: create tweet - tạo 1 tweet
 * Path: /
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: TweetReqBody
 */

tweetRouter.post(
  "/",
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator, // validate các input gửi lên
  wrapRequestHandler(createTweetController)
)

/**
 * Description: get tweet - xem 1 tweet
 * Path: /
 * Method: GET
 * Header: {Authorization: Bearer <access_token>}
 */

tweetRouter.get(
  "/:tweet_id",
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator), // nếu user có login thì gửi AT, còn nếu không login thì bỏ qua
  isUserLoggedInValidator(verifiedUserValidator), // nếu user có login thì check Verify, còn nếu không login thì bỏ qua
  audienceValidator, // check có được xem tweet này không nếu tweet thuộc Twitter_Circle
  wrapRequestHandler(getTweetController)
)

/**
 * Description: get tweet children - xem các tweet con (retweet, comment, quote)
 * Path: /
 * Method: GET
 * Header: {Authorization: Bearer <access_token>}
 * Params: {limit: number, skip: number, tweet_type: TweetType}
 */

tweetRouter.get(
  "/:tweet_id/children",
  tweetIdValidator,
  paginationValidator,
  getTweetChildrenValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
)

/**
 * Description: get new feeds - xem các tweet mà user đó đã follower (người khác)
 * Path: /new-feeds
 * Method: GET
 * Header: {Authorization: Bearer <access_token>}
 * Params: {limit: number, skip: number}
 */

tweetRouter.get(
  "/",
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getNewFeedsController)
)

export default tweetRouter
