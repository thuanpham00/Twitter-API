import { Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { PeopleFollow } from "~/constants/enum"
import { SearchQuery } from "~/models/requests/Search.requests"
import { TokenPayload } from "~/models/requests/User.requests"
import searchServices from "~/services/search.services"

export const searchController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const content = req.query.content
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const media_type = req.query.media_type
  const people_follow = req.query.people_follow

  const { tweets, total } = await searchServices.search({ content, limit, page, media_type, people_follow, user_id })
  return res.json({
    message: "Search tweet success",
    result: {
      tweets: tweets,
      limit,
      page,
      total_page: Math.ceil(total / limit) // làm tròn lên
    }
  })
}
