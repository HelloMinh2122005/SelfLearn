### VERIFY LEDGER: PATCH-CTR-6_5_5 chunk V1
**Verifier**: `verifier`, mode full

| ID | Lesson | Claim as written | URL + section | Quote | Applies to | Status | Correct statement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| R5.22 | 6_5_5 | Helm mặc định không có `plan`; `helm-diff` kiểm tra drift với tài nguyên đang chạy thực tế bằng `helm diff upgrade <release> <chart>` thực hiện so sánh ba chiều và in git diff. | https://github.com/databus23/helm-diff#three-way-merge | "--three-way-merge diffs against what is actually in the cluster rather than against the manifests of the last release, so changes made outside of Helm show up too. ... builds a three-way merge patch from the old release manifest, the new release manifest and the live object" | Helm 3.18+ / Helm 4; helm-diff | FAIL | Helm mặc định không có lệnh `plan` (chỉ có `helm upgrade --dry-run` hoặc `helm template`). Cộng đồng dùng plugin `helm-diff` để xem trước diff (`--output diff` mặc định). Mặc định, `helm diff upgrade <release> <chart>` chỉ so sánh manifest của release đã triển khai gần nhất với manifest render từ chart mới; để kiểm tra drift với tài nguyên đang chạy thực tế trên cluster theo cơ chế three-way merge, cần thêm `--three-way-merge` (hoặc `HELM_DIFF_THREE_WAY_MERGE=true`). |

#### Notes
- R5.22: Default `helm diff upgrade` behavior (`https://github.com/databus23/helm-diff#upgrade`): "It basically generates a diff between the latest deployed version of a release and a helm template-rendered manifest (or helm upgrade --dry-run when HELM_DIFF_USE_UPGRADE_DRY_RUN=true is set)." Native Helm CLI commands (`https://helm.sh/docs/helm/helm/`) list no `plan` command; Helm Diff is listed under related projects (`https://helm.sh/docs/community/related/`).
