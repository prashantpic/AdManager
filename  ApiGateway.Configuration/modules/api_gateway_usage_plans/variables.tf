variable "usage_plans_config" {
  description = "Configuration for usage plans. Key is the usage plan logical name."
  type = map(object({
    name        = string
    description = optional(string)
    throttle_settings = optional(object({ # Global throttle for the plan
      rate_limit  = optional(number)
      burst_limit = optional(number)
    }))
    quota_settings = optional(object({
      limit  = number
      period = string # "DAY", "WEEK", or "MONTH"
      offset = optional(number, 0)
    }))
    associated_api_stages = optional(list(object({ # API stages to associate with this plan
      api_id = string
      stage  = string
      throttle = optional(list(object({ # Per-method throttling within this stage for this plan
        path        = string # e.g., "/pets/GET" or "/*" for all methods in the stage
        rate_limit  = optional(number)
        burst_limit = optional(number)
      })))
    })), [])
  }))
  default = {}
}

variable "api_keys_config" {
  description = "Configuration for API keys. Key is the API key logical name."
  type = map(object({
    name        = string
    description = optional(string)
    enabled     = optional(bool, true)
    value       = optional(string) # If provided, this value is used. Otherwise, AWS generates it.
    associated_usage_plan_names = optional(list(string), []) # List of logical usage plan names to associate this key with.
    tags        = optional(map(string))
  }))
  default = {}
}

variable "tags" {
  description = "A map of common tags to assign to resources."
  type        = map(string)
  default     = {}
}