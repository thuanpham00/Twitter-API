export const userMessages = {
  VALIDATION_ERROR: "Validation error",
  NAME_IS_REQUIRED: "Name is required",
  NAME_MUST_BE_A_STRING: "Name must be a string",
  NAME_LENGTH: "Name length must be from 1 to 100",
  EMAIL_ALREADY_EXISTS: "Email already exists",
  EMAIL_IS_REQUIRED: "Email is required",
  EMAIL_IS_INVALID: "Email is invalid",
  EMAIL_OR_PASSWORD_IS_INCORRECT: "Email or password is incorrect",
  PASSWORD_IS_REQUIRED: "Password is required",
  PASSWORD_MUST_BE_A_STRING: "Password must be a string",
  PASSWORD_LENGTH: "Password length must be from 6 to 50",
  PASSWORD_STRONG:
    "Password must be 6-50 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 symbol",
  CONFIRM_PASSWORD_IS_REQUIRED: "Confirm Password is required",
  CONFIRM_PASSWORD_MUST_BE_A_STRING: "Confirm Password must be a string",
  CONFIRM_PASSWORD_LENGTH: "Confirm Password length must be from 6 to 50",
  CONFIRM_PASSWORD_STRONG:
    "Confirm Password must be 6-50 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 symbol",
  CONFIRM_PASSWORD_NOT_MATCH: "Password confirmation does not match password",
  DATE_OF_BIRTH_MUST_BE_STRING: "Date of birth must be ISO8601",
  LOGIN_SUCCESS: "Login Success",
  REGISTER_SUCCESS: "Register Success",

  ACCESS_TOKEN_IS_REQUIRED: "Access token is required",
  REFRESH_TOKEN_IS_REQUIRED: "Refresh token is required",
  REFRESH_TOKEN_IS_INVALID: "Refresh token is invalid",
  REFRESH_TOKEN_USED_OR_NOT_EXISTS: "Refresh token used or not exists",
  LOGOUT_SUCCESS: "Logout Success",

  EMAIL_VERIFY_TOKEN_IS_REQUIRED: "Email verify token is required",
  USER_NOT_FOUND: "User not found",
  EMAIL_VERIFY_ALREADY_BEFORE: "Email verify already before",
  EMAIL_VERIFY_SUCCESS: "Email verify success",
  RESEND_EMAIL_VERIFY_SUCCESS: "Resend email verify success",

  CHECK_EMAIL_TO_RESET_PASSWORD: "Check email to reset password",
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: "Forgot password token is required",
  VERIFY_FORGOT_PASSWORD_SUCCESS: "Verify forgot password is success",
  FORGOT_PASSWORD_TOKEN_IS_INVALID: "Forgot password token is invalid",
  RESET_PASSWORD_IS_SUCCESS: "Reset password is success",

  GET_PROFILE_IS_SUCCESS: "Get profile is success",
  USER_NOT_VERIFIED: "User not verified",
  BIO_MUST_BE_A_STRING: "Bio must be a string",
  BIO_LENGTH: "Bio length must be from 1 to 200",

  LOCATION_MUST_BE_A_STRING: "Location must be a string",
  LOCATION_LENGTH: "Location length must be from 1 to 200",

  WEBSITE_MUST_BE_A_STRING: "Website must be a string",
  WEBSITE_LENGTH: "Website length must be from 1 to 200",

  USERNAME_MUST_BE_A_STRING: "Username must be a string",
  USERNAME_INVALID:
    "Username must be 4-15 character long and contain only letters, numbers, underscores, not only number",
  USERNAME_EXISTED: "Username is existed",

  AVATAR_MUST_BE_A_STRING: "Avatar must be a string",
  AVATAR_LENGTH: "Avatar length must be from 1 to 200",

  COVER_PHOTO_MUST_BE_A_STRING: "Cover photo must be a string",
  COVER_PHOTO_LENGTH: "Cover photo length must be from 1 to 200",

  UPDATE_PROFILE_USER_IS_SUCCESS: "Update profile user is success",
  GET_USER_PROFILE_IS_SUCCESS: "Get user profile is success",

  FOLLOW_SUCCESS: "Follow success",
  FOLLOW_ALREADY: "already followed",
  INVALID_USER_ID: "Invalid user_id",
  UNFOLLOW_SUCCESS: "Unfollow success",
  UNFOLLOW_ALREADY: "already unfollowed",

  OLD_PASSWORD_NOT_MATCH: "Old password is not match",
  CHANGE_PASSWORD_SUCCESS: "Change password is success",

  EMAIL_NOT_VERIFIED: "Email not verified"
} as const
