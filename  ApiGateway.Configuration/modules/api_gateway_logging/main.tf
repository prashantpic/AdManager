locals {
  # Determine the final log group name
  log_group_name = substr(var.log_group_name_prefix, 0, min(length(var.log_group_name_prefix), 255 - (1 + 36))) # Max length 256, reserve for suffix
  # Ensure prefix doesn't end with / and doesn't contain invalid characters.
  # A common pattern is `/aws/apigateway/${api_name}/${stage_name}` but this module creates a generic one.
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  count = var.enabled ? 1 : 0

  name              = local.log_group_name
  retention_in_days = var.log_retention_in_days
  kms_key_id        = var.log_group_kms_key_id # Optional: for encryption

  tags = var.tags
}

data "aws_iam_policy_document" "apigw_cloudwatch_logging_assume_role" {
  count = var.enabled && var.create_cloudwatch_role ? 1 : 0
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "apigw_cloudwatch_logging_role" {
  count = var.enabled && var.create_cloudwatch_role ? 1 : 0

  name               = "${var.cloudwatch_role_name_prefix}-apigw-logging-role"
  assume_role_policy = data.aws_iam_policy_document.apigw_cloudwatch_logging_assume_role[0].json
  description        = "IAM role for API Gateway to push logs to CloudWatch."

  tags = var.tags
}

data "aws_iam_policy_document" "apigw_cloudwatch_logging_policy" {
  count = var.enabled && var.create_cloudwatch_role ? 1 : 0
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:PutLogEvents",
      "logs:GetLogEvents",
      "logs:FilterLogEvents"
    ]
    resources = [
      "arn:aws:logs:*:*:log-group:${local.log_group_name}:*",
      "arn:aws:logs:*:*:log-group:${local.log_group_name}"
      # Add more specific log group ARNs if this role is used for multiple log groups managed elsewhere
    ]
  }
}

resource "aws_iam_role_policy" "apigw_cloudwatch_logging_policy" {
  count = var.enabled && var.create_cloudwatch_role ? 1 : 0

  name   = "${var.cloudwatch_role_name_prefix}-apigw-logging-policy"
  role   = aws_iam_role.apigw_cloudwatch_logging_role[0].id
  policy = data.aws_iam_policy_document.apigw_cloudwatch_logging_policy[0].json
}

resource "aws_api_gateway_account" "this" {
  count = var.enabled ? 1 : 0

  cloudwatch_role_arn = var.create_cloudwatch_role ? aws_iam_role.apigw_cloudwatch_logging_role[0].arn : var.existing_cloudwatch_role_arn

  # Ensure role exists before setting it on the account
  depends_on = [aws_iam_role.apigw_cloudwatch_logging_role]
}

# The actual configuration of access logs and execution logs on API Gateway stages
# should be done within the `api_gateway_stages` module by passing the
# `aws_cloudwatch_log_group.api_gateway_logs[0].arn` and other logging parameters
# (like format, level) to it. This module, `api_gateway_logging`, focuses on
# creating the necessary CloudWatch and IAM resources for logging.