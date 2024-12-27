import { getNameImage, handleUploadImage, handleUploadVideo } from "~/utils/file"
import { Request } from "express"
import sharp from "sharp"
import { upload_image_dir } from "~/constants/dir"
import path from "path"
import fs from "fs"
import { isProduction } from "~/constants/config"
import { EncodingStatus, MediaType } from "~/constants/enum"
import { Media } from "~/constants/others"
import { encodeHLSWithMultipleVideoStreams } from "~/utils/video"
import databaseService from "./database.services"
import VideoStatus from "~/models/schemas/VideoStatus.schema"

class Queue {
  items: string[]
  encoding: boolean

  constructor() {
    this.items = []
    this.encoding = false
  }

  async enqueue(item: string) {
    this.items.push(item)
    // item = /uploads/video/1111345234/1111345234.mp4
    const idName = getNameImage(item.split("\\").pop() as string)
    await databaseService.videoStatus.insertOne(
      new VideoStatus({
        name: idName,
        status: EncodingStatus.Pending // vào hàng đợi
      })
    )
    this.processEncode()
  }

  async processEncode() {
    if (this.encoding) return
    if (this.items.length > 0) {
      this.encoding = true
      const videoPath = this.items[0]
      const idName = getNameImage(videoPath.split("\\").pop() as string)
      await databaseService.videoStatus.updateOne(
        { name: idName },
        {
          $set: {
            status: EncodingStatus.Processing // đang xử lý
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        this.items.shift() // xóa pt đầu tiên
        fs.unlinkSync(videoPath)
        await databaseService.videoStatus.updateOne(
          { name: idName },
          {
            $set: {
              status: EncodingStatus.Success // đang xử lý
            },
            $currentDate: {
              updated_at: true
            }
          }
        )
        console.log(`Encode video ${videoPath} success`)
      } catch (error) {
        await databaseService.videoStatus
          .updateOne(
            { name: idName },
            {
              $set: {
                status: EncodingStatus.Fail // đang xử lý
              },
              $currentDate: {
                updated_at: true
              }
            }
          )
          .catch((err) => {
            console.log(`update video status error`, err)
          })
        console.error(`Encode video ${videoPath} error`)
      }
      this.encoding = false
      this.processEncode()
    } else {
      console.log(`Encode video is empty`)
    }
  }
}

const queue = new Queue()

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
        queue.enqueue(file.filepath)
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

  async getVideoStatus(id: string) {
    const result = await databaseService.videoStatus.findOne({ name: id })
    return result
  }
}

const mediaServices = new MediaServices()
export default mediaServices
