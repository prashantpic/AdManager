output "invoke_url" {
  description = "The invoke URL for the deployed stage."
  value       = aws_api_gateway_stage.this.invoke_url
}

output "stage_name" {
  description = "The name of the deployed stage."
  value       = aws_api_gateway_stage.this.stage_name
}

output "deployment_id" {
  description = "ID of the deployment associated with the stage."
  value       = aws_api_gateway_deployment.this.id
}

output "execution_arn" {
  description = "The execution ARN of the stage."
  value       = aws_api_gateway_stage.this.execution_arn
}