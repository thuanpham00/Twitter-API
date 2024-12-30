import { ObjectId } from "mongodb"

export interface LikeType {
  _id?: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at?: Date
}

class Like {
  _id?: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at?: Date
  constructor(like: LikeType) {
    this._id = like._id || new ObjectId()
    this.user_id = like.user_id
    this.tweet_id = like.tweet_id
    this.created_at = like.created_at || new Date()
  }
}

export default Like
