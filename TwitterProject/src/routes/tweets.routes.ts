import { Router } from "express"
import { createTweetController, getTweetChildrenController, getTweetController } from "~/controllers/tweets.controllers"
import { audienceValidator, createTweetValidator, getTweetChildrenValidator, tweetIdValidator } from "~/middlewares/tweet.middlewares"
import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from "~/middlewares/users.middlewares"
import { wrapRequestHandler } from "~/utils/handlers"

const tweetRouter = Router()

/**
 * Description: create tweet
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
 * Description: get tweet
 * Path: /
 * Method: GET
 * Header: {Authorization: Bearer <access_token>}
 */

tweetRouter.get(
  "/:tweet_id",
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator), // nếu user có login thì gửi AT, còn nếu không login thì bỏ qua
  isUserLoggedInValidator(verifiedUserValidator), // nếu user có login thì check Verify, còn nếu không login thì bỏ qua
  audienceValidator,
  wrapRequestHandler(getTweetController)
)

/**
 * Description: get tweet children
 * Path: /
 * Method: GET
 * Header: {Authorization: Bearer <access_token>}
 * Params: {limit: number, skip: number, tweet_type: TweetType}
 */

tweetRouter.get(
  "/:tweet_id/children",
  tweetIdValidator,
  getTweetChildrenValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
)

export default tweetRouter
