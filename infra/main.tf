resource "aws_ecr_repository" "fundsui_aer" {
  name                 = "fundsui"
  image_tag_mutability = "IMMUTABLE_WITH_EXCLUSION"

  image_tag_mutability_exclusion_filter {
    filter      = "latest*"
    filter_type = "WILDCARD"
  }
}
