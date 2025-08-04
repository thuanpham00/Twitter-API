import { Router } from "express"
import { getConversationsController } from "~/controllers/conversation.controllers"
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares"

const conversationRouter = Router()

conversationRouter.get(
  "/receivers/:receiverId",
  accessTokenValidator,
  verifiedUserValidator,
  getConversationsController
)

export default conversationRouter