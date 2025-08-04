import { ObjectId } from "mongodb"
import databaseService from "./database.services"

class ConversationService {
  async getConversations({
    sender_id,
    receiver_id,
    page,
    limit
  }: {
    sender_id: string
    receiver_id: string
    limit: number
    page: number
  }) {
    const [conversations, total] = await Promise.all([
      databaseService.conversation
        .find({
          $or: [
            {
              sender_id: new ObjectId(sender_id),
              receiver_id: new ObjectId(receiver_id)
            },
            {
              sender_id: new ObjectId(receiver_id),
              receiver_id: new ObjectId(sender_id)
            }
          ]
        })
        .skip(limit * (page - 1))
        .limit(limit)
        .toArray(),
      databaseService.conversation
        .find({
          $or: [
            {
              sender_id: new ObjectId(sender_id),
              receiver_id: new ObjectId(receiver_id)
            },
            {
              sender_id: new ObjectId(receiver_id),
              receiver_id: new ObjectId(sender_id)
            }
          ]
        })
        .toArray()
    ])

    return {
      conversations,
      total: total.length
    }
  }
}

const conversationService = new ConversationService()
export default conversationService
