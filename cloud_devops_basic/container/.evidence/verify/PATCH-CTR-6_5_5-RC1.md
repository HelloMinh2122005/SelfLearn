### VERIFY LEDGER: PATCH-CTR-6_5_5 recheck 1
**Verifier**: `verifier`, mode recheck

| ID | Lesson | Claim as written | URL + section | Quote | Applies to | Status | Correct statement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| R5.22 | 6_5_5 | Helm mặc định không có lệnh `plan`; `helm-diff` xem trước thay đổi dạng diff trước `helm upgrade`. Mặc định `helm diff upgrade <release> <chart>` chỉ so sánh manifest release gần nhất với manifest render từ chart mới; để kiểm tra drift với tài nguyên thực tế trên cluster theo cơ chế three-way merge cần `--three-way-merge` (hoặc `HELM_DIFF_THREE_WAY_MERGE=true`). | https://github.com/databus23/helm-diff#three-way-merge | "generates a diff between the latest deployed version of a release and a helm template-rendered manifest ... --three-way-merge diffs against what is actually in the cluster ... builds a three-way merge patch ... HELM_DIFF_THREE_WAY_MERGE=true" | Helm 3.18+ / Helm 4; helm-diff | VERIFIED | |

#### Notes
- R5.22: Verified across three owning pages: (1) Native Helm CLI (`https://helm.sh/docs/helm/helm/`) lists no `plan` subcommand; (2) Helm Related Projects (`https://helm.sh/docs/community/related/`) lists `Helm Diff - Preview helm upgrade as a coloured diff`; (3) `helm-diff` README (`https://github.com/databus23/helm-diff#upgrade`, `#three-way-merge`) states default `--output` is `"diff"`, `HELM_DIFF_THREE_WAY_MERGE=true` is equivalent to `--three-way-merge`, and `--three-way-merge` diffs against live cluster objects via a three-way merge patch rather than only against the last release manifest.
