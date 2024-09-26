import { createHash } from "crypto"
import { config } from "dotenv"
config() // dùng cho file .env

function sha256(content: string) {
  return createHash("sha256").update(content).digest("hex")
}

export function hashPassword(password: string) {
  return sha256(password + process.env.PASSWORD_SECRET) // mã hóa password 1 chiều
}
