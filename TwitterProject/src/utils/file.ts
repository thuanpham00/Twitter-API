import fs from "fs"
import { Request } from "express"
import { File } from "formidable"
import { upload_image_temp_dir, upload_video_dir, upload_video_temp_dir } from "~/constants/dir"

// khởi tạo folder nếu chưa có
export const initFolder = () => {
  if (!fs.existsSync(upload_image_temp_dir) || !fs.existsSync(upload_video_temp_dir)) {
    fs.mkdirSync(upload_image_temp_dir, {
      recursive: true // tạo folder nested
    })
    fs.mkdirSync(upload_video_temp_dir, {
      recursive: true // tạo folder nested
    })
  }
}

export const handleUploadImage = async (req: Request) => {
  // do formidable v3 sử dụng ESModule mà dự án dùng commonJS nên cần chuyển formidable v3 sang commonJS để biên dịch chính xác
  const formidable = (await import("formidable")).default
  const form = formidable({
    uploadDir: upload_image_temp_dir, // đường dẫn trỏ tới thư mục lưu
    maxFiles: 4, // up tối đa 4 file
    keepExtensions: true, // hiển thị đuôi file mở rộng
    maxFileSize: 300 * 1024, // 300KB
    maxTotalFileSize: 300 * 1024 * 4,
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === "image" && Boolean(mimetype?.includes("image/"))

      // filter chỉ upload được hình ảnh
      if (!valid) {
        form.emit("error" as any, new Error("File type is not valid") as any)
      }

      return valid
    }
  })
  // tạo promise và trả về
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // check nếu file rỗng
      if (!Boolean(files.image)) {
        return reject(new Error("File is empty"))
      }
      resolve(files.image as File[])
    })
  })
}

export const handleUploadVideo = async (req: Request) => {
  // do formidable v3 sử dụng ESModule mà dự án dùng commonJS nên cần chuyển formidable v3 sang commonJS để biên dịch chính xác
  const formidable = (await import("formidable")).default
  const form = formidable({
    uploadDir: upload_video_dir, // đường dẫn trỏ tới thư mục lưu
    maxFiles: 1, // up tối đa 4 file
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === "video" && Boolean(mimetype?.includes("mp4") || mimetype?.includes("quicktime"))
      if (!valid) {
        form.emit("error" as any, new Error("File type is not valid") as any)
      }
      return true
    }
  })
  // tạo promise và trả về để services có thể dùng async await bắt promise trả kết quả
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // check nếu file rỗng
      if (!Boolean(files.video)) {
        return reject(new Error("File is empty"))
      }
      const videos = files.video as File[]
      videos.forEach((video) => {
        const ext = getExtension(video.originalFilename as string)
        fs.renameSync(video.filepath, video.filepath + "." + ext)
        video.newFilename = video.newFilename + "." + ext
      })
      resolve(files.video as File[])
    })
  })
}

export const getNameImage = (file: string) => {
  return file.split(".")[0]
}

export const getExtension = (file: string) => {
  const data = file.split(".")
  return data[data.length - 1]
}
