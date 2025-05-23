output "graphql_api_id" {
  description = "The ID of the deployed GraphQL API (API Gateway v2 HTTP API or AppSync API)."
  value       = var.enabled ? aws_apigatewayv2_api.this[0].id : null
  # value       = var.enabled ? (var.use_appsync ? aws_appsync_graphql_api.appsync_api[0].id : aws_apigatewayv2_api.this[0].id) : null
}

output "graphql_api_endpoint" {
  description = "The invoke URL for the GraphQL API stage (API Gateway v2 HTTP API) or GraphQL endpoint (AppSync)."
  value       = var.enabled ? aws_apigatewayv2_stage.this[0].invoke_url : null
  # value       = var.enabled ? (var.use_appsync ? aws_appsync_graphql_api.appsync_api[0].uris["GRAPHQL"] : aws_apigatewayv2_stage.this[0].invoke_url) : null
}

output "graphql_api_stage_name" {
  description = "The name of the deployed GraphQL API stage (API Gateway v2 HTTP API)."
  value       = var.enabled ? aws_apigatewayv2_stage.this[0].name : null
}