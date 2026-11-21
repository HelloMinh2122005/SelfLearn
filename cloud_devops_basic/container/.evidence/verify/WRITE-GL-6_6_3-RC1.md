### VERIFY LEDGER: WRITE-GL-6_6_3 recheck 1
**Verifier**: `verifier`, mode recheck

| ID | Lesson | Claim as written | URL + section | Quote | Applies to | Status | Correct statement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C3.10 | 6_6_3 | Biến Masked tự động được runner lọc và thay thế bằng chuỗi [MASKED] mỗi khi giá trị xuất hiện trong console log | https://docs.gitlab.com/ee/ci/variables/index.html#mask-a-cicd-variable | "When a job outputs the value of a masked variable, the value is replaced with [MASKED] in the job log." | GitLab Runner / CI/CD | VERIFIED | |
| C3.11 | 6_6_3 | Để được masked, giá trị của biến phải nằm trên một dòng đơn không chứa bất kỳ khoảng trắng nào (no spaces), dài từ 8 ký tự trở lên | https://docs.gitlab.com/ee/ci/variables/index.html#mask-a-cicd-variable | "The value of the variable must: Be a single line with no spaces. Be 8 characters or longer." | GitLab CI/CD | VERIFIED | |
| C3.12 | 6_6_3 | Kiểu File ghi nội dung ra file tạm gán đường dẫn vào biến; log hiển thị mật khẩu masked dạng [MASKED] và đường dẫn tạm | https://docs.gitlab.com/ee/ci/variables/index.html#use-file-type-cicd-variables | "File type variables: ... The CI/CD variable value saved to a temporary file. The path to the temporary file as the environment variable value." | GitLab Runner / CI/CD | VERIFIED | |

#### Notes
- C3.10: Tác giả đã cập nhật hiển thị `[masked]` thành `[MASKED]` tại L41 và log L201, khớp chính xác tài liệu chính thức của GitLab.
- C3.11: Tác giả đã cập nhật quy định khoảng trắng thành "không chứa bất kỳ khoảng trắng nào (no spaces)" tại L42, khớp với quy định "Be a single line with no spaces".
- C3.12: Khối code minh họa L193-203 đã được sửa thành `[MASKED]`, đồng bộ với mô tả cơ chế lưu file tạm và gán đường dẫn của biến File.
