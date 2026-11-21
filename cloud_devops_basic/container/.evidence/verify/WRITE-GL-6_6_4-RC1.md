### VERIFY LEDGER: WRITE-GL-6_6_4 recheck 1
**Verifier**: `verifier`, mode recheck

| ID | Lesson | Claim as written | URL + section | Quote | Applies to | Status | Correct statement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C4.7 | 6_6_4 | Shell Executor thực thi script trên host bằng user của daemon; ở trạng thái maintenance mode (chỉ nhận critical security updates) và cung cấp cách ly hạn chế | https://docs.gitlab.com/runner/executors/shell.html#the-shell-executor | "This executor is in maintenance mode. It receives critical security updates but no new features are planned. For new projects, consider using one of the actively developed executors... the Shell executor provides limited isolation between jobs." | GitLab Runner / Shell Executor | VERIFIED | |
| C4.11 | 6_6_4 | Lệnh gitlab-runner register luồng mới vẫn nhận tham số cấu hình cục bộ (--executor, --docker-image), chỉ loại bỏ --registration-token cũ và các cờ metadata đã chuyển lên UI/API | https://docs.gitlab.com/runner/register/#legacy-compatible-registration-process | "The legacy-compatible registration process ignores the following command-line parameters. These parameters can only be configured when a runner is created in the UI or with the API." | GitLab Runner 16.0+ | VERIFIED | |
| C4.12 | 6_6_4 | Từ khóa tags chỉ định tag yêu cầu; mặc định runner có gắn tag sẽ nhận job nếu runner sở hữu toàn bộ các tag được khai báo trong job (có thể có thêm tag khác ngoài danh sách) | https://docs.gitlab.com/ci/runners/configure_runners/#use-tags-to-control-which-jobs-a-runner-can-run | "For a runner to be selected to run a job, it must have all of the tags defined in the job script block." | GitLab CI/CD | VERIFIED | |

#### Notes
- C4.7: Author updated lesson L50 to record that Shell executor is in maintenance mode (only receiving critical security updates) and provides limited isolation between jobs, exactly matching GitLab documentation.
- C4.11: Author clarified in L66 and hands-on block L146-155 that local configuration flags (`--executor`, `--docker-image`, `--description`) remain supported in `gitlab-runner register`, while only legacy registration token and metadata flags (`--tag-list`, `--run-untagged`, etc.) were deprecated and moved to UI/API.
- C4.12: Author clarified in L70 that tag matching requires the runner to possess all tags specified by the job, while allowing the runner to possess additional tags (superset match).
