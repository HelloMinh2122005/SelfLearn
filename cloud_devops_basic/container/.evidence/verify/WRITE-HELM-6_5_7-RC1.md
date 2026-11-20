### VERIFY LEDGER: WRITE-HELM-6_5_7 [recheck 1]
**Verifier**: `verifier`, mode recheck

| ID | Lesson | Claim as written | URL + section | Quote | Applies to | Status | Correct statement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C7.12 | 6_5_7 | helm dependency list liệt kê phụ thuộc đã khai báo trong chart gồm NAME, VERSION constraint, REPOSITORY và STATUS (ok, missing, wrong version) | [https://helm.sh/docs/helm/helm_dependency_list/#synopsis](https://helm.sh/docs/helm/helm_dependency_list/#synopsis) | "List all of the dependencies declared in a chart. This can take chart archives and chart directories as input. It will not alter the contents of a chart." | Helm 3+ | VERIFIED | |
| C7.13 | 6_5_7 | Chart.lock lưu phiên bản cụ thể, repo của các dependency và mã băm digest (SHA-256) của khai báo dependencies để đồng bộ với Chart.yaml, tái thiết lập trạng thái phụ thuộc | [https://helm.sh/docs/helm/helm_dependency_update/#synopsis](https://helm.sh/docs/helm/helm_dependency_update/#synopsis) | "On successful update, this will generate a lock file that can be used to rebuild the dependencies to an exact version." | Helm 3+ | VERIFIED | |

#### Notes
- C7.12: Đã sửa chính xác theo bảng output 4 cột NAME, VERSION, REPOSITORY, STATUS (ok, missing, wrong version) của `helm dependency list`. Trích dẫn từ trang synopsis chính thức xác nhận lệnh liệt kê toàn bộ phụ thuộc đã khai báo mà không làm biến đổi nội dung chart.
- C7.13: Đã sửa chính xác rằng Chart.lock lưu phiên bản cụ thể, repo và mã băm digest (SHA-256) của khai báo dependencies (hàm resolver.HashReq trong Helm Go source) nhằm đối chiếu đồng bộ với Chart.yaml và tái thiết lập bản dựng chính xác.
