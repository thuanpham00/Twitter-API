import { Collection, Db, MongoClient, ServerApiVersion } from "mongodb"
import dotenv from "dotenv"
import User from "~/models/schemas/User.schema"
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
  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }
}

const databaseService = new DatabaseService()
export default databaseService