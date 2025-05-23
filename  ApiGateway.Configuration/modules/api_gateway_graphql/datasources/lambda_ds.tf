# This file is typically used when AWS AppSync is the GraphQL engine.
# For API Gateway v2 HTTP API proxying to a NestJS GraphQL backend,
# direct Lambda data sources configured here are less common unless AppSync is explicitly chosen.

# Example: Lambda data source for resolving user-related queries/mutations via AppSync
resource "aws_appsync_datasource" "user_lambda_datasource" {
  count = var.enable_appsync_datasources ? 1 : 0 # Conditional creation

  api_id           = var.appsync_api_id # Required if AppSync is used
  name             = "${var.graphql_api_name}_UserLambdaDS"
  service_role_arn = var.appsync_lambda_ds_role_arn # IAM role for AppSync to invoke Lambda
  type             = "AWS_LAMBDA"

  lambda_config {
    function_arn = var.user_service_lambda_arn # ARN of the Lambda function handling user logic
  }

  description = "Lambda Data Source for User operations"
}

# Example: Lambda data source for resolving product-related queries/mutations via AppSync
resource "aws_appsync_datasource" "product_lambda_datasource" {
  count = var.enable_appsync_datasources ? 1 : 0 # Conditional creation

  api_id           = var.appsync_api_id # Required if AppSync is used
  name             = "${var.graphql_api_name}_ProductLambdaDS"
  service_role_arn = var.appsync_lambda_ds_role_arn # IAM role for AppSync to invoke Lambda
  type             = "AWS_LAMBDA"

  lambda_config {
    function_arn = var.product_service_lambda_arn # ARN of the Lambda function handling product logic
  }

  description = "Lambda Data Source for Product operations"
}