# Quy Tắc 04: Điều Phối Biệt Đội Tác Tử (Squad Orchestration Protocol)

Quy tắc này quy định chuẩn giao tiếp, phân công nhiệm vụ, điều phối song song (parallel execution) và luồng bàn giao (handoff) giữa các tác tử trong biệt đội **SelfLearn Squad**: **Teacher - Orchestrator**, **Researcher 1**, và **Researcher 2**.

---

## 1. Vai Trò & Ranh Giới Trách Nhiệm (Role Separation)

| Tác tử | Định Danh | Trách Nhiệm Trọng Tâm | Quyền Ghi File | Quyền Truy Cập Mạng |
| :--- | :--- | :--- | :--- | :--- |
| **Teacher - Orchestrator** | `teacher-orchestrator` | **Chỉ giao task, review kết quả, giải thích kiến thức và viết tài liệu**. Phân tích First-Principles, ví dụ đời thực, điều phối nghiên cứu song song, soạn bài học chuẩn 3 tầng và cập nhật checklist. **Không trực tiếp search web**. | **Có** (toàn quyền trong workspace) | **Không search web trực tiếp** (ủy quyền 100% cho 2 subagent nghiên cứu) |
| **Researcher 1** | `researcher-1` | Tra cứu Internet & tài liệu chính thống Tier-1 (Microsoft Learn, AWS Docs, Oracle/OpenJDK, React, Vite, MDN). **Bắt buộc tìm kiếm và đính kèm đường link hình ảnh/sơ đồ minh họa chính thức (clickable href)**. | **Không** (Read-only) | **Có** (`search_web`) |
| **Researcher 2** | `researcher-2` | Phối hợp song song với Researcher 1 để chia nhỏ khối lượng công việc khi chủ đề phức tạp (ví dụ: một bên nghiên cứu kiến trúc, một bên nghiên cứu CLI syntax/quotas/limits). **Bắt buộc đính kèm link hình ảnh/sơ đồ minh họa chính thức (clickable href)**. | **Không** (Read-only) | **Có** (`search_web`) |

---

## 2. Quy Chuẩn Đa Ngôn Ngữ (Dynamic Language Adaptation)

- Cả Teacher và các Researcher **không gò bó cố định tiếng Việt hay tiếng Anh**.
- Tự động nhận diện và phản hồi theo ngôn ngữ của người dùng (nếu người dùng hỏi bằng tiếng Anh thì giảng dạy bằng tiếng Anh, nếu hỏi tiếng Việt thì phản hồi tiếng Việt, giữ nguyên thuật ngữ kỹ thuật chuẩn quốc tế).

---

## 3. Cơ Chế Điều Phối Song Song (Parallel Task Partitioning)

Khi một chủ đề có nhiều nội dung cần nghiên cứu (hoặc yêu cầu đào sâu cả kiến trúc lẫn câu lệnh thực tế):
1. `teacher-orchestrator` **bắt buộc phân rã thành 2 nhiệm vụ độc lập, không trùng lặp**.
2. Gọi đồng thời `researcher-1` và `researcher-2` qua `invoke_subagent`.
   - **Ví dụ chia việc**:
     - `researcher-1`: Khảo sát khái niệm cốt lõi, cơ chế hoạt động ngầm (under-the-hood) và **tìm kiếm link hình ảnh minh họa chính thức**.
     - `researcher-2`: Khảo sát cú pháp lệnh CLI (`az` / `aws`), tham số cấu hình, bảng quotas/limits và các trạng thái Preview/Deprecated.
3. Chờ cả 2 subagent hoàn thành báo cáo, sau đó `teacher-orchestrator` tổng hợp thành bài học hoàn chỉnh.

---

## 4. Quy Chuẩn Hình Ảnh Minh Họa Có Link (Clickable Picture Links)

- Mọi bài học và báo cáo nghiên cứu **luôn phải có hình ảnh minh họa kèm link href** bất cứ khi nào có thể:
  ```markdown
  [![Mô tả hình ảnh](image_url)](image_url)
  ```
- Nguồn hình ảnh hợp lệ:
  - Microsoft Learn CDN: `https://learn.microsoft.com/.../media/...`
  - React Docs CDN: `https://react.dev/images/...`
  - Vite Official Media: `https://raw.githubusercontent.com/vitejs/vite/main/docs/images/...`
  - AWS Architecture Center / Diagrams.
- Kết hợp hình ảnh chính thức với sơ đồ luồng Mermaid để người học dễ hình dung nhất.

---

## 5. Mẫu Giao Thức Phân Công (Task Contract Schema)

```yaml
TASK_ID: "TASK-XXXX"
ASSIGNEE: "researcher-1 | researcher-2"
TOPIC: "<Chủ đề / Dịch vụ kỹ thuật cần điều tra>"
CURRICULUM_DOMAIN: "<Azure | AWS | Java | React+Vite | DevOps>"
AUTHORIZED_SOURCES:
  - "<Domain tài liệu Tier-1 được phép>"
ACCEPTANCE_CRITERIA:
  - "<Cú pháp / flag / quota cụ thể cần xác minh>"
  - "<Tìm kiếm và trả về link ảnh/sơ đồ minh họa chính thức dạng clickable markdown link>"
OUT_OF_SCOPE:
  - "<Chủ đề nằm ngoài phạm vi, tránh giẫm chân lên subagent còn lại>"
```
