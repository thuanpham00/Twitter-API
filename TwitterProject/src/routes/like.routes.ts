import { Router } from "express"
import { likeTweetController, unLikeTweetController } from "~/controllers/likes.controllers"
import { likeValidator, unLikeValidator } from "~/middlewares/like.middlewares"
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares"
import { wrapRequestHandler } from "~/utils/handlers"

const likeRoute = Router()

/**
 * Description: likeRoute Tweet
 * Path: /
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: {tweet_id: string}
 */
likeRoute.post("/", accessTokenValidator, verifiedUserValidator, likeValidator, wrapRequestHandler(likeTweetController))

/**
 * Description: unLikeRoute Tweet
 * Path: /:tweet_id
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 */
likeRoute.delete(
  "/tweets/:tweet_id",
  accessTokenValidator,
  verifiedUserValidator,
  unLikeValidator,
  wrapRequestHandler(unLikeTweetController)
)

export default likeRoute
