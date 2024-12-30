import { ObjectId } from "mongodb"
import databaseService from "./database.services"
import BockMark from "~/models/schemas/Bookmark.schema"

class BookmarkServices {
  // 2 cách
  // async bookmarkTweet(tweet_id: string, user_id: string) {
  //   const findBookmark = await databaseService.bookmark.findOne({
  //     tweet_id: new ObjectId(tweet_id),
  //     user_id: new ObjectId(user_id)
  //   })
  //   if (findBookmark === null) {
  //     const result = await databaseService.bookmark.insertOne(
  //       new BockMark({
  //         tweet_id: new ObjectId(tweet_id),
  //         user_id: new ObjectId(user_id)
  //       })
  //     )
  //     return result.insertedId
  //   }
  //   return "Bookmark tweet is already"
  // }

  async bookmarkTweet(tweet_id: string, user_id: string) {
    const findBookmark = await databaseService.bookmark.findOneAndUpdate(
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
    return findBookmark
  }

  async unBookmarkTweet(tweet_id: string, user_id: string) {
    const findBookmark = await databaseService.bookmark.findOneAndDelete({
      tweet_id: new ObjectId(tweet_id),
      user_id: new ObjectId(user_id)
    })
    return findBookmark
  }
}

const bookmarkServices = new BookmarkServices()

export default bookmarkServices
