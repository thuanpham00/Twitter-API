import { ObjectId } from "mongodb"

interface FollowersSchema {
  _id?: ObjectId
  follower_user_id: ObjectId
  create_at?: Date
  user_id: ObjectId
}

export default class Followers {
  _id?: ObjectId
  follower_user_id: ObjectId
  create_at: Date
  user_id: ObjectId
  constructor(followers: FollowersSchema) {
    this._id = followers._id
    this.follower_user_id = followers.follower_user_id
    this.create_at = followers.create_at || new Date()
    this.user_id = followers.user_id
  }
}
