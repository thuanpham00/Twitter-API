import { checkSchema, ParamSchema } from "express-validator"
import { ObjectId } from "mongodb"
import httpStatus from "~/constants/httpStatus"
import { tweetMessages } from "~/constants/message"
import { ErrorWithStatus } from "~/models/Errors"
import databaseService from "~/services/database.services"
import { validate } from "~/utils/validations"

const tweetIdSchema: ParamSchema = {
  custom: {
    options: async (value) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          status: httpStatus.UNAUTHORIZED,
          message: tweetMessages.INVALID_TWEET_ID
        })
      }
      const findTweet = await databaseService.tweets.findOne({ _id: new ObjectId(value) })
      if (findTweet === null) {
        throw new ErrorWithStatus({
          status: httpStatus.UNAUTHORIZED,
          message: tweetMessages.TWEET_NOT_FOUND
        })
      }
    }
  }
}

export const likeValidator = validate(
  checkSchema(
    {
      tweet_id: tweetIdSchema
    },
    ["body"]
  )
)

export const unLikeValidator = validate(
  checkSchema(
    {
      tweet_id: tweetIdSchema
    },
    ["params"]
  )
)
