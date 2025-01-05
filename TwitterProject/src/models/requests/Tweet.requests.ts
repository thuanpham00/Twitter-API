import { TweetAudience, TweetType } from "~/constants/enum"
import { Media } from "~/constants/others"
import { ParamsDictionary, Query } from "express-serve-static-core"
export interface TweetReqBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string //  chỉ null khi tweet gốc/ ko thì là tweet_id cha dạng string
  hashtags: string[] // ["javascript", "react"]
  mentions: string[] // user_id[]
  medias: Media[]
}

export interface BookMarkReqBody {
  tweet_id: string
}

export interface TweetParams extends ParamsDictionary {
  tweet_id: string
}

export interface TweetQuery extends Pagination, Query {
  tweet_type: string
}

export interface Pagination {
  limit: string
  page: string
}
