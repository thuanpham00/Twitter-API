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

staticRouter.get("/video-stream/:name", wrapRequestHandler(serveVideoStreamController))

staticRouter.get("/video-hls/:id/master.m3u8", wrapRequestHandler(serveM3u8Controller))

staticRouter.get("/video-hls/:id/:v/:segment", wrapRequestHandler(serveSegmentController))

export default staticRouter
