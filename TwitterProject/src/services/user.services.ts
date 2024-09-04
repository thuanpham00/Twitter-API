import User from "~/models/schemas/User.schema"
import databaseService from "./database.services"

class UserService {
  async register(payload: { email: string; password: string }) {
    const { email, password } = payload
    const result = await databaseService.users.insertOne(new User({ email, password })) // await đợi 1 kết quả trả về từ 'promise'
    return result
  }
}

const userService = new UserService()
export default userService
// nơi đây thực hiện các method logic xử lý db