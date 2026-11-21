### VERIFY LEDGER: WRITE-6_7_7 chunk V2
**Verifier**: `verifier`, mode full

| ID | Lesson | Claim as written | URL + section | Quote | Applies to | Status | Correct statement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C7.11 | 6_7_7 | PDB chỉ cho phép định nghĩa một trong hai trường spec.minAvailable hoặc spec.maxUnavailable | https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget | "You can specify only one of maxUnavailable and minAvailable in a single PodDisruptionBudget." | Kubernetes policy/v1 | VERIFIED | |
| C7.12 | 6_7_7 | spec.minAvailable và spec.maxUnavailable có thể khai báo là số nguyên tuyệt đối hoặc tỉ lệ phần trăm | https://kubernetes.io/docs/tasks/run-application/configure-pdb/#rounding-logic-when-specifying-percentages | "Values for minAvailable or maxUnavailable can be expressed as integers or as a percentage." | Kubernetes policy/v1 | VERIFIED | |
| C7.13 | 6_7_7 | kubectl drain mặc định dừng và báo lỗi nếu có Pod DaemonSet trừ khi có cờ --ignore-daemonsets | https://kubernetes.io/docs/reference/kubectl/generated/kubectl_drain/#synopsis | "If there are daemon set-managed pods, drain will not proceed without --ignore-daemonsets" | Kubernetes kubectl | VERIFIED | |
| C7.14 | 6_7_7 | kubectl drain mặc định từ chối trục xuất Pod gắn ổ đĩa tạm emptyDir trừ khi có cờ --delete-emptydir-data | https://kubernetes.io/docs/reference/kubectl/generated/kubectl_drain/#options | "Continue even if there are pods using emptyDir (local data that will be deleted when the node is drained)." | Kubernetes kubectl | VERIFIED | |
| C7.15 | 6_7_7 | Pod chạy độc lập không có controller thì drain từ chối trừ khi có cờ --force | https://kubernetes.io/docs/reference/kubectl/generated/kubectl_drain/#synopsis | "If there are any pods that are neither mirror pods nor managed by a replication controller, replica set, daemon set, stateful set, or job, then drain will not delete any pods unless you use --force." | Kubernetes kubectl | VERIFIED | |
| C7.16 | 6_7_7 | PDB với minAvailable bằng tổng số replicas hoặc maxUnavailable bằng 0 khiến drain bị treo vô tận | https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget | "If you set maxUnavailable to 0% or 0, or you set minAvailable to 100% or the number of replicas, you are requiring zero voluntary evictions. ... If you try to drain a Node where an unevictable Pod is running, the drain never completes." | Kubernetes policy/v1 | VERIFIED | |
| C7.17 | 6_7_7 | Cờ --timeout thiết lập thời gian chờ tối đa cho drain, tự động thoát kèm mã lỗi nếu chưa hoàn tất | https://kubernetes.io/docs/reference/kubectl/generated/kubectl_drain/#options | "The length of time to wait before giving up, zero means infinite" | Kubernetes kubectl | VERIFIED | |

#### Notes
- None
