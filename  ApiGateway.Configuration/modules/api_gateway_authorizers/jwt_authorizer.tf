# Defines aws_api_gateway_authorizer resources for JWT/Cognito types

resource "aws_api_gateway_authorizer" "jwt_authorizer" {
  for_each = var.jwt_authorizers_config

  name                   = each.value.name
  rest_api_id            = var.rest_api_id
  type                   = each.value.type # Should be "COGNITO_USER_POOLS" or "JWT"
  identity_source        = each.value.identity_source # e.g., "method.request.header.Authorization"
  authorizer_credentials = lookup(each.value, "authorizer_credentials", null) # IAM role ARN, if needed
  authorizer_result_ttl_in_seconds = lookup(each.value, "authorizer_result_ttl_in_seconds", 300)

  dynamic "jwt_configuration" {
    for_each = each.value.type == "JWT" && lookup(each.value, "jwt_configuration", null) != null ? [1] : []
    content {
      audience = lookup(each.value.jwt_configuration, "audience", null)
      issuer   = lookup(each.value.jwt_configuration, "issuer", null)
    }
  }

  # For COGNITO_USER_POOLS type
  provider_arns = each.value.type == "COGNITO_USER_POOLS" ? lookup(each.value, "provider_arns", []) : null
}