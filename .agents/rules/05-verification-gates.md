# Quy Tắc 05: Cổng Kiểm Chứng Bắt Buộc (Verification Gates)

Quy tắc này áp dụng cho mọi thao tác tạo mới hoặc sửa nội dung giáo trình, bao gồm cả việc sửa theo kết quả audit. Nếu quy tắc này mâu thuẫn với tốc độ hoàn thành, **ưu tiên quy tắc này**.

---

## 1. Nguyên Tắc Nền Tảng

1. **Không có bằng chứng thì không viết**: Mọi claim kỹ thuật phải truy được về một trang đã được mở thật và có trích dẫn nguyên văn.
2. **Snippet không phải bằng chứng**: Kết quả tóm tắt của `search_web` chỉ dùng để tìm URL. Phải mở trang trước khi đánh dấu `VERIFIED`.
3. **Trí nhớ của model không phải nguồn**: Nội dung không có trong Claim Ledger không được viết thành sự thật.
4. **Người viết không tự kiểm chứng bài của mình**: Xác nhận cuối cùng phải đến từ `verifier`.
5. **Tuyên bố phải đi kèm bằng chứng**: Không được nói "đã kiểm chứng" hoặc "đã sửa hết" nếu không có Verification Report tương ứng.

---

## 2. Claim Ledger (Sổ Bằng Chứng)

Researcher lưu bảng sau vào `<course-folder>/.evidence/research/<TASK_ID>.md`. Thiếu cột nào thì báo cáo không hợp lệ.

| ID | Lesson | Atomic claim | URL + section đã mở | Trích dẫn nguyên văn (≤ 300 ký tự) | Áp dụng cho (phiên bản/nền tảng) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| R1.1 | 6_3_7 | ... | ... | "..." | ... | VERIFIED |

- Trạng thái chỉ gồm: `VERIFIED`, `CONFLICT`, `NOT_FOUND`.
- **Một dòng = một fact** (một con số, một flag, một hành vi). Dòng gộp nhiều fact phải tách ra.
- `evidence.py quotes <ledger>` phải không có dòng `MISSING`, tức trích dẫn thật sự nằm trên trang.
- Writer gắn tag `<!-- ev: R1.1 -->` cho mỗi câu chứa fact, và lưu **file chỉ mục** (đường dẫn ledger + các claim ID đã dùng) tại `<course-folder>/.evidence/<WRITING_TASK_ID>.md`, không chép lại ledger.

---

## 3. Các Cổng Bắt Buộc

| Cổng | Vị trí | Điều kiện đạt | Khi không đạt |
| :--- | :--- | :--- | :--- |
| **G1: Evidence** | Researcher trả báo cáo | Có báo cáo `COMPLETE`, Ledger đã lưu file, `evidence.py quotes` không có `MISSING` | Giao lại cho Researcher. **Cấm chuyển sang Writer.** |
| **G2: Scope** | Teacher trước khi giao Writer | Ledger phủ đủ nội dung cần viết, `CONFLICT`/`NOT_FOUND` đã xử lý, đã rà soát coverage | Giao nghiên cứu bổ sung. |
| **G3: Write Boundary** | Writer khi viết | Chỉ viết claim có trong Ledger, mỗi fact có tag `ev`, nằm trong ngân sách kích thước, sửa cục bộ bằng `edit_file` | Writer dừng và báo Teacher. |
| **G4: Mechanical** | Sau khi viết | `check_curriculum.py` (offline khi đang sửa, `--online` một lần trước khi báo cáo) và `evidence.py lesson` đều exit `0`. Khi đóng module: chạy `check_curriculum.py` không có `--only`. | Writer sửa rồi chạy lại. |
| **G5: Independent Verification** | Sau G4 | `verifier` trả `PASS` (script tự mở trang để đối chiếu trích dẫn; Verifier tự nghiên cứu các fact không có tag) | Writer sửa theo báo cáo. Verifier mới chạy **chế độ re-check**: chỉ kiểm lại claim FAIL/UNVERIFIED và các dòng đã sửa. |

Chỉ sau khi G5 đạt mới được đánh dấu `[x]` trong `CHECKLIST.md` và trình bày bài học là đã kiểm chứng.

---

## 4. Điều Phối Subagent

1. **Không poll và không hối thúc**: Không dùng `sleep`, `tail` transcript, `manage_subagents`/`manage_task` để hỏi tiến độ, hoặc tin nhắn kiểu "gửi báo cáo ngay". Subagent sẽ tự gửi kết quả khi xong. Mỗi lần poll là một lượt gọi model đọc lại toàn bộ context.
2. **Mỗi task một subagent mới**: Không giao task mới cho subagent đã làm xong task khác (xem `04-squad-orchestration.md` mục 2.1).
3. **Không kill Researcher hoặc Verifier đang chạy** trừ khi người học yêu cầu hoặc subagent đã treo quá 15 phút không có bước mới.
4. **Subagent bị kill hoặc trả kết quả rỗng nghĩa là G1 không đạt**. Giao lại nhiệm vụ. Không tự viết thay.
5. **Verifier phải chạy trên model khác tác giả**: Gọi `invoke_subagent` với `TypeName: "verifier"` và `Model: "pro"`, không dùng `inherit`.

---

## 5. Sửa Nội Dung Đã Có

1. File phải có trong git `HEAD` trước khi sửa. Nếu chưa có, commit baseline trước khi sửa.
2. Sửa từng đoạn bằng `edit_file`. **Cấm ghi đè toàn bộ file** đã có nội dung.
3. Kết quả audit từ AI hoặc người khác là **danh sách cần kiểm chứng**, không phải bằng chứng. Mỗi mục vẫn phải đi qua G1 đến G5.
4. Được xóa hoặc đổi tên heading, hoặc làm file giảm trên 10%, chỉ khi người học đồng ý rõ ràng. Khi đó mới dùng `--allow-rewrite`.
