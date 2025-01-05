import { NextFunction, Request, Response } from "express"
import { checkSchema } from "express-validator"
import { ObjectId } from "mongodb"
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from "~/constants/enum"
import httpStatus from "~/constants/httpStatus"
import { tweetMessages, userMessages } from "~/constants/message"
import { ErrorWithStatus } from "~/models/Errors"
import Tweet from "~/models/schemas/Tweet.schema"
import databaseService from "~/services/database.services"
import { convertEnumArray } from "~/utils/commons"
import { wrapRequestHandler } from "~/utils/handlers"
import { validate } from "~/utils/validations"

const tweetType = convertEnumArray(TweetType)
const tweetAudience = convertEnumArray(TweetAudience)
const mediaType = convertEnumArray(MediaType)

export const createTweetValidator = validate(
  checkSchema(
    {
      type: {
        isIn: {
          options: [tweetType],
          errorMessage: tweetMessages.TWEET_INVALID_TYPE
        }
      },
      audience: {
        isIn: {
          options: [tweetAudience],
          errorMessage: tweetMessages.TWEET_INVALID_AUDIENCE // lỗi 422 // truyền vào msg trong ErrorObject
        }
      },
      content: {
        isString: true,
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType
            const hashtags = req.body.hashtags as string[]
            const mentions = req.body.mentions as string[]
            // Nếu `type` là retweet thì `content` phải là `''`
            if ([TweetType.Retweet].includes(type) && value !== "") {
              throw new Error(tweetMessages.CONTENT_MUST_BE_EMPTY_STRING) // lỗi 422
            }
            // Nếu `type` là comment, quotetweet, tweet và không có `mentions` và `hashtags` thì `content` phải là string và không được rỗng
            if (
              [TweetType.Comment, TweetType.QuoteTweet, TweetType.Tweet].includes(type) &&
              hashtags === null &&
              mentions === null &&
              value === ""
            ) {
              throw new Error(tweetMessages.CONTENT_MUST_BE_A_NON_EMPTY_STRING) // lỗi 422
            }
            return true
          }
        }
      },
      parent_id: {
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType
            // nếu type là retweet, comment, quotetweet thì parent_id là `tweet_id` của tweet cha
            if (
              [TweetType.QuoteTweet, TweetType.Comment, TweetType.Retweet].includes(type) &&
              !ObjectId.isValid(value)
            ) {
              throw new Error(tweetMessages.PARENT_ID_MUST_BE_VALID_TWEET_ID) // lỗi 422
            }
            // type là tweet thì parent_id là null
            if (type === TweetType.Tweet && value !== null) {
              throw new Error(tweetMessages.PARENT_ID_MUST_BE_NULL) // lỗi 422
            }
            return true
          }
        }
      },
      hashtags: {
        isArray: true,
        custom: {
          // `hashtags` phải là mảng các string
          options: (value, { req }) => {
            if (value.some((item: any) => !(typeof item === "string"))) {
              throw new Error(tweetMessages.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING) // lỗi 422
            }
            return true
          }
        }
      },
      mentions: {
        isArray: true,
        custom: {
          // `mentions` phải là mảng các string dạng id
          options: (value, { req }) => {
            if (value.some((item: any) => !ObjectId.isValid(item))) {
              throw new Error(tweetMessages.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID) // lỗi 422
            }
            return true
          }
        }
      },
      medias: {
        isArray: true,
        custom: {
          // `mentions` phải là mảng các string dạng id
          options: (value, { req }) => {
            if (
              value.some((item: any) => {
                return typeof item.url !== "string" || !mediaType.includes(item.type)
              })
            ) {
              throw new Error(tweetMessages.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
            }
            return true // ko lỗi thì phải return true
          }
        }
      }
    },
    ["body"]
  )
)

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: httpStatus.UNAUTHORIZED,
                message: tweetMessages.INVALID_TWEET_ID
              })
            }
            // thực hiện query kết hợp tìm ở đây để lấy được tweet
            const findTweet = (
              await databaseService.tweets
                .aggregate<Tweet>([
                  {
                    $match: {
                      _id: new ObjectId(value)
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
                  }
                ])
                .toArray()
            )[0]
            if (!findTweet) {
              throw new ErrorWithStatus({
                status: httpStatus.NOTFOUND,
                message: tweetMessages.TWEET_NOT_FOUND
              })
            }
            ;(req as Request).tweet = findTweet
          }
        }
      }
    },
    ["body", "params"]
  )
)

// muốn sử dụng async/await trong handler express thì phải có try catch
// nếu ko dùng try catch thì phải dùng wrapRequestHandler
export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  if (tweet.audience === TweetAudience.TwitterCircle) {
    // kiểm tra người xem tweet này đã đăng nhập hay chưa
    if (!req.decode_authorization) {
      throw new ErrorWithStatus({
        status: httpStatus.UNAUTHORIZED,
        message: userMessages.ACCESS_TOKEN_IS_REQUIRED
      })
    }

    // kiểm tra tk tác giả có ổn (bị khóa hay bị xóa chưa) không
    const author = await databaseService.users.findOne({ _id: new ObjectId(tweet.user_id) })
    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        status: httpStatus.NOTFOUND,
        message: userMessages.USER_NOT_FOUND
      })
    }

    const { user_id } = req.decode_authorization
    // kiểm tra người xem tweet có nằm trong Twitter Circle của tác giả không
    const isInTwitterCircle = author.twitter_circle.some((user_circle_id) => user_circle_id.equals(user_id))

    // nếu bn không phải tác giả và không nằm trong twitter circle thì lỗi
    if (!author._id.equals(user_id) && !isInTwitterCircle) {
      throw new ErrorWithStatus({
        status: httpStatus.FORBIDDEN,
        message: tweetMessages.TWEET_IS_NOT_PUBLIC
      })
    }
  }
  next()
})

export const paginationValidator = validate(
  checkSchema(
    {
      limit: {
        isNumeric: true,
        custom: {
          options: (value) => {
            const number = Number(value)
            if (number > 100 || number < 1) {
              throw new ErrorWithStatus({
                status: httpStatus.UNAUTHORIZED,
                message: "Limit <= 100 && limit >= 1"
              })
            }
            return true // nhớ nếu ko có lỗi thì return true
          }
        }
      },
      page: {
        isNumeric: true,
        custom: {
          options: (value) => {
            const number = Number(value)
            if (number < 1) {
              throw new ErrorWithStatus({
                status: httpStatus.UNAUTHORIZED,
                message: "Page >= 1"
              })
            }
            return true
          }
        }
      }
    },
    ["query"]
  )
)


export const getTweetChildrenValidator = validate(
  checkSchema(
    {
      tweet_type: {
        isIn: {
          options: [tweetType],
          errorMessage: tweetMessages.TWEET_INVALID_TYPE
        }
      }
    },
    ["query"]
  )
)

