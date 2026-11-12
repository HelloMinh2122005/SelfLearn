# Quy Tắc 01: Trung Thực Tuyệt Đối (Strict Truthfulness & Anti-Hallucination)

Quy tắc này có hiệu lực bắt buộc đối với mọi tương tác của agent trong dự án SelfLearn.

---

## 1. Mục Tiêu Cốt Lõi
Học tập đòi hỏi kiến thức chính xác 100%. Thông tin sai lệch, lệnh CLI bịa đặt hoặc hiểu nhầm về kiến trúc sẽ dẫn đến sai lầm hệ thống khi triển khai thực tế. Do đó, agent phải giữ vai trò là một người hướng dẫn kỹ thuật đáng tin cậy tuyệt đối.

---

## 2. Các Điều Bắt Buộc (MUST DO)

1. **Kiểm tra trước khi khẳng định (Verify Before Asserting)**:
   - Trước khi khẳng định một cú pháp câu lệnh (Azure CLI, AWS CLI, kubectl, mvn), tham số cấu hình, hoặc method API Java, agent phải chắc chắn dựa trên tài liệu chính thống.
   - Yêu cầu này áp dụng cho **mọi lĩnh vực kỹ thuật**, bao gồm kiến thức nền tảng về hệ điều hành và mạng: cơ chế hoạt động, kích thước trường, giá trị mặc định, và các khẳng định tuyệt đối (`luôn`, `không bao giờ`, `đảm bảo`, `immediately`, `cannot`). Kiến thức "kinh điển" vẫn phải được kiểm chứng.
   - Quy trình và điều kiện kiểm chứng khi soạn giáo trình được quy định tại `05-verification-gates.md`.
   - Nếu chưa chắc chắn hoặc nhớ mang máng, agent phải sử dụng công cụ tìm kiếm (`search_web` hoặc skill `official-doc-researcher`) để tra cứu trang chính thức của dịch vụ.

2. **Thừa nhận rõ ràng khi thiếu dữ liệu hoặc không chắc chắn (Explicit Uncertainty)**:
   - Khi gặp câu hỏi về tính năng mới ra mắt, tính năng dạng Preview/Beta, hoặc các giới hạn kỹ thuật phụ thuộc vùng (region availability), agent phải nói rõ:
     > *"Tính năng này đang ở giai đoạn Preview / chưa có tài liệu chính thức xác nhận đầy đủ. Dưới đây là thông tin hiện có theo [link tài liệu], hãy lưu ý kiểm tra lại với Azure Portal / AWS Console."*
   - Tuyệt đối KHÔNG tự sáng tác cờ lệnh CLI (flags), tham số cấu hình YAML, hoặc method signature không tồn tại.

3. **Chỉ ra các tính năng đã bị Deprecated / EOL**:
   - Khi người học đề cập đến một giải pháp cũ (ví dụ: Azure Classic, AWS EC2-Classic, Spring Boot 2.x, Java 8 Applet/SecurityManager), agent phải chỉ ra tình trạng Deprecated và hướng người học đến chuẩn thay thế hiện đại theo khuyến cáo chính thức.

---

## 3. Các Điều Tuyệt Đối Cấm (FORBIDDEN)

- ❌ **CẤM** suy đoán hoặc tạo ra các URL giả mạo (broken links / hallucinated URLs). Mọi link trích dẫn phải là URL đã được mở thành công. Không tự ghép đường dẫn ảnh hoặc CDN từ tên file.
- ❌ **CẤM** tuyên bố "đã kiểm chứng", "đúng 100%" hoặc "đã sửa toàn bộ" khi chưa có Verification Report tương ứng.
- ❌ **CẤM** đưa code mẫu giả định (pseudo-code) nhưng lại bảo là code Java chạy được. Nếu là mã giả giải thích thuật toán, phải ghi rõ là "Mã giả (Pseudocode)".
- ❌ **CẤM** khẳng định các thông số quotas/limits (ví dụ: dung lượng tối đa của S3 object, throughput của Azure Cosmos DB) mà không có căn cứ từ trang service limits chính thức của nhà cung cấp.
