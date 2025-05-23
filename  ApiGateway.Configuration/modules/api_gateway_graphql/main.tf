resource "aws_apigatewayv2_api" "this" {
  count = var.enabled ? 1 : 0

  name          = var.graphql_api_name
  protocol_type = "HTTP"
  description   = var.api_description

  # Example target for Lambda:
  # target = var.backend_graphql_uri # This should be the Lambda Function ARN for Lambda integration
  # For HTTP Proxy to an ALB/NLB/ECS service:
  # No explicit target at the API level for HTTP_PROXY, defined in integration.

  tags = var.tags
}

resource "aws_apigatewayv2_integration" "this" {
  count = var.enabled ? 1 : 0

  api_id           = aws_apigatewayv2_api.this[0].id
  integration_type = "HTTP_PROXY" # For proxying to an HTTP backend (NestJS GraphQL)
  # If backend_graphql_uri is a Lambda ARN, use "AWS_PROXY"
  # integration_type    = try(substr(var.backend_graphql_uri, 0, 14) == "arn:aws:lambda", false) ? "AWS_PROXY" : "HTTP_PROXY"


  integration_uri = var.backend_graphql_uri # URI of the NestJS GraphQL service or Lambda function ARN
  # For HTTP_PROXY, this is the HTTP endpoint.
  # For AWS_PROXY (Lambda), this is the Lambda Function ARN.

  integration_method = "POST" # GraphQL typically uses POST, but can be ANY for flexibility
  payload_format_version = "1.0" # Or "2.0" depending on Lambda handler

  # connection_type and connection_id for VPC Link if backend is in VPC
  connection_type = var.vpc_link_id != null ? "VPC_LINK" : null
  connection_id   = var.vpc_link_id

  # timeout_milliseconds = 29000 # Max for HTTP API
}

resource "aws_apigatewayv2_route" "graphql_route" {
  count = var.enabled ? 1 : 0

  api_id    = aws_apigatewayv2_api.this[0].id
  route_key = "POST /graphql" # Common GraphQL route
  target    = "integrations/${aws_apigatewayv2_integration.this[0].id}"

  # Optional: if using a custom authorizer for API Gateway v2 HTTP API
  authorizer_id = var.authorizer_id != "" ? var.authorizer_id : null
  # authorization_type = var.authorizer_id != "" ? "JWT" : "NONE" # Or "CUSTOM" if using Lambda authorizer
  # For JWT authorizer, ensure it's created and its ID is passed in var.authorizer_id
  # authorization_scopes = [] # if OAuth2/JWT scopes are used
}

# Catch-all route if needed, e.g., for GraphQL subscriptions over WebSockets (not directly supported by HTTP API, needs different setup)
# or if you want GET /graphql for schema introspection tools like GraphQL Playground
resource "aws_apigatewayv2_route" "graphql_get_route" {
  count = var.enabled && var.enable_get_route ? 1 : 0

  api_id    = aws_apigatewayv2_api.this[0].id
  route_key = "GET /graphql"
  target    = "integrations/${aws_apigatewayv2_integration.this[0].id}"

  authorizer_id = var.authorizer_id != "" ? var.authorizer_id : null
}


resource "aws_apigatewayv2_stage" "this" {
  count = var.enabled ? 1 : 0

  api_id      = aws_apigatewayv2_api.this[0].id
  name        = var.stage_name
  auto_deploy = true # Set to true for simplicity, or manage deployments explicitly

  # Access log settings for HTTP API stage
  dynamic "access_log_settings" {
    for_each = var.access_log_destination_arn != null ? [1] : []
    content {
      destination_arn = var.access_log_destination_arn
      format          = var.access_log_format
    }
  }

  default_route_settings {
    throttling_burst_limit = var.default_route_throttling_burst_limit
    throttling_rate_limit  = var.default_route_throttling_rate_limit
  }

  # Route-specific settings can be defined here too
  # route_settings {
  #   route_key = aws_apigatewayv2_route.graphql_route[0].route_key
  #   throttling_burst_limit = 100
  #   throttling_rate_limit = 50
  # }

  stage_variables = var.stage_variables_map
  tags            = var.tags
}

# If using AWS AppSync (alternative to API Gateway v2 for GraphQL)
# This section would be conditional on a variable like `use_appsync`

# resource "aws_appsync_graphql_api" "appsync_api" {
#   count = var.enabled && var.use_appsync ? 1 : 0
#   # ... AppSync configuration ...
#   name                = var.graphql_api_name
#   authentication_type = "AMAZON_COGNITO_USER_POOLS" # Or API_KEY, AWS_IAM, OPENID_CONNECT
#   # ... other AppSync settings ...

#   user_pool_config {
#     aws_region     = var.cognito_region
#     user_pool_id   = var.cognito_user_pool_id
#     default_action = "ALLOW"
#   }

#   schema = file(var.graphql_schema_file_path)

#   tags = var.tags
# }

# # Example AppSync Lambda Data Source
# resource "aws_appsync_datasource" "lambda_ds" {
#   count = var.enabled && var.use_appsync && var.lambda_data_source_arn != null ? 1 : 0

#   api_id = aws_appsync_graphql_api.appsync_api[0].id
#   name   = "${var.graphql_api_name}_LambdaDS"
#   type   = "AWS_LAMBDA"

#   lambda_config {
#     function_arn = var.lambda_data_source_arn
#   }

#   service_role_arn = var.appsync_service_role_arn # IAM role for AppSync to invoke Lambda
# }

# # Example AppSync Resolver
# resource "aws_appsync_resolver" "query_getUser_resolver" {
#   count = var.enabled && var.use_appsync && var.lambda_data_source_arn != null ? 1 : 0

#   api_id      = aws_appsync_graphql_api.appsync_api[0].id
#   type        = "Query" # Or Mutation, Subscription
#   field       = "getUser" # Field in your GraphQL schema
#   data_source = aws_appsync_datasource.lambda_ds[0].name

#   request_template  = file("${path.module}/resolvers/templates/default_request.vtl")
#   response_template = file("${path.module}/resolvers/templates/default_response.vtl")
# }