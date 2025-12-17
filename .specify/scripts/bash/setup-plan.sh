#!/bin/bash
# Setup script for implementation planning workflow
# Usage: setup-plan.sh --json [feature-spec-path]

set -euo pipefail

# Default values
FEATURE_SPEC="${1:-specs/001-stride-application/spec.md}"
SPECS_DIR="specs/001-stride-application"
BRANCH="001-stride-application"
IMPL_PLAN="${SPECS_DIR}/impl-plan.md"

# If --json flag is provided, output JSON
if [[ "${1:-}" == "--json" ]]; then
    FEATURE_SPEC="${2:-specs/001-stride-application/spec.md}"
    cat <<EOF
{
  "FEATURE_SPEC": "${FEATURE_SPEC}",
  "IMPL_PLAN": "${IMPL_PLAN}",
  "SPECS_DIR": "${SPECS_DIR}",
  "BRANCH": "${BRANCH}"
}
EOF
    exit 0
fi

# Create directories if they don't exist
mkdir -p "${SPECS_DIR}/contracts"
mkdir -p "${SPECS_DIR}/design"

# Copy template if impl-plan doesn't exist
if [[ ! -f "${IMPL_PLAN}" ]]; then
    if [[ -f ".specify/templates/impl-plan.md" ]]; then
        cp ".specify/templates/impl-plan.md" "${IMPL_PLAN}"
        echo "Created ${IMPL_PLAN} from template"
    else
        echo "Warning: Template not found at .specify/templates/impl-plan.md"
    fi
fi

echo "Setup complete:"
echo "  Feature Spec: ${FEATURE_SPEC}"
echo "  Implementation Plan: ${IMPL_PLAN}"
echo "  Specs Directory: ${SPECS_DIR}"
echo "  Branch: ${BRANCH}"
