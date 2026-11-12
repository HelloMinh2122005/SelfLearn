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

Researcher phải trả về bảng sau. Thiếu cột nào thì báo cáo không hợp lệ.

| # | Atomic claim | URL + section đã mở | Trích dẫn nguyên văn | Áp dụng cho (phiên bản/nền tảng) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |

Trạng thái chỉ gồm: `VERIFIED`, `CONFLICT`, `NOT_FOUND`.

Writer lưu nguyên văn Ledger tại `<course-folder>/.evidence/<WRITING_TASK_ID>.md`.

---

## 3. Các Cổng Bắt Buộc

| Cổng | Vị trí | Điều kiện đạt | Khi không đạt |
| :--- | :--- | :--- | :--- |
| **G1: Evidence** | Researcher trả báo cáo | Có báo cáo `COMPLETE`, có Ledger hợp lệ | Giao lại cho Researcher. **Cấm chuyển sang Writer.** |
| **G2: Scope** | Teacher trước khi giao Writer | Ledger phủ đủ nội dung cần viết, `CONFLICT`/`NOT_FOUND` đã xử lý, đã rà soát coverage | Giao nghiên cứu bổ sung. |
| **G3: Write Boundary** | Writer khi viết | Chỉ viết claim có trong Ledger, sửa cục bộ bằng `edit_file` | Writer dừng và báo Teacher. |
| **G4: Mechanical** | Sau khi viết | `check_curriculum.py <course> --online` trả exit `0` | Writer sửa rồi chạy lại. |
| **G5: Independent Verification** | Sau G4 | `verifier` trả `PASS` | Writer sửa theo báo cáo, sau đó chạy lại G4 và G5. |

Chỉ sau khi G5 đạt mới được đánh dấu `[x]` trong `CHECKLIST.md` và trình bày bài học là đã kiểm chứng.

---

## 4. Điều Phối Subagent

1. **Không poll và không hối thúc**: Không dùng `sleep`, `tail` transcript hoặc tin nhắn kiểu "gửi báo cáo ngay". Subagent sẽ tự gửi kết quả khi xong.
2. **Không kill Researcher hoặc Verifier đang chạy** trừ khi người học yêu cầu hoặc subagent đã treo quá 15 phút không có bước mới.
3. **Subagent bị kill hoặc trả kết quả rỗng nghĩa là G1 không đạt**. Giao lại nhiệm vụ. Không tự viết thay.
4. **Verifier phải chạy trên model khác tác giả**: Gọi `invoke_subagent` với `TypeName: "verifier"` và `Model: "pro"`, không dùng `inherit`.

---

## 5. Sửa Nội Dung Đã Có

1. File phải có trong git `HEAD` trước khi sửa. Nếu chưa có, commit baseline trước khi sửa.
2. Sửa từng đoạn bằng `edit_file`. **Cấm ghi đè toàn bộ file** đã có nội dung.
3. Kết quả audit từ AI hoặc người khác là **danh sách cần kiểm chứng**, không phải bằng chứng. Mỗi mục vẫn phải đi qua G1 đến G5.
4. Được xóa hoặc đổi tên heading, hoặc làm file giảm trên 10%, chỉ khi người học đồng ý rõ ràng. Khi đó mới dùng `--allow-rewrite`.
