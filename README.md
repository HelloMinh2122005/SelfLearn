# SelfLearn 🚀

Chào mừng bạn đến với **SelfLearn** — Kho lưu trữ và môi trường tự học kỹ thuật có cấu trúc cao, tập trung vào các công nghệ điện toán đám mây và kỹ thuật phần mềm backend: **Microsoft Azure**, **Amazon Web Services (AWS)**, và **Java Ecosystem**.

---

## 🏛️ Kiến Trúc Kho Lưu Trữ (Repository Architecture)

Kho lưu trữ được phân chia khoa học thành các phân hệ chuyên đề độc lập, mỗi phân hệ đều có lộ trình (roadmap), tài liệu phân tích sâu và bài thực hành:

```text
SelfLearn/
├── AGENTS.md                                # Quy chuẩn bắt buộc cho AI Agent trong workspace
├── README.md                                # Mục lục & tổng quan dự án
├── .agents/                                 # Antigravity Agent Harness (Rules & Skills)
│   ├── rules/
│   │   ├── 01-strict-truthfulness.md        # Nguyên tắc trung thực 100%, cấm bịa đặt kiến thức
│   │   ├── 02-official-citations.md         # Phân cấp nguồn (Tier 1: Docs hãng) & chuẩn trích dẫn
│   │   └── 03-learning-methodology.md       # Phương pháp sư phạm 5 bước & sơ đồ Mermaid
│   └── skills/
│       ├── official-doc-researcher/         # Kỹ năng tra cứu & kiểm chứng từ tài liệu chính hãng
│       ├── azure-curriculum-guide/          # Kỹ năng giảng dạy & kiến trúc Microsoft Azure
│       ├── aws-curriculum-guide/            # Kỹ năng giảng dạy & kiến trúc AWS Cloud
│       ├── java-ecosystem-guide/            # Kỹ năng giảng dạy Java hiện đại & Spring Boot 3
│       └── lab-builder/                     # Kỹ năng tạo bài lab thực hành & script tự động nghiệm thu
├── azure/                                   # Phân hệ học tập Microsoft Azure
│   ├── README.md                            # Lộ trình học Azure (AZ-900 -> AZ-104 -> AZ-204/305)
│   └── labs/                                # Bài thực hành với Azure CLI & Bicep
├── aws/                                     # Phân hệ học tập Amazon Web Services
│   ├── README.md                            # Lộ trình học AWS (CCP -> SAA -> DVA/SAP)
│   └── labs/                                # Bài thực hành với AWS CLI & CDK/Terraform
└── java/                                    # Phân hệ học tập Java & Backend Engineering
    ├── README.md                            # Lộ trình Java (Core 17/21 -> Loom -> Spring Boot 3)
    └── labs/                                # Bài thực hành mini-project, JMH benchmark, Testcontainers
```

---

## 🤖 Bộ Harness AI Agent (`.agents`)

Để đảm bảo quá trình học tập đạt hiệu quả cao nhất, workspace này được trang bị một hệ thống **Harness AI** với 3 cam kết vàng:

1. **Trung thực 100% (Strict Truthfulness)**: Agent không bao giờ tự bịa đặt câu lệnh CLI, cờ tham số, hay giải pháp ảo. Mọi phát biểu kỹ thuật đều được đối soát với tài liệu chính thống.
2. **Ưu tiên nguồn gốc chính thống (Authoritative Source Hierarchy)**:
   - **Azure**: [Microsoft Learn](https://learn.microsoft.com/azure/) & [Azure Architecture Center](https://learn.microsoft.com/azure/architecture/)
   - **AWS**: [AWS Documentation](https://docs.aws.amazon.com/) & [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
   - **Java**: [Oracle Java SE Docs](https://docs.oracle.com/en/java/javase/) & [Spring Framework Docs](https://docs.spring.io/)
   - Mọi câu trả lời kỹ thuật đều kết thúc bằng danh mục link trích dẫn cụ thể.
3. **Phương pháp sư phạm First-Principles**: Mọi bài học đều đi từ:
   - Bản chất bài toán (*Why it matters*)
   - Sơ đồ kiến trúc (*Mermaid visual flow*)
   - Thực hành cụ thể (*Hands-on code / CLI*)
   - Cạm bẫy thực tế (*Gotchas, cost, security*)
   - Câu hỏi củng cố (*Active recall quiz*)
