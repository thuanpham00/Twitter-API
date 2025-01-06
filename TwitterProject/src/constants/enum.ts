export enum UserVerifyStatus {
  Unverified, // chưa xác thực email, mặc định = 0
  Verified, // đã xác thực email
  Banned // bị khóa
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

export enum MediaType {
  Image,
  Video,
  HLS
}

export enum MediaQueryType {
  Image = "image",
  Video = "video"
}

export enum EncodingStatus {
  Pending, // đang chờ hàng đợi
  Processing, // đang encoding
  Success, // thành công
  Fail // thất bại
}

export enum TweetAudience {
  Everyone,
  TwitterCircle
}

export enum TweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet
}

export enum PeopleFollow {
  Anyone = "0",
  Following = "1"
}
