import { TweetAudience, TweetType } from "~/constants/enum"
import { Media } from "~/constants/others"
import { ParamsDictionary } from "express-serve-static-core"
export interface TweetReqBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string //  chỉ null khi tweet gốc/ ko thì là tweet_id cha dạng string
  hashtags: string[] // ["javascript", "react"]
  mentions: string[] // user_id[]
  medias: Media[]
}

export interface TweetParams extends ParamsDictionary {
  tweet_id: string
}

export interface TweetQuery {
  limit: string
  page: string
  tweet_type: string
}
