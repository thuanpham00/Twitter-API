import { TweetReqBody } from "~/models/requests/Tweet.requests"
import databaseService from "./database.services"
import Tweet from "~/models/schemas/Tweet.schema"
import { ObjectId, WithId } from "mongodb"
import HashTag from "~/models/schemas/HashTags.schema"

class TweetServices {
  async checkAndCreateHashtag(hashtags: string[]) {
    const hashTagDocument = await Promise.all(
      hashtags.map((hashtag) => {
        // tìm hashtag, nếu có thì lấy, nếu ko tồn tại hashtag đó thì thêm mới vào db
        // findOneAndUpdate ko tự tạo id // nên phải truyền id vào
        return databaseService.hashtags.findOneAndUpdate(
          { name: hashtag },
          {
            $setOnInsert: new HashTag({ name: hashtag })
          },
          {
            upsert: true,
            returnDocument: "after" // cập nhật liền sau khi update (trên postman)
          }
        )
      })
    )
    return hashTagDocument.map((hashtag) => (hashtag as WithId<HashTag>)._id)
  }

  async createTweet(body: TweetReqBody, user_id: string) {
    const hashtag = await this.checkAndCreateHashtag(body.hashtags)
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        user_id: new ObjectId(user_id),
        audience: body.audience,
        content: body.content,
        hashtags: hashtag, // chưa xử lý
        mentions: body.mentions,
        medias: body.medias,
        parent_id: body.parent_id,
        type: body.type
      })
    )
    const tweet = await databaseService.tweets.findOne({ _id: result.insertedId })
    return tweet
  }
}

const tweetServices = new TweetServices()
export default tweetServices
