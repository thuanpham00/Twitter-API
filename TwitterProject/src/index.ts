import express from "express"
import userRouter from "./routes/users.routes"
import databaseService from "./services/database.services"
import { defaultErrorHandler } from "./middlewares/error.middlewares"
import mediaRouter from "./routes/medias.routes"
import { initFolder } from "./utils/file"
import { config } from "dotenv"
import { upload_video_dir } from "./constants/dir"
import staticRouter from "./routes/static.routes"
import cors from "cors"
import tweetRouter from "./routes/tweets.routes"
import bookmarkRoute from "./routes/bookmark.routes"
import likeRoute from "./routes/like.routes"
import { searchRoute } from "./routes/search.routes"
import { rateLimit } from "express-rate-limit"
import "~/utils/s3"
import { createServer } from "http"
import conversationRouter from "./routes/conversation.routes"
import { initialSocket } from "./utils/socket"
// import "~/utils/fake"
config()

// giới hạn số lượng request với rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes). // mỗi IP 100 request cho 15 phút
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56 // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
})

const app = express()
const httpServer = createServer(app)
const port = 4000
app.use(limiter)
app.use(cors())

app.use(express.json()) // chuyển json sang thành obj
app.use("/users", userRouter)
app.use("/medias", mediaRouter)
app.use("/static", staticRouter)
app.use("/static/video", express.static(upload_video_dir))
app.use("/bookmarks", bookmarkRoute)
app.use("/likes", likeRoute)
app.use("/tweets", tweetRouter)
app.use("/search", searchRoute)
app.use("/conversations", conversationRouter)

databaseService.connect().then(() => {
  databaseService.indexUsers() // tạo index trong MongoDB
  databaseService.indexRefreshToken()
  databaseService.indexVideoStatus()
  databaseService.indexFollow()
  databaseService.indexTweet()
})
initFolder() // check và tạo folder

// khi app lỗi nó sẽ nhảy vào middleware này
app.use(defaultErrorHandler)

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })

initialSocket(httpServer)

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// nó ưu tiên chạy các middleware trước
// rồi mới chạy định tuyến route
// vào route - chạy vào `middleware` để xủ lý "test" các yêu cầu input // nếu không thoa man thì báo lỗi or nếu không lỗi thì next() -> rồi mới chạy `controller` nơi xử lý logic của route -> rồi vào service để xử lý các method của db -> rồi quay về controller trả ra kết quả

// const mongoClient = new MongoClient(
//   `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter-api.a6fgn.mongodb.net/?retryWrites=true&w=majority&appName=twitter-api`
// )

// const db = mongoClient.db("earth")

// const users = db.collection("users")

// async function addEmptyAddressField() {
//   try {
//     // Kết nối tới MongoDB
//     await mongoClient.connect();
//     console.log("Kết nối MongoDB thành công!");

//     // Thêm trường 'address' với giá trị rỗng
//     const result = await users.updateMany({}, { $set: { address: "No field" } });

//     // Kết quả
//     console.log(`Đã thêm trường 'address' với giá trị rỗng vào ${result.modifiedCount} document.`);
//   } catch (err) {
//     console.error("Lỗi khi cập nhật document:", err);
//   } finally {
//     // Đóng kết nối
//     await mongoClient.close();
//     console.log("Đã đóng kết nối MongoDB.");
//   }
// }

// // Gọi hàm để thực thi
// addEmptyAddressField();

// const userData = []

// function getRandomNumber() {
//   return Math.floor(Math.random() * 100) + 1
// }

// for (let i = 0; i < 1000; i++) {
//   userData.push({
//     name: "user" + (i + 1),
//     age: getRandomNumber(),
//     sex: i % 2 === 0 ? "Male" : "Female"
//   })
// }

// users.insertMany(userData)
