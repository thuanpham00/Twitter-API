import { Collection, Db, MongoClient } from "mongodb"
import dotenv from "dotenv"
import User from "~/models/schemas/User.schema"
import RefreshToken from "~/models/schemas/RefreshToken.schema"
import Followers from "~/models/schemas/Followers.schema"
import VideoStatus from "~/models/schemas/VideoStatus.schema"
import Tweet from "~/models/schemas/Tweet.schema"
import HashTag from "~/models/schemas/HashTags.schema"
import { BookmarkType } from "~/models/schemas/Bookmark.schema"
import { LikeType } from "~/models/schemas/Like.schema"
dotenv.config()

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter-api.a6fgn.mongodb.net/?retryWrites=true&w=majority&appName=twitter-api`

class DatabaseService {
  private client: MongoClient // TS phải khai báo kiểu dữ liệu trước
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME) // chọn database
  }

  // kết nối database
  // Ví dụ: databaseService.connect()
  // phương thức
  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log("Pinged your deployment. You successfully connected to MongoDB!")
    } catch (error) {
      console.log("Error: ", error)
      throw error
    }
  }

  // các thuộc tính này trong collection có khả năng query (find) -> nên gắn index
  async indexUsers() {
    const exists = await this.users.indexExists(["email_1_password_1", "email_1", "username_1"])
    if (!exists) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
    }
  }

  async indexRefreshToken() {
    const exists = await this.refreshTokens.indexExists(["token_1", "exp_1"])
    if (!exists) {
      this.refreshTokens.createIndex({ token: 1 })
      this.refreshTokens.createIndex(
        { exp: 1 },
        {
          expireAfterSeconds: 0 // expireAfterSeconds được sử dụng để tạo TTL (Time-To-Live) Index, cho phép tự động xóa các document sau một khoảng thời gian nhất định // xóa các token hết hạn
        }
      )
    }
  }

  async indexVideoStatus() {
    const exists = await this.videoStatus.indexExists(["name_1"])
    if (!exists) {
      this.videoStatus.createIndex({ name: 1 })
    }
  }

  async indexFollow() {
    const exists = await this.followers.indexExists(["user_id_1_follower_user_id_1"])
    if (!exists) {
      this.followers.createIndex({ user_id: 1, follower_user_id: 1 })
    }
  }

  async indexTweet() {
    const exists = await this.tweets.indexExists(["content_text"])
    if (!exists) {
      this.tweets.createIndex({ content: "text" }, { default_language: "none" })
    }
  }

  // get: giúp truy cập thuộc tính và xử lý logic và khi truy cập giá trị thì không cần gọi hàm
  // thuộc tính được định nghĩa dưới dạng getter
  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
  }

  get followers(): Collection<Followers> {
    return this.db.collection(process.env.DB_FOLLOWERS_COLLECTION as string)
  }

  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(process.env.DB_VIDEO_STATUS_COLLECTION as string)
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.DB_TWEET_COLLECTION as string)
  }

  get hashtags(): Collection<HashTag> {
    return this.db.collection(process.env.DB_HASHTAG_COLLECTION as string)
  }

  get bookmark(): Collection<BookmarkType> {
    return this.db.collection(process.env.DB_BOOKMARKS_COLLECTION as string)
  }

  get like(): Collection<LikeType> {
    return this.db.collection(process.env.DB_LIKES_COLLECTION as string)
  }
}

const databaseService = new DatabaseService()
export default databaseService
