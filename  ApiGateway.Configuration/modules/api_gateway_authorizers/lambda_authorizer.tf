# Defines aws_api_gateway_authorizer resources for Lambda authorizer types

resource "aws_api_gateway_authorizer" "lambda_authorizer" {
  for_each = var.lambda_authorizers_config

  name                             = each.value.name
  rest_api_id                      = var.rest_api_id
  type                             = each.value.type # "TOKEN" or "REQUEST"
  authorizer_uri                   = each.value.authorizer_uri # Lambda function ARN with version/alias
  identity_source                  = each.value.identity_source # e.g., "method.request.header.Authorization" or "method.request.querystring.auth"
  authorizer_credentials           = lookup(each.value, "authorizer_credentials", null) # IAM role ARN for API Gateway to invoke the Lambda
  authorizer_result_ttl_in_seconds = lookup(each.value, "authorizer_result_ttl_in_seconds", 300)
  identity_validation_expression   = lookup(each.value, "identity_validation_expression", null)
}