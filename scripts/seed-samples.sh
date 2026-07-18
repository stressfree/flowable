#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Decisioning Bundle Manager v2 — Sample Data Seed Script
# Creates companies, uploads 6 sample bundles, sets entrypoints,
# validates, and publishes select bundles.
# ============================================================

BASE_URL="${BASE_URL:-http://localhost:8082/v1}"
SAMPLES_DIR="${SAMPLES_DIR:-samples}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# Company IDs
ACME_ID=""
ACME_EU_ID=""
TECHSTART_ID=""
GOVCONTRACT_ID=""

# Bundle IDs
BUNDLE_1A_ID=""
BUNDLE_1B_ID=""
BUNDLE_1C_ID=""
BUNDLE_2_ID=""
BUNDLE_3_ID=""
BUNDLE_4_ID=""

# ============================================================
# Step 0: Verify API is reachable
# ============================================================
info "Checking API availability at ${BASE_URL}..."
if ! curl -sf "${BASE_URL}/bundle-types" > /dev/null 2>&1; then
  error "API is not reachable at ${BASE_URL}"
  error "Start the backend service first."
  exit 1
fi
info "API is reachable."

# ============================================================
# Step 1: Create Companies
# ============================================================
info "Creating sample companies..."

create_company() {
  local name="$1"
  local parent_id="${2:-}"
  local payload

  if [ -n "$parent_id" ]; then
    payload="{\"name\":\"${name}\",\"parentCompanyId\":${parent_id}}"
  else
    payload="{\"name\":\"${name}\"}"
  fi

  local response
  response=$(curl -sf -X POST "${BASE_URL}/companies" \
    -H "Content-Type: application/json" \
    -d "${payload}" 2>&1) || {
    error "Failed to create company: ${name}" >&2
    error "${response}" >&2
    exit 1
  }

  local id
  id=$(echo "${response}" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null) || {
    error "Failed to parse company ID from response: ${response}" >&2
    exit 1
  }
  echo "${id}"
}

ACME_ID=$(create_company "Acme Corp")
info "  Created 'Acme Corp' (ID: ${ACME_ID})"

ACME_EU_ID=$(create_company "Acme EU" "${ACME_ID}")
info "  Created 'Acme EU' as child of Acme Corp (ID: ${ACME_EU_ID})"

TECHSTART_ID=$(create_company "TechStart Inc")
info "  Created 'TechStart Inc' (ID: ${TECHSTART_ID})"

GOVCONTRACT_ID=$(create_company "GovContract LLC")
info "  Created 'GovContract LLC' (ID: ${GOVCONTRACT_ID})"

# ============================================================
# Step 2: Upload Sample Bundles
# ============================================================
info "Uploading sample bundles..."

upload_bundle() {
  local company_id="$1"
  local bundle_type="$2"
  local description="$3"
  shift 3
  local files=("$@")

  info "  Uploading bundle: ${description}" >&2

  local curl_args=()
  curl_args+=(-X POST "${BASE_URL}/bundles")
  curl_args+=(-F "bundleType=${bundle_type}")
  curl_args+=(-F "description=${description}")

  if [ "$company_id" != "global" ]; then
    curl_args+=(-F "companyId=${company_id}")
  fi

  for file in "${files[@]}"; do
    local filepath="${SAMPLES_DIR}/${file}"
    if [ ! -f "$filepath" ]; then
      error "File not found: ${filepath}"
      exit 1
    fi
    curl_args+=(-F "files=@${filepath}")
  done

  local response
  response=$(curl -sf "${curl_args[@]}" 2>&1) || {
    error "Failed to upload bundle: ${description}"
    error "${response}"
    exit 1
  }

  local id
  id=$(echo "${response}" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null) || {
    error "Failed to parse bundle ID from response: ${response}"
    exit 1
  }

  echo "${id}"
}

set_entrypoint() {
  local bundle_id="$1"
  local entrypoint_filename="$2"

  info "  Setting entrypoint for bundle ${bundle_id} -> ${entrypoint_filename}"

  local bundle_json
  bundle_json=$(curl -sf "${BASE_URL}/bundles/${bundle_id}" 2>&1) || {
    error "Failed to get bundle ${bundle_id}"
    exit 1
  }

  local file_id
  file_id=$(echo "${bundle_json}" | python3 -c "
import sys, json
bundle = json.load(sys.stdin)
for f in bundle.get('files', []):
    if f['filename'] == '${entrypoint_filename}':
        print(f['id'])
        break
" 2>/dev/null) || {
    error "Failed to find file '${entrypoint_filename}' in bundle ${bundle_id}"
    exit 1
  }

  if [ -z "$file_id" ]; then
    error "Entrypoint file '${entrypoint_filename}' not found in bundle ${bundle_id}"
    exit 1
  fi

  curl -sf -X PUT "${BASE_URL}/bundles/${bundle_id}/entrypoint" \
    -H "Content-Type: application/json" \
    -d "{\"fileId\": ${file_id}}" > /dev/null 2>&1 || {
    error "Failed to set entrypoint for bundle ${bundle_id}"
    exit 1
  }
}

validate_bundle() {
  local bundle_id="$1"
  local bundle_name="$2"

  info "  Validating bundle: ${bundle_name} (ID: ${bundle_id})"

  local response
  response=$(curl -sf -X POST "${BASE_URL}/bundles/${bundle_id}/validate" 2>&1) || {
    error "Validation failed for bundle: ${bundle_name}"
    error "${response}"
    exit 1
  }

  local error_count
  error_count=$(echo "${response}" | python3 -c "
import sys, json
data = json.load(sys.stdin)
errors = data.get('validationErrors', [])
print(len(errors))
" 2>/dev/null) || error_count="unknown"

  if [ "$error_count" = "0" ]; then
    info "    Validation passed — no errors"
  else
    warn "    Validation returned ${error_count} errors"
    echo "${response}" | python3 -m json.tool 2>/dev/null || true
  fi
}

publish_bundle() {
  local bundle_id="$1"
  local bundle_name="$2"

  info "  Publishing bundle: ${bundle_name} (ID: ${bundle_id})"

  curl -sf -X POST "${BASE_URL}/bundles/${bundle_id}/publish" \
    -H "Content-Type: application/json" \
    -d '{}' > /dev/null 2>&1 || {
    error "Failed to publish bundle: ${bundle_name}"
    exit 1
  }
}

# --- Bundle 1A: Expense Approval - Standard with Escalation ---
BUNDLE_1A_ID=$(upload_bundle \
  "${ACME_ID}" \
  "EXPENSE_APPROVAL" \
  "Expense Approval 1A: Standard with Time + Travel Escalation" \
  "expense-standard-escalation.bpmn" \
  "travel-check.dmn" \
  "expense-submitted.event")
set_entrypoint "${BUNDLE_1A_ID}" "expense-standard-escalation.bpmn"
validate_bundle "${BUNDLE_1A_ID}" "Expense 1A"
publish_bundle "${BUNDLE_1A_ID}" "Expense 1A"
info "  Bundle 1A complete (ID: ${BUNDLE_1A_ID})"

# --- Bundle 1B: Expense Approval - Government Client ---
BUNDLE_1B_ID=$(upload_bundle \
  "${GOVCONTRACT_ID}" \
  "EXPENSE_APPROVAL" \
  "Expense Approval 1B: Government Client + Travel Escalation" \
  "expense-gov-client-review.bpmn" \
  "line-item-classification.dmn" \
  "travel-check.dmn")
set_entrypoint "${BUNDLE_1B_ID}" "expense-gov-client-review.bpmn"
validate_bundle "${BUNDLE_1B_ID}" "Expense 1B"
publish_bundle "${BUNDLE_1B_ID}" "Expense 1B"
info "  Bundle 1B complete (ID: ${BUNDLE_1B_ID})"

# --- Bundle 1C: Expense Approval - Tiered Amount ---
BUNDLE_1C_ID=$(upload_bundle \
  "${TECHSTART_ID}" \
  "EXPENSE_APPROVAL" \
  "Expense Approval 1C: Tiered Amount with Time Escalation" \
  "expense-tiered-escalation.bpmn" \
  "amount-thresholds.dmn")
set_entrypoint "${BUNDLE_1C_ID}" "expense-tiered-escalation.bpmn"
validate_bundle "${BUNDLE_1C_ID}" "Expense 1C"
info "  Bundle 1C complete (ID: ${BUNDLE_1C_ID}) — left as DRAFT"

# --- Bundle 2: Virtual Card Approval ---
BUNDLE_2_ID=$(upload_bundle \
  "${ACME_ID}" \
  "VIRTUAL_CARD_APPROVAL" \
  "Virtual Card Approval with Eligibility and Limit Check" \
  "virtual-card-approval.bpmn" \
  "card-eligibility.dmn" \
  "card-limit-check.dmn")
set_entrypoint "${BUNDLE_2_ID}" "virtual-card-approval.bpmn"
validate_bundle "${BUNDLE_2_ID}" "Virtual Card"
publish_bundle "${BUNDLE_2_ID}" "Virtual Card"
info "  Bundle 2 complete (ID: ${BUNDLE_2_ID})"

# --- Bundle 3: Physical Card with KYC ---
BUNDLE_3_ID=$(upload_bundle \
  "${ACME_EU_ID}" \
  "PHYSICAL_CREDIT_CARD_APPROVAL" \
  "Physical Card Approval with KYC and Risk Assessment" \
  "physical-card-kyc.bpmn" \
  "kyc-validation.dmn" \
  "risk-assessment.dmn")
set_entrypoint "${BUNDLE_3_ID}" "physical-card-kyc.bpmn"
validate_bundle "${BUNDLE_3_ID}" "Physical Card KYC"
publish_bundle "${BUNDLE_3_ID}" "Physical Card KYC"
info "  Bundle 3 complete (ID: ${BUNDLE_3_ID})"

# --- Bundle 4: Card Controls (CMMN + BPMN + DMN) ---
BUNDLE_4_ID=$(upload_bundle \
  "global" \
  "CARD_CONTROLS_CHANGE_APPROVAL" \
  "Card Controls Change Approval (CMMN + BPMN + DMN)" \
  "card-controls-case.cmmn" \
  "card-controls-process.bpmn" \
  "apply-card-changes.bpmn" \
  "card-control-thresholds.dmn")
set_entrypoint "${BUNDLE_4_ID}" "card-controls-case.cmmn"
validate_bundle "${BUNDLE_4_ID}" "Card Controls"
publish_bundle "${BUNDLE_4_ID}" "Card Controls"
info "  Bundle 4 complete (ID: ${BUNDLE_4_ID})"

# ============================================================
# Step 3: Summary
# ============================================================
echo ""
echo "============================================================"
info "Seed complete! Summary:"
echo "============================================================"
echo ""
echo "  Companies created:"
echo "    Acme Corp          (ID: ${ACME_ID})"
echo "    Acme EU            (ID: ${ACME_EU_ID}) — child of Acme Corp"
echo "    TechStart Inc      (ID: ${TECHSTART_ID})"
echo "    GovContract LLC    (ID: ${GOVCONTRACT_ID})"
echo ""
echo "  Bundles uploaded (6 total):"
echo "    1A: Expense Standard Escalation  (ID: ${BUNDLE_1A_ID}) — PUBLISHED"
echo "    1B: Expense Gov Client Review    (ID: ${BUNDLE_1B_ID}) — PUBLISHED"
echo "    1C: Expense Tiered Escalation    (ID: ${BUNDLE_1C_ID}) — DRAFT"
echo "    2:  Virtual Card Approval        (ID: ${BUNDLE_2_ID}) — PUBLISHED"
echo "    3:  Physical Card KYC            (ID: ${BUNDLE_3_ID}) — PUBLISHED"
echo "    4:  Card Controls (CMMN)         (ID: ${BUNDLE_4_ID}) — PUBLISHED"
echo ""
echo "  Published: 5 bundles (1A, 1B, 2, 3, 4)"
echo "  Draft:     1 bundle  (1C)"
echo ""
info "All operations completed successfully."
echo "============================================================"
