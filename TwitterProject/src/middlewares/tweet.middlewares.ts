import { checkSchema } from "express-validator"
import { includes } from "lodash"
import { ObjectId } from "mongodb"
import { MediaType, TweetAudience, TweetType } from "~/constants/enum"
import { tweetMessages } from "~/constants/message"
import { convertEnumArray } from "~/utils/commons"
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
            if ([TweetType.Retweet].includes(type) && value !== null) {
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
