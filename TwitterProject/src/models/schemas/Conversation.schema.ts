import { ObjectId } from "mongodb"

export interface ConversationType {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  content: string
  created_at?: Date
  updated_at?: Date
}

class Conversation {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  content: string
  created_at?: Date
  updated_at?: Date
  constructor(bookmark: ConversationType) {
    const date = new Date()
    this._id = bookmark._id || new ObjectId()
    this.sender_id = bookmark.sender_id
    this.receiver_id = bookmark.receiver_id
    this.content = bookmark.content
    this.created_at = bookmark.created_at || date
    this.updated_at = bookmark.updated_at || date
  }
}

export default Conversation
