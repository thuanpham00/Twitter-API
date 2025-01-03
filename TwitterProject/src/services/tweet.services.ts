import { TweetReqBody } from "~/models/requests/Tweet.requests"
import databaseService from "./database.services"
import Tweet from "~/models/schemas/Tweet.schema"
import { ObjectId, WithId } from "mongodb"
import HashTag from "~/models/schemas/HashTags.schema"
import { TweetType } from "~/constants/enum"

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
        hashtags: hashtag, // ít - nhiều -> nhúng
        mentions: body.mentions,
        medias: body.medias,
        parent_id: body.parent_id,
        type: body.type
      })
    )
    const tweet = await databaseService.tweets.findOne({ _id: result.insertedId })
    return tweet
  }

  async increaseView(tweet_id: string, user_id?: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const result = await databaseService.tweets.findOneAndUpdate(
      {
        _id: new ObjectId(tweet_id)
      },
      {
        $inc: inc,
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: "after",
        projection: {
          guest_views: 1,
          user_views: 1,
          updated_at: 1
        }
      }
    )
    return result as WithId<{
      guest_views: number
      user_views: number
      updated_at: Date
    }>
  }

  async getTweetChildren({
    tweet_id,
    limit,
    page,
    tweet_type,
    user_id
  }: {
    tweet_id: string
    limit: number
    page: number
    tweet_type: TweetType
    user_id?: string
  }) {
    const tweets = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(tweet_id),
            type: tweet_type
          }
        },
        {
          $lookup: {
            from: "hashtags",
            localField: "hashtags",
            foreignField: "_id",
            as: "hashtags"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "mentions",
            foreignField: "_id",
            as: "mentions"
          }
        },
        {
          $addFields: {
            // ghi đè lại mentions ở stage trên
            mentions: {
              $map: {
                input: "$mentions",
                as: "mention",
                in: {
                  _id: "$$mention._id",
                  name: "$$mention.name"
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: "bookmarks",
            localField: "_id",
            foreignField: "tweet_id",
            as: "bookmarks"
          }
        },
        {
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "tweet_id",
            as: "likes"
          }
        },
        {
          $lookup: {
            from: "tweets",
            localField: "_id",
            foreignField: "parent_id",
            as: "tweet_children"
          }
        },
        {
          $addFields: {
            bookmarks: {
              $size: "$bookmarks"
            },
            likes: {
              $size: "$likes"
            },
            retreet_count: {
              $size: {
                $filter: {
                  input: "$tweet_children",
                  as: "item",
                  cond: {
                    $eq: ["$$item.type", TweetType.Retweet]
                  }
                }
              }
            },
            comment_count: {
              $size: {
                $filter: {
                  input: "$tweet_children",
                  as: "item",
                  cond: {
                    $eq: ["$$item.type", TweetType.Comment]
                  }
                }
              }
            },
            quote_count: {
              $size: {
                $filter: {
                  input: "$tweet_children",
                  as: "item",
                  cond: {
                    $eq: ["$$item.type", TweetType.QuoteTweet]
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            tweet_children: 0
          }
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        }
      ])
      .toArray()

    // lấy ra danh sách id của các tweet có parent_id là tweet_id
    const ids = tweets.map((item) => item._id as ObjectId)
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const date = new Date()
    const [total] = await Promise.all([
      databaseService.tweets.countDocuments({
        parent_id: new ObjectId(tweet_id),
        type: tweet_type
      }),
      databaseService.tweets.updateMany(
        {
          _id: {
            $in: ids // dò tìm id thuộc arr ids
          }
        },
        {
          $inc: inc,
          $set: {
            updated_at: date
          }
        }
      )
    ])
    // do updateMany ko có returnDocument nên ko cập nhật postman, nên dùng foreach để refetch gán lại 1 lần nữa
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      if (user_id) {
        tweet.user_views += 1
      } else {
        tweet.guest_views += 1
      }
    })
    return {
      tweets,
      total
    }
  }
}

const tweetServices = new TweetServices()
export default tweetServices
