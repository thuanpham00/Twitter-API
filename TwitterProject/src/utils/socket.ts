import { Server } from "socket.io"
import { verifyAccessToken } from "./commons"
import { TokenPayload } from "~/models/requests/User.requests"
import { UserVerifyStatus } from "~/constants/enum"
import { ErrorWithStatus } from "~/models/Errors"
import { userMessages } from "~/constants/message"
import httpStatus from "~/constants/httpStatus"
import Conversation from "~/models/schemas/Conversation.schema"
import { ObjectId } from "mongodb"
import databaseService from "~/services/database.services"
import { Server as ServerHttp } from "http"

export const initialSocket = (httpServer: ServerHttp) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000"
    }
  }) // server instance io

  // connection và disconnect là sự kiện mặc định ở server (Socket.IO)
  const users: {
    [key: string]: {
      socket_id: string
    }
  } = {}

  // middleware cấp server Socket.IO, chạy mỗi khi client bắt đầu handshake/kết nối tới server (ngay trước khi sự kiện connection xảy ra). - chạy 1 lần (cho 1 lần kết nối)
  io.use(async (socket, next) => {
    const { Authorization } = socket.handshake.auth // user_id người gửi
    const access_token = Authorization?.split(" ")[1]
    try {
      const decode_authorization = await verifyAccessToken(access_token)
      const { verify } = decode_authorization as TokenPayload
      if (verify !== UserVerifyStatus.Verified) {
        throw new ErrorWithStatus({
          message: userMessages.USER_NOT_VERIFIED,
          status: httpStatus.FORBIDDEN
        })
      }
      // truyền decoded_authorization vào socket để sử dụng ở các middleware khác
      socket.handshake.auth.decode_authorization = decode_authorization
      socket.handshake.auth.access_token = access_token
      next()
    } catch (error) {
      next({
        message: "Unauthorized",
        name: "UnauthorizedError",
        data: error
      }) // đúng kiểu dữ liệu mặc định của io.use
    }
  })

  io.on("connection", (socket) => {
    console.log(`user ${socket.id} connected`)
    const { user_id } = socket.handshake.auth.decode_authorization as TokenPayload // user_id người gửi
    users[user_id] = {
      socket_id: socket.id
    }

    socket.on("disconnect", () => {
      delete users[user_id]
      console.log(`user ${socket.id} disconnect`)
    })

    // middleware cấp socket - chạy liên tục (còn cấp server chạy 1 lần trước khi connection)
    socket.use(async (packet, next) => {
      const { access_token } = socket.handshake.auth
      try {
        await verifyAccessToken(access_token)
        next()
      } catch (error) {
        next(new Error("Unauthorized")) // nếu lỗi nó bắt xuống sự kiện error bên dưới
      }
    }) // socket instance

    // lắng nghe lỗi ở trên
    socket.on("error", (error) => {
      if (error.message === "Unauthorized") {
        socket.disconnect()
      }
    })

    socket.on("send_message", async (data) => {
      const { sender_id, receiver_id, content } = data.payload
      const conversation = new Conversation({
        sender_id: new ObjectId(sender_id),
        receiver_id: new ObjectId(receiver_id),
        content: content
      })
      const result = await databaseService.conversation.insertOne(conversation)
      conversation._id = result.insertedId

      const receiver_socket_id = users[receiver_id]?.socket_id // lấy ra socket id của người nhận
      socket.to(receiver_socket_id).emit("receive_message", {
        payload: conversation
      })
    })

    // socket.on("hello", (arg) => {
    //   console.log(arg)
    // })

    // socket.emit("hi", { message: `Xin chào ${socket.id} đã kết nối thành công` })
  }) // instance socket (io > (lớn hơn) socket)
}
