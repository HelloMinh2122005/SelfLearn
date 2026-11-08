# Quy Tắc 04: Điều Phối Biệt Đội Tác Tử (Squad Orchestration Protocol)

Quy tắc này quy định chuẩn giao tiếp, phân chia trách nhiệm và quy trình phối hợp khép kín giữa các tác tử trong biệt đội **SelfLearn Squad**:
- **Teacher - Orchestrator**: Điều phối viên & Giảng viên trưởng.
- **Researcher 1 & Researcher 2**: Chuyên viên nghiên cứu Internet & Tài liệu chính thống.
- **Writer 1 & Writer 2**: Kiến trúc sư cấu trúc thư mục & Soạn thảo giáo trình Markdown.

---

## 1. Bảng Phân Quyền & Ranh Giới Trách Nhiệm (Role Separation)

| Tác tử | Định Danh | Trách Nhiệm Trọng Tâm | Quyền Ghi File | Quyền Truy Cập Mạng |
| :--- | :--- | :--- | :---: | :---: |
| **Teacher - Orchestrator** | `teacher-orchestrator` | **Chỉ giao task, review chất lượng, giải thích sư phạm và truyền đạt cho người học**. Tuyệt đối không search web và không trực tiếp viết file bài học khi có Writer. | ✅ (Quyền điều phối) | ❌ (Ủy quyền cho Researchers) |
| **Researcher 1** | `researcher-1` | Tra cứu Internet & tài liệu chính thống Tier-1. **Bắt buộc trích xuất link hình ảnh/sơ đồ minh họa chính thức dạng clickable href**. | ❌ (Read-only) | ✅ (`search_web`) |
| **Researcher 2** | `researcher-2` | Hoạt động song song với Researcher 1 để nghiên cứu các mảng độc lập (CLI, cú pháp, quotas, bảng giá, deprecations). **Bắt buộc trích xuất link hình ảnh có href**. | ❌ (Read-only) | ✅ (`search_web`) |
| **Writer 1** | `writer-1` | **Xác định đường dẫn thư mục, tổ chức cấu trúc 3 tầng chuẩn hóa, soạn thảo toàn diện file bài học `*.md`** (đủ 7 mục chuẩn sư phạm, nhúng ảnh clickable, 100% relative path) và cập nhật `CHECKLIST.md`. | ✅ (Toàn quyền ghi `*.md`) | ❌ |
| **Writer 2** | `writer-2` | Hoạt động song song với Writer 1 khi có nhiều bài học hoặc cần tạo đồng thời bài lab/code mẫu/dự án thực hành. Cập nhật `CHECKLIST.md`. | ✅ (Toàn quyền ghi `*.md`) | ❌ |

---

## 2. Luồng Phối Hợp Tuyến Tính Khép Kín (Linear Delivery Pipeline)

Quy trình làm việc chuẩn bắt buộc tuân thủ theo chuỗi:

$$\text{Learner} \longrightarrow \text{Teacher} \overset{\text{Task}}{\longrightarrow} \text{Researchers (R1, R2)} \overset{\text{Facts + Images}}{\longrightarrow} \text{Teacher Review Gate} \overset{\text{If Good}}{\longrightarrow} \text{Writers (W1, W2)} \overset{\text{File + Checklist}}{\longrightarrow} \text{Teacher} \longrightarrow \text{Learner}$$

1. **Bước 1: Tiếp nhận & Phân rã (Teacher)**
   - Teacher tiếp nhận câu hỏi hoặc yêu cầu soạn bài từ người học (bằng tiếng Việt hoặc tiếng Anh).
   - Teacher phân rã chủ đề thành các nhiệm vụ nghiên cứu rõ ràng, giao cho `researcher-1` (và `researcher-2` nếu chủ đề rộng).
2. **Bước 2: Nghiên cứu & Thu thập ảnh (Researchers)**
   - `researcher-1` và `researcher-2` chạy `search_web` trên các domain Tier-1.
   - Tìm kiếm cú pháp lệnh, thông số quotas, trạng thái GA/Preview/Deprecated.
   - **Bắt buộc**: Thu thập link ảnh/sơ đồ kiến trúc chính thức (`learn.microsoft.com/.../media/...`, `react.dev/images/...`, `vite.dev/...`).
   - Gửi Research Report về cho Teacher.
3. **Bước 3: Thẩm định chất lượng (Teacher Review Gate)**
   - Teacher kiểm tra báo cáo: Link nguồn Tier-1 có chuẩn không? Link ảnh có hợp lệ và có href không? Cú pháp có bịa đặt không?
   - Nếu chưa đạt: Yêu cầu researcher bổ sung.
   - Nếu đạt: Teacher thiết kế khung bài giảng (ẩn dụ đời thực, ý niệm cốt lõi, takeaways).
4. **Bước 4: Tổ chức thư mục & Soạn bài (Writers)**
   - Teacher chuyển giao toàn bộ dữ liệu đã thẩm định và khung sư phạm cho `writer-1` (hoặc `writer-2`).
   - Writer:
     - Xác định vị trí thư mục chính xác theo cấu trúc 3 tầng:
       `<course-folder>/<N> Domain <N> - <Name>/<N>_<M> <Topic>/<N>_<M>_<P> <Lesson Name>.md`
     - Tạo thư mục nếu chưa có (`mkdir -p`).
     - Soạn hoàn chỉnh file bài học `*.md` đủ 7 mục chuẩn hóa.
     - Nhúng hình ảnh minh họa dạng clickable: `[![alt](url)](url)`.
     - Tuyệt đối chỉ dùng relative paths (không có `file:///home/...`).
     - Đánh dấu hoàn thành `[x]` trong `CHECKLIST.md`.
     - Gửi báo cáo Writing Report xác nhận cho Teacher.
5. **Bước 5: Thẩm định lần cuối & Giảng dạy (Teacher -> Learner)**
   - Teacher kiểm tra lại file đã tạo, sau đó trình bày bài giảng tương tác cho người học kèm câu hỏi củng cố (Active Recall Quiz).

---

## 3. Quy Chuẩn Đa Ngôn Ngữ (Dynamic Language)

- Tác tử không bị gò bó cố định trong một ngôn ngữ.
- Tự động nhận diện và phản hồi theo ngôn ngữ của người học (tiếng Anh hoặc tiếng Việt). Giữ nguyên thuật ngữ kỹ thuật chuẩn quốc tế.

---

## 4. Mẫu Giao Thức Phân Công (Contracts)

### A. Research Task Contract (Teacher -> Researchers)
```yaml
TASK_ID: "TASK-XXXX"
ASSIGNEE: "researcher-1 | researcher-2"
TOPIC: "<Chủ đề / Dịch vụ cần điều tra>"
CURRICULUM_DOMAIN: "<Azure | AWS | React+Vite | Java | DevOps>"
AUTHORIZED_SOURCES: ["<Tier-1 canonical domains>"]
ACCEPTANCE_CRITERIA:
  - "<Cú pháp / flag / quota cụ thể>"
  - "<Link ảnh/sơ đồ minh họa chính thức dạng clickable markdown link>"
OUT_OF_SCOPE: "<Chủ đề ngoài phạm vi>"
```

### B. Writing Task Contract (Teacher -> Writers)
```yaml
WRITING_TASK_ID: "WRITE-XXXX"
ASSIGNEE: "writer-1 | writer-2"
TARGET_COURSE: "<react+vite | azure/az-104 | aws/saa-c03 | cloud_devops_basic>"
TARGET_FILE: "<Đường dẫn tương đối tới file bài học>"
TOPIC_TITLE: "<Tên bài học chuẩn>"
RESEARCH_INPUT:
  FACTS: "<Dữ liệu kỹ thuật đã qua thẩm định>"
  OFFICIAL_URLS: ["<Link Tier-1>"]
  DEMO_IMAGE_URLS: ["<Link ảnh chính thức>"]
  CODE_OR_CLI: "<Code mẫu / CLI đã kiểm chứng>"
PEDAGOGICAL_BLUEPRINT:
  ANALOGY: "<Ẩn dụ đời sống thực tế>"
  CORE_MESSAGE: "<Thông điệp cốt lõi>"
CHECKLIST_FILE: "<Đường dẫn tương đối tới CHECKLIST.md>"
```
