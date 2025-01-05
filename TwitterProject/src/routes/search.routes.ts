import { Router } from "express"
import { searchController } from "~/controllers/search.controllers"
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares"
import { wrapRequestHandler } from "~/utils/handlers"

export const searchRoute = Router()

searchRoute.get("/", accessTokenValidator, verifiedUserValidator, wrapRequestHandler(searchController))
