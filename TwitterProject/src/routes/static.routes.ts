import { Router } from "express"
import {
  serveImageController,
  serveVideoStreamController,
  serveM3u8Controller,
  serveSegmentController
} from "~/controllers/medias.controllers"
import { wrapRequestHandler } from "~/utils/handlers"

// xử lý các api liên quan tới hiển thị hình ảnh (serve static file)
const staticRouter = Router()

staticRouter.get("/image/:name", wrapRequestHandler(serveImageController))

// vẫn là kiểu stream truyền thống nhưng được chia nhỏ video ra và load dần
staticRouter.get("/video-stream/:name", wrapRequestHandler(serveVideoStreamController))

// stream HLS
staticRouter.get("/video-hls/:id/master.m3u8", wrapRequestHandler(serveM3u8Controller))

staticRouter.get("/video-hls/:id/:v/:segment", wrapRequestHandler(serveSegmentController))

export default staticRouter
