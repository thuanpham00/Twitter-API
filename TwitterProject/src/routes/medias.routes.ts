import { Router } from "express"
import { uploadImageController, uploadVideoController, uploadVideoHLSController } from "~/controllers/medias.controllers"
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares"
import { wrapRequestHandler } from "~/utils/handlers"

// xử lý các api liên quan tới image, video
const mediaRouter = Router()

mediaRouter.post(
  "/upload-image",
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadImageController)
)

mediaRouter.post(
  "/upload-video",
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadVideoController)
)

mediaRouter.post(
  "/upload-video-hls",
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadVideoHLSController)
)

export default mediaRouter
