import { Router } from "express"
import { bookmarkTweetController, unBookmarkTweetController } from "~/controllers/bookmarks.controllers"
import { bookmarkValidator, unBookmarkValidator } from "~/middlewares/bookmark.middlewares"
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares"
import { wrapRequestHandler } from "~/utils/handlers"

const bookmarkRoute = Router()

/**
 * Description: Bookmark Tweet
 * Path: /
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: {tweet_id: string}
 */
bookmarkRoute.post(
  "/",
  accessTokenValidator,
  verifiedUserValidator,
  bookmarkValidator,
  wrapRequestHandler(bookmarkTweetController)
)

/**
 * Description: UnBookmark Tweet
 * Path: /:tweet_id
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 */
bookmarkRoute.delete(
  "/tweets/:tweet_id",
  accessTokenValidator,
  verifiedUserValidator,
  unBookmarkValidator,
  wrapRequestHandler(unBookmarkTweetController)
)

export default bookmarkRoute
