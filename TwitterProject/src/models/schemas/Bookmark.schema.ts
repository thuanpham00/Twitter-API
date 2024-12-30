import { ObjectId } from "mongodb"

export interface BookmarkType {
  _id?: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at?: Date
}

class BockMark {
  _id?: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at?: Date
  constructor(bookmark: BookmarkType) {
    this._id = bookmark._id || new ObjectId()
    this.user_id = bookmark.user_id
    this.tweet_id = bookmark.tweet_id
    this.created_at = bookmark.created_at || new Date()
  }
}

export default BockMark
