import express from "express"
import userRouter from "./routes/users.routes"
import databaseService from "./services/database.services"
import { defaultErrorHandler } from "./middlewares/error.middlewares"

const app = express()
const port = 4000

app.use(express.json()) // chuyển json sang thành obj
app.use("/users", userRouter)

databaseService.connect()

// khi app lỗi nó sẽ nhảy vào middleware này
app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// nó ưu tiên chạy các middleware trước
// rồi mới chạy định tuyến route
// vào route - chạy vào `middleware` để xủ lý "test" các yêu cầu input // nếu không thoa man thì báo lỗi or nếu không lỗi thì next() -> rồi mới chạy `controller` nơi xử lý logic của route -> rồi vào service để xử lý các method của db -> rồi quay về controller trả ra kết quả
