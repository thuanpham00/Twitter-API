import { MediaQueryType, PeopleFollow } from "~/constants/enum"
import { Pagination } from "./Tweet.requests"
import { Query } from "express-serve-static-core"

export interface SearchQuery extends Pagination, Query {
  content: string
  media_type?: MediaQueryType
  people_follow?: PeopleFollow
}
