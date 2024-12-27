import { ObjectId } from "mongodb"
import { EncodingStatus } from "~/constants/enum"

interface VideoStatusType {
  _id?: ObjectId
  name: string
  status: EncodingStatus
  message?: string
  created_at?: Date
  updated_at?: Date
}

class VideoStatus {
  _id?: ObjectId
  name: string
  status: EncodingStatus
  message?: string
  created_at: Date
  updated_at: Date
  constructor(video: VideoStatusType) {
    const date = new Date()
    this._id = video._id
    this.name = video.name
    this.status = video.status
    this.message = video.message || ""
    this.created_at = video.created_at || date
    this.updated_at = video.updated_at || date
  }
}

export default VideoStatus
