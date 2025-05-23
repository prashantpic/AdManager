terraform {
  required_version = ">= 1.6.4"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.30" # Specify a recent stable version
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.3"
    }
    template = { # For modules using data "template_file" if any
      source = "hashicorp/template"
      version = "~> 2.2"
    }
  }
}