import { Request, Response } from "express"
import { TokenPayload } from "~/models/requests/User.requests"
import conversationService from "~/services/conversation.services"
import { GetConversationParams } from "~/models/requests/Conversation.requests"

export const getConversationsController = async (req: Request<GetConversationParams>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { receiverId } = req.params
  const { limit, page } = req.query
  const result = await conversationService.getConversations({
    sender_id: user_id,
    receiver_id: receiverId,
    limit: Number(limit),
    page: Number(page)
  })
  return res.json({
    result: {
      limit: Number(limit),
      page: Number(page),
      total_page: Math.ceil(result.total / Number(limit)),
      conversation: result.conversations
    },
    message: "Get conversations successfully"
  })
}
