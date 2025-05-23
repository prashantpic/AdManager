variable "enabled" {
  description = "Flag to enable/disable the creation of GraphQL API resources."
  type        = bool
  default     = false
}

variable "graphql_api_name" {
  description = "Name for the GraphQL API (API Gateway v2 HTTP API or AppSync)."
  type        = string
}

variable "api_description" {
  description = "Description for the GraphQL API."
  type        = string
  default     = "GraphQL API"
}

variable "backend_graphql_uri" {
  description = "The URI of the backend GraphQL service (e.g., Lambda ARN for AWS_PROXY, or HTTP endpoint for HTTP_PROXY like an ALB)."
  type        = string
}

variable "stage_name" {
  description = "Name of the deployment stage for the GraphQL API (e.g., 'dev', 'staging', 'prod', '$default')."
  type        = string
  default     = "$default"
}

variable "authorizer_id" {
  description = "ID of the API Gateway v2 authorizer to apply to the /graphql route (JWT or Lambda). Leave empty or null for no authorizer."
  type        = string
  default     = null
}

variable "stage_variables_map" {
  description = "A map of stage variables for the GraphQL API stage."
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "A map of tags to assign to resources."
  type        = map(string)
  default     = {}
}

variable "vpc_link_id" {
  description = "ID of the VPC Link if the backend integration target is in a VPC (for HTTP_PROXY)."
  type        = string
  default     = null
}

variable "enable_get_route" {
  description = "Enable GET /graphql route for introspection tools like GraphQL Playground."
  type        = bool
  default     = true # Often useful
}

# Variables for API Gateway v2 Stage Logging
variable "access_log_destination_arn" {
  description = "ARN of the CloudWatch Log Group for access logs. If null, access logs are disabled."
  type        = string
  default     = null
}

variable "access_log_format" {
  description = "Format for access logs. Required if access_log_destination_arn is set."
  type        = string
  default     = "$context.identity.sourceIp - - [$context.requestTime] \"$context.httpMethod $context.routeKey $context.protocol\" $context.status $context.responseLength $context.requestId"
  # Example JSON format for HTTP API:
  # "{ \"requestId\":\"$context.requestId\", \"ip\": \"$context.identity.sourceIp\", \"requestTime\":\"$context.requestTime\", \"httpMethod\":\"$context.httpMethod\",\"routeKey\":\"$context.routeKey\", \"status\":\"$context.status\",\"protocol\":\"$context.protocol\", \"responseLength\":\"$context.responseLength\" }"
}

# Default route settings for API Gateway v2 Stage
variable "default_route_throttling_burst_limit" {
  description = "Default throttling burst limit for routes in this stage."
  type        = number
  default     = 5000 # AWS default
}

variable "default_route_throttling_rate_limit" {
  description = "Default throttling rate limit for routes in this stage."
  type        = number
  default     = 10000 # AWS default
}


# --- AppSync specific variables (if chosen over API Gateway v2) ---
# variable "use_appsync" {
#   description = "Flag to indicate if AWS AppSync should be used instead of API Gateway v2 HTTP API."
#   type        = bool
#   default     = false
# }

# variable "graphql_schema_file_path" {
#   description = "Path to the GraphQL schema definition file (schema.graphql). Required if use_appsync is true."
#   type        = string
#   default     = "" # e.g., "schema/schema.graphql"
# }

# variable "appsync_authentication_type" {
#   description = "Authentication type for AppSync API (e.g., AMAZON_COGNITO_USER_POOLS, API_KEY, AWS_IAM, OPENID_CONNECT)."
#   type        = string
#   default     = "API_KEY"
# }

# variable "cognito_user_pool_id" {
#   description = "Cognito User Pool ID if authentication_type is AMAZON_COGNITO_USER_POOLS."
#   type        = string
#   default     = null
# }

# variable "cognito_region" {
#   description = "AWS region for Cognito User Pool if authentication_type is AMAZON_COGNITO_USER_POOLS."
#   type        = string
#   default     = null
# }

# variable "lambda_data_source_arn" {
#   description = "ARN of the Lambda function to be used as a data source for AppSync."
#   type        = string
#   default     = null
# }

# variable "appsync_service_role_arn" {
#   description = "IAM Role ARN for AppSync to interact with data sources (e.g., Lambda, DynamoDB)."
#   type        = string
#   default     = null
# }