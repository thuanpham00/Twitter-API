import { Router } from "express"
import { searchController } from "~/controllers/search.controllers"
import { searchValidator } from "~/middlewares/search.middlewares"
import { paginationValidator } from "~/middlewares/tweet.middlewares"
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares"
import { wrapRequestHandler } from "~/utils/handlers"

export const searchRoute = Router()

searchRoute.get(
  "/",
  paginationValidator,
  searchValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(searchController)
)
