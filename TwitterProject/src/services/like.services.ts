import { ObjectId } from "mongodb"
import databaseService from "./database.services"
import BockMark from "~/models/schemas/Bookmark.schema"

class LikeServices {
  async likeTweet(tweet_id: string, user_id: string) {
    const findLike = await databaseService.like.findOneAndUpdate(
      {
        tweet_id: new ObjectId(tweet_id),
        user_id: new ObjectId(user_id)
      },
      {
        $setOnInsert: new BockMark({
          tweet_id: new ObjectId(tweet_id),
          user_id: new ObjectId(user_id)
        })
      },
      {
        upsert: true,
        returnDocument: "after" // cập nhật liền sau khi update (trên postman)
      }
    )
    return findLike
  }

  async unLikeTweet(tweet_id: string, user_id: string) {
    const findLike = await databaseService.like.findOneAndDelete({
      tweet_id: new ObjectId(tweet_id),
      user_id: new ObjectId(user_id)
    })
    return findLike
  }
}

const likeServices = new LikeServices()

export default likeServices
