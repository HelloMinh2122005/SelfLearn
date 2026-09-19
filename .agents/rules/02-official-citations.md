# Quy Tắc 02: Tiêu Chuẩn Nguồn & Trích Dẫn Chính Thống (Official Citations)

Quy tắc này quy định chi tiết về cách lựa chọn nguồn tài liệu và định dạng trích dẫn trong mọi bài học, câu trả lời và tài liệu tự học.

---

## 1. Danh Sách Nguồn Tài Liệu Cho Phép Theo Lĩnh Vực

### A. Microsoft Azure
- **Cổng tài liệu chính**: `https://learn.microsoft.com/azure/`
- **Trung tâm kiến trúc**: `https://learn.microsoft.com/azure/architecture/`
- **Well-Architected Framework**: `https://learn.microsoft.com/azure/well-architected/`
- **Azure CLI Reference**: `https://learn.microsoft.com/cli/azure/`
- **Bicep Documentation**: `https://learn.microsoft.com/azure/azure-resource-manager/bicep/`

### B. Amazon Web Services (AWS)
- **Cổng tài liệu chính**: `https://docs.aws.amazon.com/`
- **Trung tâm kiến trúc & Whitepapers**: `https://aws.amazon.com/architecture/`
- **AWS Well-Architected Framework**: `https://aws.amazon.com/architecture/well-architected/`
- **AWS CLI Command Reference**: `https://awscli.amazonaws.com/v2/documentation/api/latest/reference/`
- **AWS CDK Reference**: `https://docs.aws.amazon.com/cdk/v2/guide/`

### C. Java & Spring Ecosystem
- **Oracle Java SE Documentation**: `https://docs.oracle.com/en/java/javase/`
- **OpenJDK JEPs & Project Specs**: `https://openjdk.org/jeps/` (JEPs cho Java 17, 21,...)
- **Spring Framework / Spring Boot**: `https://docs.spring.io/spring-boot/docs/current/reference/html/`
- **Jakarta EE Specification**: `https://jakarta.ee/specifications/`

---

## 2. Quy Cách Định Dạng Trích Dẫn

Mọi tài liệu hoặc câu trả lời kỹ thuật đều phải có danh mục trích dẫn cuối bài:

```markdown
---
## 📚 Nguồn Tài Liệu Chính Thống (Official Citations)
1. [Tiêu đề trang tài liệu](URL_CHÍNH_THỨC) - Mô tả ngắn gọn nội dung tài liệu này xác nhận điều gì (ví dụ: Giới hạn dung lượng, kiến trúc chuẩn, hoặc cú pháp lệnh).
2. ...
```

### Yêu cầu về liên kết:
1. **Liên kết phải cụ thể**: Tuyệt đối không dẫn link chung chung đến trang chủ (`learn.microsoft.com` hay `docs.aws.amazon.com`). Hãy dẫn link đến bài học/dịch vụ cụ thể (ví dụ: `https://learn.microsoft.com/azure/storage/blobs/storage-blobs-introduction`).
2. **Trường hợp tài liệu cộng đồng**: Nếu trích dẫn một bài phân tích kiến trúc từ Martin Fowler, Baeldung hoặc InfoQ, phải ghi rõ nhãn `[Community Reference]` để người học phân biệt rõ với tài liệu chính hãng.
