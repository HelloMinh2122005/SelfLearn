# Evidence Index: PATCH-CTR-6_5_5

- **Lesson**: 6_5_5 Release Lifecycle
- **Mode**: patch
- **Target File**: `6 Domain 6 - Containers and Kubernetes/6_5 Helm Package Management/6_5_5 Release Lifecycle.md`
- **Ledgers**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_5_5-REWRITE.md` (R5.1–R5.21)
  - `cloud_devops_basic/container/.evidence/verify/PATCH-CTR-6_5_5-V1.md` (R5.22 initial FAIL)
  - `cloud_devops_basic/container/.evidence/verify/PATCH-CTR-6_5_5-RC1.md` (R5.22 recheck PASS)
- **Patch Claim IDs**:
  - `R5.22`: Helm has no native `plan` command; `helm diff upgrade <release> <chart>` defaults to comparing against the last deployed release manifest, and `--three-way-merge` (or `HELM_DIFF_THREE_WAY_MERGE=true`) is required to diff against live cluster state.
- **All Claim IDs in Lesson**: `R5.1`–`R5.22`
