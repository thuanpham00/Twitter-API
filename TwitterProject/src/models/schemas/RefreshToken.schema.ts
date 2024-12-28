import { config } from "dotenv"
import { ObjectId } from "mongodb"
config()

interface RefreshTokenType {
  _id?: ObjectId
  token: string
  create_at?: Date
  user_id: ObjectId
  iat: number
  exp: number
}

export default class RefreshToken {
  _id?: ObjectId
  token: string
  create_at: Date
  user_id: ObjectId
  iat: Date
  exp: Date
  constructor({ _id, token, create_at, user_id, exp, iat }: RefreshTokenType) {
    // người dùng nhập
    this._id = _id
    this.token = token
    this.create_at = create_at || new Date() // có cũng dc, ko có thì new Date() do có ?
    this.user_id = user_id
    this.iat =  new Date(iat * 1000)
    this.exp =  new Date(exp * 1000) // convert Epoch time to Date
  }
}
