output "authorizer_ids" {
  description = "Map of authorizer names to their generated IDs."
  value = merge(
    { for k, v in aws_api_gateway_authorizer.jwt_authorizers : k => v.id },
    { for k, v in aws_api_gateway_authorizer.lambda_authorizers : k => v.id }
  )
}

output "jwt_authorizer_details" {
  description = "Details of the created JWT authorizers."
  value       = aws_api_gateway_authorizer.jwt_authorizers
}

output "lambda_authorizer_details" {
  description = "Details of the created Lambda authorizers."
  value       = aws_api_gateway_authorizer.lambda_authorizers
}