import { ObjectId } from "mongodb"

interface HashTagType {
  _id?: ObjectId
  name: string
  created_at?: Date
}

class HashTag {
  _id?: ObjectId
  name: string
  created_at: Date
  constructor(hashTag: HashTagType) {
    this._id = hashTag._id || new ObjectId()
    this.name = hashTag.name
    this.created_at = hashTag.created_at || new Date()
  }
}

export default HashTag