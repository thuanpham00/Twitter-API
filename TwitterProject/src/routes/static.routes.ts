import { Router } from "express"
import { serveImageController, serveVideoStreamController } from "~/controllers/medias.controllers"
import { wrapRequestHandler } from "~/utils/handlers"

// xử lý các api liên quan tới hiển thị hình ảnh (serve static file)
const staticRouter = Router()

staticRouter.get("/image/:name", wrapRequestHandler(serveImageController))

staticRouter.get("/video-stream/:name", wrapRequestHandler(serveVideoStreamController))

export default staticRouter
