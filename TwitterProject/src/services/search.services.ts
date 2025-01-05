import { ObjectId } from "mongodb"
import databaseService from "./database.services"
import { MediaQueryType, MediaType, TweetType } from "~/constants/enum"

class SearchServices {
  async search({
    content,
    limit,
    page,
    media_type,
    people_follow,
    user_id
  }: {
    content: string
    limit: number
    page: number
    media_type?: MediaQueryType
    people_follow?: string
    user_id: string
  }) {
    const $match: any = {
      $text: {
        $search: content
      }
    }
    // lọc tìm kiếm tweet theo hình ảnh hoặc video
    if (media_type) {
      if (media_type === MediaQueryType.Image) {
        $match["medias.type"] = MediaType.Image
      }
      if (media_type === MediaQueryType.Video) {
        $match["medias.type"] = {
          $in: [MediaType.Video, MediaType.HLS]
        }
      }
    }
    /**
     *  $match: {
          $text: {
            $search: "Admoneo"
          },
          "medias.type": 0,
          "user_id": {
            $in: [
              ObjectId('67790a6098f6b1fa563b5d77'),
              ObjectId('67790a6098f6b1fa563b5d84')
            ]
          }
        }
     */
    // lọc tìm kiếm tweet theo những người mà user đang theo dõi
    if (people_follow && people_follow === "1") {
      // ds những ng mà user đang theo dõi
      const follower_user_id_list = await databaseService.followers
        .find(
          {
            user_id: new ObjectId(user_id)
          },
          {
            projection: {
              follower_user_id: 1,
              _id: 0
            }
          }
        )
        .toArray()

      const ids = follower_user_id_list.map((item) => item.follower_user_id as ObjectId)
      ids.push(new ObjectId(user_id))
      $match["user_id"] = {
        $in: ids
      }
    }
    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate([
          {
            $match
          },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "user"
            }
          },
          {
            $unwind: {
              path: "$user"
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  // check thử xem user có được phép xem tweet (thuộc twitter_circle)
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      "user.twitter_circle": {
                        $in: [new ObjectId(user_id)]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
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
              tweet_children: 0,
              user: {
                password: 0,
                email_verify_token: 0,
                forgot_password_token: 0,
                twitter_circle: 0,
                date_of_birth: 0
              }
            }
          }
        ])
        .toArray(),
      databaseService.tweets
        .aggregate([
          {
            $match
          },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "user"
            }
          },
          {
            $unwind: {
              path: "$user"
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      "user.twitter_circle": {
                        $in: [new ObjectId(user_id)]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $count: "total"
          }
        ])
        .toArray()
    ])
    const date = new Date()
    const ids = tweets.map((item) => item._id as ObjectId)
    await databaseService.tweets.updateMany(
      {
        _id: {
          $in: ids
        }
      },
      {
        $inc: {
          user_views: 1
        },
        $set: {
          updated_at: date
        }
      }
    )
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      tweet.user_views += 1
    })

    return {
      tweets,
      total: total[0]?.total || 0
    }
  }
}

const searchServices = new SearchServices()

export default searchServices
