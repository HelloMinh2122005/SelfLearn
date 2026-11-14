# Quy Tắc 04: Điều Phối Biệt Đội Tác Tử (Squad Orchestration Protocol)

Quy tắc này quy định chuẩn giao tiếp, phân chia trách nhiệm và quy trình phối hợp khép kín giữa các tác tử trong biệt đội **SelfLearn Squad**:
- **Teacher - Orchestrator**: Điều phối viên & Giảng viên trưởng.
- **Researcher 1 & Researcher 2**: Chuyên viên nghiên cứu Internet & Tài liệu chính thống.
- **Writer 1 & Writer 2**: Kiến trúc sư cấu trúc thư mục & Soạn thảo giáo trình Markdown.
- **Verifier**: Kiểm chứng độc lập sau khi viết (xem `05-verification-gates.md`).

---

## 1. Bảng Phân Quyền & Ranh Giới Trách Nhiệm (Role Separation)

| Tác tử | Định Danh | Trách Nhiệm Trọng Tâm | Quyền Ghi File | Quyền Truy Cập Mạng |
| :--- | :--- | :--- | :---: | :---: |
| **Teacher - Orchestrator** | `teacher-orchestrator` | **Chỉ giao task, review chất lượng, giải thích sư phạm và truyền đạt cho người học**. Tuyệt đối không search web và không ghi file giáo trình trong mọi trường hợp. | ❌ (Chỉ đọc) | ❌ (Ủy quyền cho Researchers) |
| **Researcher 1** | `researcher-1` | Mở tài liệu Tier-1 và **trả về Claim Ledger có trích dẫn nguyên văn**. Hình ảnh minh họa là tùy chọn. | ❌ (Read-only) | ✅ (`search_web`, tải trang bằng `curl`) |
| **Researcher 2** | `researcher-2` | Hoạt động song song với Researcher 1 để nghiên cứu các mảng độc lập (CLI, cú pháp, quotas, bảng giá, deprecations). **Trả về Claim Ledger**. Hình ảnh là tùy chọn. | ❌ (Read-only) | ✅ (`search_web`, tải trang bằng `curl`) |
| **Writer 1** | `writer-1` | **Xác định đường dẫn thư mục, tổ chức cấu trúc 3 tầng chuẩn hóa, soạn thảo file bài học `*.md` chỉ từ Claim Ledger** (đủ 7 mục chuẩn sư phạm, 100% relative path) và cập nhật `CHECKLIST.md` sau khi Verifier đạt. | ✅ (Ghi `*.md`) | ❌ |
| **Writer 2** | `writer-2` | Hoạt động song song với Writer 1 khi có nhiều bài học hoặc cần tạo đồng thời bài lab/code mẫu/dự án thực hành. Cập nhật `CHECKLIST.md` sau khi Verifier đạt. | ✅ (Ghi `*.md`) | ❌ |
| **Verifier** | `verifier` | **Kiểm chứng độc lập file đã viết**, chạy `check_curriculum.py`, trả PASS/FAIL. Không sửa giáo trình. | ❌ (Read-only) | ✅ (`search_web`, tải trang bằng `curl`) |

---

## 2. Luồng Phối Hợp Tuyến Tính Khép Kín (Linear Delivery Pipeline)

Quy trình làm việc chuẩn bắt buộc tuân thủ theo chuỗi:

$$\text{Learner} \longrightarrow \text{Teacher} \overset{\text{Task}}{\longrightarrow} \text{Researchers (R1, R2)} \overset{\text{Claim Ledger}}{\longrightarrow} \text{Teacher Review Gate} \overset{\text{If Good}}{\longrightarrow} \text{Writers (W1, W2)} \overset{\text{File}}{\longrightarrow} \text{Verifier} \overset{\text{PASS}}{\longrightarrow} \text{Teacher} \longrightarrow \text{Learner}$$

1. **Bước 1: Tiếp nhận & Phân rã (Teacher)**
   - Teacher tiếp nhận câu hỏi hoặc yêu cầu soạn bài từ người học (bằng tiếng Việt hoặc tiếng Anh).
   - Teacher phân rã chủ đề thành các nhiệm vụ nghiên cứu rõ ràng, giao cho `researcher-1` (và `researcher-2` nếu chủ đề rộng).
2. **Bước 2: Nghiên cứu & Lập Claim Ledger (Researchers)**
   - `researcher-1` và `researcher-2` dùng `search_web` để tìm URL trên các domain Tier-1, sau đó **mở trang** để đọc.
   - Lập Claim Ledger theo `05-verification-gates.md`: mỗi claim có URL, trích dẫn nguyên văn và phạm vi áp dụng.
   - Chỉ tìm ảnh minh họa sau khi Ledger đã xong. Ảnh là tùy chọn.
   - Gửi Research Report về cho Teacher.
3. **Bước 3: Thẩm định chất lượng (Teacher Review Gate - G1, G2)**
   - Teacher chờ đủ báo cáo. Subagent bị kill hoặc trả kết quả rỗng được tính là không đạt.
   - Teacher kiểm tra: Ledger đầy đủ không? `CONFLICT`/`NOT_FOUND` đã xử lý chưa? Có chủ đề quan trọng nào bị thiếu không?
   - Nếu chưa đạt: Yêu cầu researcher bổ sung.
   - Nếu đạt: Teacher thiết kế khung bài giảng (ẩn dụ đời thực, ý niệm cốt lõi, takeaways).
4. **Bước 4: Tổ chức thư mục & Soạn bài (Writers)**
   - Teacher chuyển giao toàn bộ dữ liệu đã thẩm định và khung sư phạm cho `writer-1` (hoặc `writer-2`).
   - Writer:
     - Xác định vị trí thư mục chính xác theo cấu trúc 3 tầng:
       `<course-folder>/<N> Domain <N> - <Name>/<N>_<M> <Topic>/<N>_<M>_<P> <Lesson Name>.md`
     - Tạo thư mục nếu chưa có (`mkdir -p`).
     - Soạn file bài học `*.md` đủ 7 mục chuẩn hóa, **chỉ từ các claim trong Ledger**.
     - Nhúng hình ảnh minh họa dạng clickable nếu Ledger có link đã mở thành công.
     - Tuyệt đối chỉ dùng relative paths (không có `file:///home/...`).
     - Chạy `check_curriculum.py <course-folder> --online --only "<file đã sửa>"` cho đến khi exit `0`.
     - Gửi báo cáo Writing Report cho Teacher.
5. **Bước 5: Kiểm chứng độc lập (Verifier - G5)**
   - Teacher gọi `verifier` với `Model: "pro"`, chỉ giao đường dẫn file và lĩnh vực.
   - Nếu `FAIL` hoặc `INCOMPLETE`: Teacher chuyển báo cáo cho Writer sửa, sau đó chạy lại Verifier.
6. **Bước 6: Đóng bài & Giảng dạy (Teacher -> Learner)**
   - Sau khi Verifier trả `PASS`, Writer đánh dấu `[x]` trong `CHECKLIST.md`.
   - Teacher trình bày bài giảng tương tác cho người học kèm câu hỏi củng cố (Active Recall Quiz) và nêu kết quả Verification Report.

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
  - "<Câu hỏi hoặc claim cần chứng minh, không chỉ là danh sách chủ đề>"
  - "<Mọi claim phải có URL đã mở và trích dẫn nguyên văn>"
  - "<Báo cáo chủ đề quan trọng mà nguồn có nhưng nhiệm vụ chưa nêu>"
OPTIONAL: "<Link ảnh/sơ đồ chính thức, chỉ tìm sau khi Ledger đã xong>"
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
  CLAIM_LEDGER: "<Nguyên văn Claim Ledger đã qua G1 và G2>"
  OFFICIAL_URLS: ["<Link Tier-1 đã mở>"]
  DEMO_IMAGE_URLS: ["<Link ảnh đã mở thành công, có thể rỗng>"]
  CODE_OR_CLI: "<Code mẫu / CLI đã kiểm chứng>"
PEDAGOGICAL_BLUEPRINT:
  ANALOGY: "<Ẩn dụ đời sống thực tế>"
  CORE_MESSAGE: "<Thông điệp cốt lõi>"
CHECKLIST_FILE: "<Đường dẫn tương đối tới CHECKLIST.md>"
```
