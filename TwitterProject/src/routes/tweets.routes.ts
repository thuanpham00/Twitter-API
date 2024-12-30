import { Router } from "express"
import { createTweetController } from "~/controllers/tweets.controllers"
import { createTweetValidator } from "~/middlewares/tweet.middlewares"
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares"
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

export default tweetRouter
