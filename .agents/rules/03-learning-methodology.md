# Quy Tắc 03: Phương Pháp Sư Phạm & Tổ Chức Bài Học (Learning Methodology)

Quy tắc này hướng dẫn cách agent truyền đạt kiến thức, thiết kế bài giảng và cấu trúc các ghi chú trong repo `SelfLearn`.

---

## 1. Phương Pháp Tiếp Cận: First-Principles & Practical Hands-on

Mỗi khi người học muốn tìm hiểu một chủ đề mới hoặc yêu cầu agent giải thích một công nghệ, agent cần cấu trúc nội dung theo 5 bước:

### Bước 1: Khái Niệm Cốt Lõi & Bối Cảnh (First Principles)
- **Vấn đề là gì?** Trước khi có công nghệ/dịch vụ này, người ta gặp khó khăn gì?
- **Bản chất hoạt động**: Nó giải quyết bài toán đó như thế nào ở mức trừu tượng?
- So sánh ngắn gọn với các giải pháp tương tự (ví dụ: Azure Blob vs AWS S3, Virtual Threads vs Platform Threads).

### Bước 2: Sơ Đồ Kiến Trúc (Mermaid Visual Diagram)
- Luôn sử dụng sơ đồ Mermaid để trực quan hóa luồng dữ liệu, topology mạng hoặc cấu trúc component.
- Ví dụ:
  ```mermaid
  graph TD
      Client -->|HTTPS| AppGateway[Azure Application Gateway]
      AppGateway -->|Internal| AKS[Azure Kubernetes Service]
      AKS -->|Private Endpoint| SQL[Azure SQL Database]
  ```

### Bước 3: Thực Hành Cụ Thể (Hands-on CLI / Code Snippet)
- Đưa ra các câu lệnh thực thi tối giản, chuẩn xác:
  - Azure: Azure CLI (`az ...`) hoặc Bicep snippet.
  - AWS: AWS CLI (`aws ...`) hoặc Terraform / CDK snippet.
  - Java: Code Java 17/21 đầy đủ, có thể compile & run, sử dụng idioms hiện đại (var, record, stream, virtual thread).
- Kèm theo giải thích từng cờ (flag) hoặc tham số quan trọng.

### Bước 4: Cạm Bẫy Thực Tế (Production Gotchas & Best Practices)
- **Chi phí (Cost Awareness)**: Dịch vụ này tính tiền theo tiêu chí nào? Cách tránh bị "cháy túi" (ví dụ: NAT Gateway data processing, idle VM, S3 API call spikes).
- **Bảo mật (Security Best Practices)**: Nguyên tắc Least Privilege, Private Endpoints, IAM roles/Managed Identities thay vì hardcode credentials.
- **Hiệu năng & Khả năng chịu lỗi (Resilience & Performance)**.

### Bước 5: Câu Hỏi Củng Cố Kiến Thức (Active Recall Quiz)
- Cung cấp từ 2 - 3 câu hỏi trắc nghiệm hoặc bài toán tình huống thực tế để người học tự trả lời, kiểm tra độ hiểu sâu (không chỉ ghi nhớ vẹt).

### Bước 6: Trích Dẫn Tài Liệu Gốc (Official Citations)
- Danh sách link tài liệu chính thức theo quy tắc `02-official-citations.md`.

---

## 2. Viết Cho Người Mới (Beginner-First Writing) — BẮT BUỘC

**Lý do**: Người học đã phản hồi nhiều lần rằng các bài giảng đọc như tài liệu tra cứu: định nghĩa đúng nhưng không nói dùng để làm gì, nén nhiều ý vào một câu, và dùng thuật ngữ chưa được giải thích. Một bài đúng nhưng người học không hiểu thì chưa đạt mục tiêu của repo này.

**Người đọc mặc định**: người mới với **chủ đề của bài** (có thể đã biết Linux, Java hay Azure nói chung, nhưng chưa biết công nghệ đang học). Không giả định họ đã đọc tài liệu chính thức.

### 2.1 Quy tắc viết

1. **Bức tranh lớn trước, chi tiết sau.** Mở bài (mục 0 hoặc đầu mục 1) bằng 3–5 câu: bài này giải quyết vấn đề gì, trước đây làm thế nào, và công nghệ này thay đổi điều gì. Chỉ sau đó mới vào cú pháp và cờ.
2. **Định nghĩa thuật ngữ ở lần xuất hiện đầu tiên** bằng ngôn ngữ thường, một câu. Không dùng tên nội bộ của mã nguồn (ví dụ tên hàm, tên biến lỗi, tên trường nội bộ) làm khái niệm chính. Chỉ nêu khi người học sẽ thật sự gặp nó (như trong thông báo lỗi), và khi đó phải giải thích nghĩa của nó.
3. **Mỗi lệnh, hàm, cờ, tham số phải trả lời "dùng để làm gì"** và có **một ví dụ ngắn cụ thể**. Mẫu: *Là gì → Dùng để → Ví dụ*. Không chỉ chép lại cú pháp hoặc mô tả hành vi.
4. **"Vì sao cần" đứng trước "làm gì"** với tính năng tùy chọn hoặc nâng cao. Nói rõ nó **bắt buộc hay tùy chọn**, và khi nào đáng dùng.
5. **Ví dụ đầu vào → đầu ra** cho mọi khái niệm biến đổi dữ liệu (template, merge, cờ, bộ lọc): cho thấy dữ liệu vào, lệnh hoặc mẫu, và kết quả. Dùng **một ví dụ chạy xuyên suốt** (cùng tên release, cùng ứng dụng) thay vì mỗi mục một ví dụ rời rạc.
6. **Ví dụ đời thường gắn với thứ người học đã biết** (Git, Linux, Java, Word, form đăng ký) hơn là ẩn dụ dài và lạ. Ánh xạ từng phần của ẩn dụ sang khái niệm thật. Nếu ẩn dụ dễ gây hiểu sai ở một điểm, nói rõ điểm đó (ví dụ: Helm release giống Terraform state ở ý tưởng nhưng khác ở nơi lưu và lịch sử).
7. **Câu ngắn, một ý một câu.** Tách câu nén nhiều mệnh đề (kiểu "một khối có phiên bản, chia sẻ và rollback đồng nhất") thành các ý riêng, mỗi ý có chủ ngữ rõ ràng. Tránh cụm từ mơ hồ không nói được nghĩa cụ thể.
8. **Từ dễ đến khó.** Chi tiết nội bộ, so sánh giữa các phiên bản và trường hợp biên đặt sau cùng, đánh dấu *"Nâng cao: có thể bỏ qua ở lần đọc đầu"*.

### 2.2 Ranh giới với tính trung thực (rule 01 và 05 vẫn thắng)

- Giải thích dễ hiểu được **diễn đạt lại**, nhưng mọi fact kỹ thuật trong đó (kể cả câu kiểu "hàm này thường dùng để...") đều phải mang claim tag `C<P>.n` để verifier kiểm. Đơn giản hóa không được biến thành sai: verifier chấm `FAIL` khi câu nói rộng hơn trang nguồn.
- Không chắc một fact thì bỏ ý đó hoặc nói khái quát hơn. Ví dụ dữ liệu hoặc code minh họa ghi chú là *ví dụ minh họa*, cú pháp của nó cũng mang tag, và không được nói ví dụ đó đã chạy thử nếu chưa chạy.
- Ngân sách 24 KB không đổi. Phần dành cho người mới **thay thế** chi tiết nâng cao chứ không cộng thêm: cắt phần nâng cao trước.

### 2.3 Tự kiểm tra trước khi báo cáo

Đọc lại bài như một người chưa biết gì về chủ đề, rồi trả lời:
- Mỗi thuật ngữ đã được định nghĩa ở lần đầu xuất hiện chưa?
- Mỗi lệnh, hàm, cờ có câu "dùng để làm gì" và một ví dụ chưa?
- Có câu nào phải đọc hai lần mới hiểu không? Nếu có, tách nó ra.
- Người mới có biết khi nào dùng và khi nào **không** cần dùng không?
