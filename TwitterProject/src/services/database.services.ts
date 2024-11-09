import { Collection, Db, MongoClient, ServerApiVersion } from "mongodb"
import dotenv from "dotenv"
import User from "~/models/schemas/User.schema"
import RefreshToken from "~/models/schemas/RefreshToken.schema"
import Followers from "~/models/schemas/Followers.schema"
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
}

const databaseService = new DatabaseService()
export default databaseService
