# SelfLearn Multi-Agent Squad

Biệt đội tác tử hỗ trợ học tập thông minh (Autonomous Self-Learning Squad) được thiết kế đặc thù cho kho lưu trữ kiến trúc kỹ thuật **SelfLearn**, vận hành trên nền tảng **Google Antigravity**.

---

## 1. Thành Viên Biệt Đội (Squad Roster)

| Tác Tử (Agent) | Vai Trò (Role) | Mô Hình (Model) | Quyền Hạn Công Cụ (Tools) |
| :--- | :--- | :--- | :--- |
| [**`teacher-orchestrator`**](./agents/teacher-orchestrator.md) | **Master Teacher & Squad Orchestrator** | `inherit` / `pro` | `invoke_subagent`, `send_message`, `manage_subagents`, `ask_question`, `read_file`, `write_file`, `edit_file`, `run_command` |
| [**`researcher-1`**](./agents/researcher-1.md) | **Deep Internet & Official Doc Researcher 1** | `flash` | `search_web`, `read_file` |
| [**`researcher-2`**](./agents/researcher-2.md) | **Deep Internet & Official Doc Researcher 2** | `flash` | `search_web`, `read_file` |

---

## 2. Phân Công Trách Nhiệm Chi Tiết (Role Boundaries)

### 🎓 `teacher-orchestrator` (Teacher & Orchestrator)
- **Ranh giới nghiêm ngặt**: **Chỉ giao việc, review kết quả, giải thích kiến thức và viết file giáo trình**. Tuyệt đối không tự search web mà ủy thác toàn bộ cho 2 subagent nghiên cứu.
- **Điều phối song song (Parallel Orchestration)**: Khi gặp chủ đề rộng hoặc phức tạp, tự động chia nhỏ nhiệm vụ thành 2 phần độc lập và kích hoạt đồng thời `researcher-1` và `researcher-2` để tối ưu thời gian.
- **Giảng dạy & Sư phạm**: Giải thích các khái niệm kỹ thuật phức tạp bằng First-Principles và ẩn dụ đời sống thực tế sinh động.
- **Nhúng hình ảnh minh họa có link**: Kiểm tra và bắt buộc nhúng các link hình ảnh chính thức dạng clickable `[![alt](url)](url)` do 2 researcher cung cấp vào bài học.
- **Đa ngôn ngữ linh hoạt**: Tự động phản hồi theo ngôn ngữ của người học (tiếng Việt hoặc tiếng Anh).

### 🔍 `researcher-1` & `researcher-2` (Parallel Deep Researchers)
- **Tra cứu Internet chuyên sâu**: Tìm kiếm tài liệu, thông số kỹ thuật, cú pháp CLI và giới hạn dịch vụ trên Internet qua `search_web`.
- **Bắt buộc tìm kiếm ảnh minh họa**: Tìm kiếm và đính kèm đường link hình ảnh/sơ đồ kiến trúc chính thức dạng clickable markdown link (`[![Caption](image_url)](image_url)`).
- **Tuyệt đối trung thực (Strict Truthfulness)**: Bám sát phân cấp nguồn Tier-1 (Microsoft Learn, AWS Documentation, Oracle Java / OpenJDK, React Docs, Vite Docs, MDN, RFCs).
- **Chống ảo giác (Anti-Hallucination)**: Tuyệt đối không tự bịa đặt flag CLI hoặc URL. Xác minh rõ tính năng đang ở trạng thái GA, Preview hay Deprecated.
- **Vận hành song song**: Phối hợp nhịp nhàng, nhận phân công không trùng lặp từ `teacher-orchestrator`.

---

## 3. Luồng Vận Hành Song Song Chuẩn (Parallel Orchestration Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Người Học (User)
    participant Teacher as Teacher - Orchestrator
    participant R1 as Researcher 1
    participant R2 as Researcher 2
    participant FS as Workspace (.md / Files)

    Learner->>Teacher: "Dạy tôi về Azure Blob Storage Access Tiers & Lifecycle Management"
    Teacher->>Learner: Phân tích mục tiêu học tập (theo ngôn ngữ của người dùng)
    par Nghiên Cứu Song Song (Parallel Dispatch)
        Teacher->>R1: TASK-01: Kiến trúc Tiers, cơ chế Rehydration & Link ảnh sơ đồ chính thức
        Teacher->>R2: TASK-02: Cú pháp lệnh az storage blob set-tier, chi phí & service quotas
    end
    activate R1
    activate R2
    R1->>R1: search_web(site:learn.microsoft.com/azure "blob storage" "access tiers")
    R2->>R2: search_web(site:learn.microsoft.com/cli/azure "az storage blob set-tier")
    R1-->>Teacher: Báo cáo 1: Khái niệm Tiers + Clickable Diagram Links
    deactivate R1
    R2-->>Teacher: Báo cáo 2: Cú pháp CLI + Bảng phí & Quotas
    deactivate R2
    Teacher->>Teacher: Review kết quả, tổng hợp bài giảng theo khung sư phạm 5 bước
    Teacher->>FS: Ghi file bài học 3 tầng (nhúng hình ảnh có href link) & cập nhật CHECKLIST.md
    Teacher->>Learner: Giảng giải bài học trực quan + Sơ đồ Mermaid + Câu hỏi Active Recall
```

---

## 4. Cấu Trúc Thư Mục Biệt Đội (Directory Layout)

```text
.agents/
├── plugin.json                    # Khai báo Squad Plugin manifest
├── README.md                      # Tài liệu tổng quan về biệt đội
├── agents/                        # Định nghĩa tác tử (Agent Manifests)
│   ├── teacher-orchestrator.md    # Master Teacher & Squad Orchestrator
│   ├── researcher-1.md            # Deep Internet & Doc Researcher 1
│   └── researcher-2.md            # Deep Internet & Doc Researcher 2
├── rules/                         # Quy tắc bắt buộc
│   ├── 01-strict-truthfulness.md  # Nguyên tắc trung thực 100% & chống ảo giác
│   ├── 02-official-citations.md   # Phân cấp nguồn tài liệu Tier-1/Tier-2/Tier-3
│   ├── 03-learning-methodology.md # Phương pháp giảng dạy First-Principles & 5 bước
│   └── 04-squad-orchestration.md  # Giao thức phối hợp song song & nhúng ảnh minh họa
└── skills/                        # Các kỹ năng chuyên môn tích hợp
    ├── official-doc-researcher/   # Kỹ năng tra cứu tài liệu Tier-1
    ├── azure-curriculum-guide/    # Kỹ năng thiết kế bài học Azure (AZ-104, AZ-305)
    ├── aws-curriculum-guide/      # Kỹ năng thiết kế bài học AWS (SAA-C03, DVA-C02)
    ├── java-ecosystem-guide/      # Kỹ năng Java 17/21 LTS & Spring Boot 3.x
    ├── react-vite-curriculum-guide/# Kỹ năng React 18/19 & Vite tooling
    ├── react-sample-code-guide/   # Kỹ năng sinh code mẫu React + Vite
    ├── lab-builder/               # Kỹ năng xây dựng Hands-on Labs
    └── git-push/                  # Quy chuẩn commit & push Git
```

---

## 5. Hướng Dẫn Sử Dụng (How to Use)

Trong không gian làm việc `SelfLearn`:
1. **Gọi Teacher - Orchestrator bằng bất kỳ ngôn ngữ nào**:
   - Tiếng Việt: `"@teacher-orchestrator hãy dạy tôi về React 19 Actions và Server Components"`
   - Tiếng Anh: `"@teacher-orchestrator teach me about AWS S3 Storage Classes and Lifecycle Rules"`
2. **Quy trình tự động hóa**:
   - `teacher-orchestrator` sẽ tự động chia việc và gọi song song `researcher-1` và `researcher-2`.
   - Cả hai subagent nghiên cứu trên internet và tìm kiếm hình ảnh minh họa chính thức.
   - `teacher-orchestrator` tích hợp kết quả, đính kèm hình ảnh có href link, viết file bài học và hướng dẫn bạn.
