# This file is typically used when AWS AppSync is the GraphQL engine.
# For API Gateway v2 HTTP API proxying to a NestJS GraphQL backend,
# direct AppSync resolvers configured here are not applicable.

# Example: Resolver for the `getUser` query using the User Lambda Data Source (AppSync context)
resource "aws_appsync_resolver" "get_user_resolver" {
  count = var.enable_appsync_resolvers ? 1 : 0 # Conditional creation

  api_id      = var.appsync_api_id     # Required if AppSync is used
  type        = "Query"                # The GraphQL type this resolver is part of
  field       = "getUser"              # The field this resolver handles
  data_source = var.user_lambda_datasource_name # Name of the aws_appsync_datasource

  request_template  = file("${path.module}/templates/default_request.vtl")
  response_template = file("${path.module}/templates/default_response.vtl")

  # For direct Lambda invocation (without VTL request/response templates if Lambda handles everything)
  # kind = "UNIT"
  # If you want to bypass VTL and send the GraphQL arguments directly to Lambda:
  # request_template = <<EOF
  # {
  #   "version": "2017-02-28",
  #   "operation": "Invoke",
  #   "payload": {
  #     "arguments": $utils.toJson($context.arguments),
  #     "identity": $utils.toJson($context.identity),
  #     "source": $utils.toJson($context.source),
  #     "request": $utils.toJson($context.request),
  #     "prev": $utils.toJson($context.prev)
  #   }
  # }
  # EOF
  # response_template = "$util.toJson($context.result)"

  caching_config {
    caching_keys = [
      "$context.identity.sub", # Example: Cache per user
      "$context.arguments.id"  # Cache based on the user ID argument
    ]
    ttl = var.appsync_resolver_cache_ttl
  }

  # Sync config for mutations (if this were a mutation resolver)
  # sync_config {
  #   conflict_detection = "VERSION" # Or NONE, LAMBDA
  #   conflict_handler   = "OPTIMISTIC_CONCURRENCY" # Or AUTOMERGE, LAMBDA
  #   lambda_conflict_handler_config {
  #     lambda_conflict_handler_arn = "arn:aws:lambda:..."
  #   }
  # }

  # max_batch_size = 0 # Default is 0 (no batching). Set for batch invoking Lambda.
  # code           = "" # For JavaScript resolvers (alternative to VTL)
  # runtime {
  #   name            = "APPSYNC_JS"
  #   runtime_version = "1.0.0"
  # }
}