import { Request, Response } from "express"
import path from "path"
import { upload_image_dir, upload_video_dir } from "~/constants/dir"
import httpStatus from "~/constants/httpStatus"
import mediaServices from "~/services/media.services"
import fs from "fs"

// chỉ mới dùng lại upload thôi chưa lưu DB
export const uploadImageController = async (req: Request, res: Response) => {
  const result = await mediaServices.uploadImage(req)
  return res.json({
    message: "Upload Success",
    result: result
  })
}

export const uploadVideoController = async (req: Request, res: Response) => {
  const result = await mediaServices.uploadVideo(req)
  return res.json({
    message: "Upload Success",
    result: result
  })
}

export const uploadVideoHLSController = async (req: Request, res: Response) => {
  const result = await mediaServices.uploadVideoHLS(req)
  return res.json({
    message: "Upload Success",
    result: result
  })
}

export const serveImageController = async (req: Request, res: Response) => {
  const { name } = req.params
  return res.sendFile(path.resolve(upload_image_dir, name), (err) => {
    if (err) {
      res.status((err as any).status).send("Not found")
    }
  })
}

export const serveM3u8Controller = async (req: Request, res: Response) => {
  const { id } = req.params
  return res.sendFile(path.resolve(upload_video_dir, id, "master.m3u8"), (err) => {
    if (err) {
      res.status((err as any).status).send("Not found")
    }
  })
}

export const serveSegmentController = async (req: Request, res: Response) => {
  // segment: 0.ts , 1.ts, 2.ts
  const { id, v, segment } = req.params
  return res.sendFile(path.resolve(upload_video_dir, id, v, segment), (err) => {
    if (err) {
      res.status((err as any).status).send("Not found")
    }
  })
}

export const serveVideoStreamController = async (req: Request, res: Response) => {
  // kỹ thuật streaming-video là chia nhỏ dữ liệu video để phát thay vì chờ load toàn bộ video
  const range = req.headers.range
  if (!range) {
    return res.status(httpStatus.BAD_REQUESTED).send("Requires Range Headers")
  }

  const { name } = req.params
  const videoPath = path.resolve(upload_video_dir, name)
  // 1MB = 10^6 bytes (Theo hệ 10, đây là thứ chúng ta thấy trên UI)
  // Còn theo nhị phân 1MB = 2^20 bytes (1024 x 1024)

  // dung lượng video (bytes)
  const videoSize = fs.statSync(videoPath).size
  // dung lượng video cho mỗi phân đoạn stream
  const chunkSize = 10 ** 6 // 1mb
  // lấy giá trị byte bắt đầu từ header Range (vd: bytes=1048576-)
  const start = Number(range.replace(/\D/g, ""))
  // lấy giá trị byte kết thúc, vượt quá dung lượng video thì lấy giá trị videoSize
  const end = Math.min(start + chunkSize, videoSize - 1)

  // dung lượng thực tế cho mỗi đoạn video steam
  // thường đây sẽ là chunkSize, ngoại trừ đoạn cuối cùng
  const contentLength = end - start + 1
  const mime = (await import("mime")).default
  const contentType = mime.getType(videoPath) || "video/*"

  /**
   * Format của header Content-Range: bytes <start>-<end>/<videoSize>
   * Ví dụ: Content-Range: bytes 1048576-3145727/3145728
   * Yêu cầu là `end` phải luôn luôn nhỏ hơn `videoSize`
   * ❌ 'Content-Range': 'bytes 0-100/100'
   * ✅ 'Content-Range': 'bytes 0-99/100'
   *
   * Còn Content-Length sẽ là end - start + 1. Đại diện cho khoản cách.
   * Để dễ hình dung, mọi người tưởng tượng từ số 0 đến số 10 thì ta có 11 số.
   * byte cũng tương tự, nếu start = 0, end = 10 thì ta có 11 byte.
   * Công thức là end - start + 1
   *
   * ChunkSize = 50
   * videoSize = 100
   * |0----------------50|51----------------99|100 (end)
   * stream 1: start = 0, end = 50, contentLength = 51
   * stream 2: start = 51, end = 99, contentLength = 49
   */

  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": `bytes`,
    "Content-Length": contentLength,
    "Content-Type": contentType
  }

  res.writeHead(httpStatus.PARTIAL_CONTENT, headers)
  const videoSteams = fs.createReadStream(videoPath, { start, end })
  videoSteams.pipe(res)
}
