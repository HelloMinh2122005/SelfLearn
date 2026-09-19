# Agent Instructions for SelfLearn Workspace

Chào mừng bạn đến với workspace **SelfLearn** của người dùng.
Đây là kho lưu trữ tự học có cấu trúc về các công nghệ cốt lõi: **Azure Cloud**, **AWS Cloud**, **Java Ecosystem** và các công nghệ liên quan khác.

Mọi agent khi hoạt động trong workspace này BẮT BUỘC phải tuân thủ nghiêm ngặt các nguyên tắc dưới đây:

---

## 1. Nguyên Tắc Cốt Lõi: Trung Thực 100% (Strict Truthfulness & Anti-Hallucination)

1. **Tuyệt đối không phỏng đoán**: Mọi giải thích về kiến trúc, tên dịch vụ, cú pháp lệnh CLI, tham số API, giới hạn dịch vụ (quotas/limits) và đặc tính ngôn ngữ đều phải dựa trên tài liệu chính thống.
2. **Thừa nhận khi chưa chắc chắn**:
   - Nếu một dịch vụ/tính năng mới ra mắt hoặc có thay đổi gần đây mà bạn chưa kiểm chứng được qua tài liệu chính thức, BẮT BUỘC phải nói rõ: *"Tính năng này có sự thay đổi gần đây hoặc chưa có tài liệu chính thức đầy đủ, cần đối chiếu trực tiếp với trang cập nhật của hãng tại [URL]"*.
   - Tuyệt đối không tự suy diễn hoặc bịa ra flag, tên hàm, tham số cấu hình.
3. **Kiểm tra phiên bản (Version-Awareness)**:
   - Java: Luôn xác định rõ phiên bản (ưu tiên Java 17 LTS, Java 21 LTS; phân biệt tính năng giữa Java 8, 11, 17, 21).
   - Spring: Mặc định hiện tại là Spring Boot 3.x / Spring 6 (yêu cầu Java 17+ và `jakarta.*`).
   - Azure / AWS: Nêu rõ phiên bản API / CLI hoặc cảnh báo nếu module/SDK đã bị deprecate (ví dụ: Azure RM đã thay thế hoàn toàn bằng Az, AWS SDK v2 đã EOL chuyển sang AWS SDK v3).

---

## 2. Phân Cấp Nguồn Tài Liệu (Authoritative Source Hierarchy)

Khi giải thích, soạn tài liệu học hoặc tạo bài lab, agent phải luôn tìm kiếm và trích dẫn theo thứ tự ưu tiên:

### Tier 1: Nguồn Chính Thống Tối Cao (Authoritative Official Docs) - BẮT BUỘC ƯU TIÊN
- **Azure Cloud**:
  - Microsoft Learn: `https://learn.microsoft.com/azure/`
  - Azure Architecture Center: `https://learn.microsoft.com/azure/architecture/`
  - Microsoft Well-Architected Framework: `https://learn.microsoft.com/azure/well-architected/`
  - Azure Updates & Blog: `https://azure.microsoft.com/updates/`
- **AWS Cloud**:
  - AWS Documentation: `https://docs.aws.amazon.com/`
  - AWS Architecture Center & Whitepapers: `https://aws.amazon.com/architecture/`
  - AWS Well-Architected Framework: `https://aws.amazon.com/architecture/well-architected/`
  - AWS Skill Builder & Workshops: `https://workshops.aws/`
- **Java & Backend Ecosystem**:
  - Oracle Java SE Documentation: `https://docs.oracle.com/en/java/javase/`
  - OpenJDK Specs & JEPs: `https://openjdk.org/jeps/`
  - Spring Framework & Spring Boot Docs: `https://docs.spring.io/`
  - Jakarta EE Specification: `https://jakarta.ee/specifications/`
  - Standards: IETF RFCs (HTTP, OAuth2, OIDC), W3C.

### Tier 2: Kho Mã Nguồn & Release Notes Chính Thức
- Các tổ chức GitHub chính thức: `github.com/Azure`, `github.com/aws`, `github.com/spring-projects`, `github.com/openjdk`.
- Official Release Notes, CHANGELOGs của thư viện/công cụ.

### Tier 3: Tài Liệu Bổ Trợ Cộng Đồng Uy Tín (Chỉ Dùng Để Minh Họa & Phải Ghi Rõ)
- Baeldung, Martin Fowler, InfoQ, Vlad Mihalcea (JPA/Hibernate).
- *Lưu ý*: Chỉ dùng để tham khảo ví dụ thực tế hoặc giải thích mẹo vặt, KHÔNG dùng làm căn cứ định nghĩa chuẩn thay cho Tier 1.

---

## 3. Định Dạng Trích Dẫn Chuẩn (Citation Protocol)

Mọi câu trả lời hướng dẫn kỹ thuật hoặc giải thích kiến thức BẮT BUỘC phải kết thúc bằng mục:

```markdown
## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [Tên Bài Viết Cụ Thể](https://learn.microsoft.com/...) - Trang chính thức từ Microsoft Learn về ...
- [Tên Tài Liệu AWS Cụ Thể](https://docs.aws.amazon.com/...) - Tài liệu chính thức từ AWS Documentation về ...
```

- Không dùng link trang chủ chung chung (ví dụ: cấm chỉ trích dẫn `https://aws.amazon.com` hoặc `https://microsoft.com`). Phải trích dẫn trực tiếp bài viết/chương tài liệu cụ thể.

---

## 4. Tiêu Chuẩn Giảng Dạy & Trình Bày (Pedagogical Framework)

Khi người học hỏi hoặc yêu cầu soạn bài giảng / giải thích một chủ đề Azure:
1. **Khái Niệm Cốt Lõi & Giải Thích Mọi Tài Nguyên Cloud Liên Quan (Core Concepts & Cloud Resources)**: Phân tích tường tận bản chất kỹ thuật của từng dịch vụ/tài nguyên xuất hiện trong chủ đề, giải thích chúng làm gì và giải quyết bài toán nào.
2. **Ví Dụ Đời Sống Thực Tế Dễ Hiểu (Intuitive Real-World Analogies)**: BẮT BUỘC có các ví dụ so sánh đời thực sinh động, gần gũi (như tòa nhà văn phòng, giao thông, ngân hàng, căn cước công dân...) giúp người học hình dung bản chất ngay lập tức mà không bị ngợp bởi thuật ngữ khô khan.
3. **Kiến Trúc, Luồng Hoạt Động & Hình Ảnh Minh Họa (Architecture, Diagrams & Official Media)**:
   - Luôn kèm sơ đồ trực quan (ưu tiên Mermaid).
   - **Khuyến khích tối đa việc nhúng đường link hình ảnh/sơ đồ kiến trúc chính thức từ Microsoft Learn CDN** (`https://learn.microsoft.com/.../media/...`) hoặc kho GitHub `MicrosoftDocs/azure-docs`, `MicrosoftDocs/entra-docs` để người học có hình ảnh trực quan gốc từ Microsoft.
4. **Hướng Dẫn Thực Hành Dòng Lệnh Azure CLI (Hands-on Azure CLI)**: Cung cấp đầy đủ các câu lệnh `az` CLI thực chiến chuẩn xác (không cần mẫu khai báo Bicep trừ khi được yêu cầu riêng).
5. **📚 Nguồn Tài Liệu Chính Thống (Official References)**: Trích dẫn liên kết trực tiếp tới Microsoft Learn theo chuẩn Tier 1.

---

## 5. Quy Chuẩn Cấu Trúc Thư Mục & File Bài Học (Curriculum Directory & File Structure)

Mọi thư mục học tập môn học/chứng chỉ (ví dụ `azure/az-104`, `azure/az-305`, `aws/saa-c03`,...) BẮT BUỘC phải được tổ chức theo mô hình phân cấp 3 tầng chuẩn hóa:

```text
<course-folder>/
├── CHECKLIST.md                     # File checklist tổng thể toàn bộ kỹ năng của kỳ thi
├── <N> Domain <N> - <Domain Name>/  # Tầng 1: Thư mục Domain chính (ví dụ: 1 Domain 1 - Manage Azure identities and governance)
│   ├── <N>_<M> <Topic Name>/        # Tầng 2: Thư mục Nhóm chủ đề (ví dụ: 1_1 Manage Microsoft Entra users and groups)
│   │   ├── <N>_<M>_<P> <Lesson>.md  # Tầng 3: File bài giảng chi tiết (ví dụ: 1_1_1 Create users and groups.md)
```

### Nguyên tắc đặt tên (Naming Conventions):
1. **Tầng 1 (Domain Folder)**: `<Thứ tự> Domain <Thứ tự> - <Tên Domain Tiếng Anh chuẩn>`  
   *(Lưu ý: Dùng dấu gạch ngang ` - ` thay cho dấu hai chấm `:` để đảm bảo tương thích tuyệt đối đa nền tảng Windows / Linux / macOS).*
2. **Tầng 2 (Subdomain/Topic Folder)**: `<Domain>_<Topic> <Tên Nhóm Chức Năng Tiếng Anh>`  
   *(Ví dụ: `1_1 Manage Microsoft Entra users and groups`, `1_2 Manage access to Azure resources`).*
3. **Tầng 3 (Lesson File)**: `<Domain>_<Topic>_<Lesson> <Tên Tiêu Chí Kỹ Năng>.md`  
   *(Ví dụ: `1_1_1 Create users and groups.md`).*

### Cấu trúc nội dung chuẩn trong mỗi file bài giảng (`*.md`):
Mỗi file bài học phải tuân thủ cấu trúc chuẩn hóa:
- **Header & Metadata**: Kỳ thi, Phân nhóm, Chủ đề, Trạng thái.
- **1. Khái Niệm Cốt Lõi & Giải Thích Tài Nguyên Cloud (Core Concepts & Cloud Resources)**.
- **2. Ví Dụ Đời Sống Thực Tế Dễ Hiểu (Intuitive Real-World Analogies)**.
- **3. Kiến Trúc, Luồng Hoạt Động & Hình Ảnh Trực Quan (Architecture, Data Flow & Official Diagrams)**: Sơ đồ Mermaid kết hợp hình ảnh chính thức từ Microsoft Learn.
- **4. Hướng Dẫn Thực Hành Azure CLI (Hands-on Azure CLI)** (Tập trung lệnh `az`, loại bỏ Bicep/Gotchas/Quiz).
- **5. 📚 Nguồn Tài Liệu Chính Thống (Official References)**.

---

## 6. Quy Chuẩn Commit & Push Git (Git Commit & Push Convention)

Mọi thay đổi khi commit và push lên Git repository BẮT BUỘC phải tuân thủ định dạng:

```text
<type>: <day-month-year> - <details>
```

- **`<type>`**: `feat` (bài học/lab mới), `fix` (sửa lỗi), `core` (cấu trúc/checklist/skill cốt lõi), `docs` (tài liệu/note), `refactor` (tái cấu trúc), `chore` (cấu hình/tooling), `test` (kiểm thử).
- **`<day-month-year>`**: Định dạng ngày `DD-MM-YYYY` (ví dụ: `19-09-2026`).
- **`<details>`**: Mô tả ngắn gọn nội dung thay đổi.

> Tham khảo chi tiết tại skill: [git-push](file:///.agents/skills/git-push/SKILL.md) và script tự động hóa [push.sh](file:///.agents/skills/git-push/scripts/push.sh).
