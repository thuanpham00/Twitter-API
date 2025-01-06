import { checkSchema } from "express-validator"
import { MediaQueryType, PeopleFollow } from "~/constants/enum"
import { validate } from "~/utils/validations"

export const searchValidator = validate(
  checkSchema(
    {
      content: {
        isString: true
      },
      media_type: {
        optional: true,
        isIn: {
          options: [Object.values(MediaQueryType)]
        },
        errorMessage: `Media type must be on of ${Object.values(MediaQueryType).join(", ")}`
      },
      people_follow: {
        optional: true,
        isIn: {
          options: [Object.values(PeopleFollow)],
          errorMessage: "People follow must be 0 or 1"
        }
      }
    },
    ["query"]
  )
)
