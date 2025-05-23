variable "rest_api_id" {
  description = "The ID of the REST API to associate authorizers with."
  type        = string
}

variable "jwt_authorizers_config" {
  description = "Configuration for JWT authorizers (including Cognito User Pools)."
  type = map(object({
    name                           = string
    type                           = string # "COGNITO_USER_POOLS" or "JWT"
    identity_source                = string # e.g., "method.request.header.Authorization"
    authorizer_credentials         = optional(string) # For JWT type if it needs to call AWS services; usually null for Cognito.
    authorizer_result_ttl_in_seconds = optional(number, 300)
    # For COGNITO_USER_POOLS
    provider_arns = optional(list(string)) # List of Cognito User Pool ARNs. Required for COGNITO_USER_POOLS.
    # For JWT
    jwt_configuration = optional(object({
      audience = optional(list(string))
      issuer   = optional(string)
    }))
  }))
  default = {}
}

variable "lambda_authorizers_config" {
  description = "Configuration for Lambda authorizers."
  type = map(object({
    name                           = string
    type                           = string # "TOKEN" or "REQUEST"
    authorizer_uri                 = string # Lambda function ARN or alias ARN
    identity_source                = string # e.g., "method.request.header.Authorization" or "method.request.querystring.auth"
    authorizer_credentials         = optional(string) # IAM role ARN for API Gateway to invoke the Lambda authorizer.
    authorizer_result_ttl_in_seconds = optional(number, 300)
    identity_validation_expression = optional(string) # For TOKEN authorizer, regex to validate identity source.
  }))
  default = {}
}

variable "tags" {
  description = "A map of tags to assign to resources."
  type        = map(string)
  default     = {}
}