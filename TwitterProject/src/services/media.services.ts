import { getNameImage, handleUploadImage, handleUploadVideo } from "~/utils/file"
import { Request } from "express"
import sharp from "sharp"
import { upload_image_dir } from "~/constants/dir"
import path from "path"
import fs from "fs"
import { isProduction } from "~/constants/config"
import { MediaType } from "~/constants/enum"
import { Media } from "~/constants/others"
import { encodeHLSWithMultipleVideoStreams } from "~/utils/video"

class MediaServices {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      // chuyển hình ảnh sang đuôi .jpeg (nhẹ hơn nhiều so với đuôi .png)
      files.map(async (file) => {
        const newName = getNameImage(file.newFilename)
        const newPath = path.resolve(upload_image_dir, `${newName}.jpg`)
        sharp.cache(false)
        await sharp(file.filepath).jpeg().toFile(newPath)
        fs.unlinkSync(file.filepath) // xóa file ảnh tạm
        // kiểm tra nếu dự án đang chạy trên môi trường production thì trả về URL domain còn môi trường dev (local) thì về localhost
        // trả về đường dẫn url hiển thị hình còn lưu trữ thì vẫn là uploads/...
        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newName}.jpg`
            : `http://localhost:4000/static/image/${newName}.jpg`,
          type: MediaType.Image
        }
      })
    )
    return result
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const { newFilename } = files[0]
    return {
      url: isProduction
        ? `${process.env.HOST}/static/video/${newFilename}`
        : `http://localhost:4000/static/video/${newFilename}`,
      type: MediaType.Video
    }
  }

  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        await encodeHLSWithMultipleVideoStreams(file.filepath)
        fs.unlinkSync(file.filepath)
        const newName = getNameImage(file.newFilename)

        return {
          url: isProduction
            ? `${process.env.HOST}/static/video-hls/${newName}/master.m3u8`
            : `http://localhost:4000/static/video-hls/${newName}/master.m3u8`,
          type: MediaType.HLS
        }
      })
    )
    return result
  }
}

const mediaServices = new MediaServices()
export default mediaServices
