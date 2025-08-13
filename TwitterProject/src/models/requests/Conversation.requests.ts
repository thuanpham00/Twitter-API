import { ParamsDictionary } from "express-serve-static-core"
export interface GetConversationParams extends ParamsDictionary {
  receiverId: string
}
