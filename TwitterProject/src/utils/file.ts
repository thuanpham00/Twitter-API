import fs from "fs"
import { Request } from "express"
import { File } from "formidable"
import { upload_image_temp_dir, upload_video_dir } from "~/constants/dir"
import path from "path"

// khởi tạo folder nếu chưa có
export const initFolder = () => {
  if (!fs.existsSync(upload_image_temp_dir)) {
    fs.mkdirSync(upload_image_temp_dir, {
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
      console.log(files)
      resolve(files.image as File[])
    })
  })
}

// Cách xử lý khi upload video và encode
// Có 2 giai đoạn
// Upload video: Upload video thành công thì resolve về cho người dùng
// Encode video: Khai báo thêm 1 url endpoint để check xem cái video đó đã encode xong chưa

export const handleUploadVideo = async (req: Request) => {
  // do formidable v3 sử dụng ESModule mà dự án dùng commonJS nên cần chuyển formidable v3 sang commonJS để biên dịch chính xác
  const formidable = (await import("formidable")).default
  // Cách để có được định dạng idname/idname.mp4
  // ✅Cách 1: Tạo unique id cho video ngay từ đầu
  // ❌Cách 2: Đợi video upload xong rồi tạo folder, move video vào
  const nanoId = (await import("nanoid")).nanoid
  const idName = nanoId()
  const folderPath = path.resolve(upload_video_dir, idName)
  fs.mkdirSync(folderPath) // tạo thư mục uploads/videos/idVideo

  const form = formidable({
    uploadDir: folderPath, // ghép nối đường dẫn // đường dẫn trỏ tới thư mục lưu uploads/videos/idVideo - lưu file tại đây
    maxFiles: 1, // up tối đa 1 file
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === "video" && Boolean(mimetype?.includes("mp4") || mimetype?.includes("quicktime"))
      if (!valid) {
        form.emit("error" as any, new Error("File type is not valid") as any)
      }
      return valid
    },
    filename: function () {
      return idName // đặt tên file giống folder // tạo thư mục uploads/videos/idVideo/idVideo.mp4
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
        video.filepath = video.filepath + "." + ext
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
