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
