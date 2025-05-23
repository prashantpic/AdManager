# JWT Authorizers (including Cognito User Pools)
resource "aws_api_gateway_authorizer" "jwt_authorizers" {
  for_each = var.jwt_authorizers_config

  name                             = each.value.name
  rest_api_id                      = var.rest_api_id
  type                             = each.value.type # "COGNITO_USER_POOLS" or "JWT"
  identity_source                  = each.value.identity_source
  authorizer_credentials           = lookup(each.value, "authorizer_credentials", null) # Only for "JWT" type if calling other AWS services
  authorizer_result_ttl_in_seconds = lookup(each.value, "authorizer_result_ttl_in_seconds", 300)

  # For COGNITO_USER_POOLS type
  provider_arns = lookup(each.value, "provider_arns", null) # List of Cognito User Pool ARNs

  # For JWT type (requires identity_provider_arns to be null or not set)
  dynamic "jwt_configuration" {
    for_each = each.value.type == "JWT" && lookup(each.value, "jwt_configuration", null) != null ? [each.value.jwt_configuration] : []
    content {
      audience = lookup(jwt_configuration.value, "audience", null)
      issuer   = lookup(jwt_configuration.value, "issuer", null)
    }
  }
}

# Lambda Authorizers
resource "aws_api_gateway_authorizer" "lambda_authorizers" {
  for_each = var.lambda_authorizers_config

  name                             = each.value.name
  rest_api_id                      = var.rest_api_id
  type                             = each.value.type # "TOKEN" or "REQUEST"
  authorizer_uri                   = each.value.authorizer_uri
  identity_source                  = each.value.identity_source
  authorizer_credentials           = lookup(each.value, "authorizer_credentials", null) # IAM role ARN for API Gateway to invoke the Lambda
  authorizer_result_ttl_in_seconds = lookup(each.value, "authorizer_result_ttl_in_seconds", 300)
  identity_validation_expression   = lookup(each.value, "identity_validation_expression", null) # For TOKEN authorizer
}