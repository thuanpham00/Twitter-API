import { S3 } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { config } from "dotenv"
import { Response } from "express"
import fs from "fs"
import httpStatus from "~/constants/httpStatus"
config()

const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
  }
})

// s3.listBuckets({}).then((data) => console.log(data)) // kết nối

export const uploadFileToS3 = ({
  fileName,
  filePath,
  ContentType
}: {
  fileName: string
  filePath: string
  ContentType: string
}) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: {
      Bucket: "twitter-clone-ap-southeash-1",
      Key: fileName,
      Body: fs.readFileSync(filePath),
      ContentType: ContentType
    },

    // optional tags
    tags: [
      /*...*/
    ],
    queueSize: 4,
    partSize: 1024 * 1024 * 5,
    leavePartsOnError: false
  })
  return parallelUploads3.done()
}

// mục đích là gọi file video hls từ s3 về server mình (server là trung gian)
export const sendFileFromS3 = async (res: Response, filepath: string) => {
  try {
    const data = await s3.getObject({
      Bucket: "twitter-clone-ap-southeash-1",
      Key: filepath
    })
    ;(data.Body as any).pipe(res)
  } catch (error) {
    res.status(httpStatus.NOTFOUND).send("Not found")
  }
}

// parallelUploads3.on("httpUploadProgress", (progress) => {
//   console.log(progress)
// })
