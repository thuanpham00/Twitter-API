import { config } from "dotenv"
import { ObjectId } from "mongodb"
config()

interface RefreshTokenType {
  _id?: ObjectId
  token: string
  create_at?: Date
  user_id: ObjectId
}

export default class RefreshToken {
  _id?: ObjectId
  token: string
  create_at: Date
  user_id: ObjectId
  constructor({ _id, token, create_at, user_id }: RefreshTokenType) {
    // người dùng nhập
    this._id = _id
    this.token = token
    this.create_at = create_at || new Date() // có cũng dc, ko có thì new Date() do có ?
    this.user_id = user_id
  }
}
