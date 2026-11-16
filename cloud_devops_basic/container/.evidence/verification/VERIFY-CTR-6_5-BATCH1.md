### VERIFICATION REPORT: RUN-CTR-6_5-BATCH1
**Verdict**: FAIL
**Script**: exit 1, 1 error, 9 warnings (`check_curriculum.py` 0 errors, 9 warnings; `evidence.py lesson 6_5_3` exit 1, 1 error)
**Mode**: Full
**Claims**: 110 total, 109 PASS, 1 FAIL, 0 UNVERIFIED (106 tagged, 4 untagged)

#### Per-File Summary
- `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_5 Helm Package Management/6_5_1 Helm Core Concepts.md`: **PASS** (Claims: 34 total, 34 PASS, 0 FAIL, 0 UNVERIFIED; Mechanical: exit 0, 0 errors, 0 warnings)
- `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_5 Helm Package Management/6_5_2 Chart Structure.md`: **PASS** (Claims: 35 total, 35 PASS, 0 FAIL, 0 UNVERIFIED; Mechanical: exit 0, 0 errors, 0 warnings)
- `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_5 Helm Package Management/6_5_3 Template Language.md`: **FAIL** (Claims: 41 total, 40 PASS, 1 FAIL [mechanical quote mismatch], 0 UNVERIFIED; Mechanical: exit 1, 1 error [R1.39 MISSING])

#### Failures
| File:Line | Claim as written | Correct statement | Source URL + section | Verbatim quote |
| :--- | :--- | :--- | :--- | :--- |
| `6_5_3 Template Language.md:63,87,205,233,235,236,237` (Tag `R1.39`) | "Lookup does not contact the Kubernetes API server during standard dry-run commands and requires dry-run=server." | The claim is technically accurate, but the ledger quote in `TASK-CTR-6_5-R1.md` row R1.39 used slashes `/` instead of pipe symbols `\|` (`helm template/install/upgrade` instead of `helm template\|install\|upgrade`), causing `evidence.py lesson` to report `ERROR R1.39 MISSING` and exit with code 1. Remedy: Fix quote in `TASK-CTR-6_5-R1.md` row R1.39 to use `\|` or drop the redundant `R1.39` tag from `6_5_3` (as `R2.51` already covers this fact and passed with `FOUND`). | `https://helm.sh/docs/chart_template_guide/functions_and_pipelines/#using-the-lookup-function` | `"Keep in mind that Helm is not supposed to contact the Kubernetes API Server during a helm template\|install\|upgrade --dry-run operation. To test lookup against a running cluster, helm template\|install\|upgrade --dry-run=server should be used"` |

#### Unverified
| File:Line | Claim | What was searched |
| :--- | :--- | :--- |
| None | None | None |

#### Tags to Add (correct but untagged)
- `6_5_1 Helm Core Concepts.md:176`: `https://raw.githubusercontent.com/helm/helm/main/pkg/storage/driver/secrets.go#L243` (Release JSON stored under `.data.release`)
- `6_5_2 Chart Structure.md:181`: `https://json-schema.org/draft-07/schema#` (JSON Schema Draft 7 standard schema URL)
- `6_5_2 Chart Structure.md:230`: `https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/` (CRD v1 API group `apiextensions.k8s.io/v1`)
- `6_5_3 Template Language.md:148`: `https://raw.githubusercontent.com/helm/helm/main/pkg/chartutil/create.go` (Standard chart helper naming convention and trunc 63 pattern)

#### Not Checked
- None (All 3 lessons, all tagged claims, all untagged technical assertions, headings, links, and code snippets were checked against Tier-1 sources and scripts).

#### Coverage Gaps
- `6_5_2 Chart Structure`: The README bullet mentions `dependencies` in `Chart.yaml`, but `Chart.yaml` field listing in 6_5_2 omits the `dependencies` key (it is covered extensively later in 6_5_7). Recommend adding a brief 1-line mention of `dependencies:` field in Section 1.1 or pointing forward to 6_5_7.
