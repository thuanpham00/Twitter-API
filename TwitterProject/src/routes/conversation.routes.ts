import { Router } from "express"
import { getConversationsController } from "~/controllers/conversation.controllers"
import { paginationValidator } from "~/middlewares/tweet.middlewares"
import { accessTokenValidator, getConversationValidator, verifiedUserValidator } from "~/middlewares/users.middlewares"
import { wrapRequestHandler } from "~/utils/handlers"

const conversationRouter = Router()

conversationRouter.get(
  "/receivers/:receiverId",
  accessTokenValidator,
  verifiedUserValidator,
  getConversationValidator,
  paginationValidator,
  wrapRequestHandler(getConversationsController)
)

export default conversationRouter
