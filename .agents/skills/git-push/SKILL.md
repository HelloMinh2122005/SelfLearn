---
name: git-push
description: >-
  Use this skill when staging, committing, and pushing changes to Git in the SelfLearn workspace. Enforces the repository commit convention: `<type>: <day-month-year> - <details>` (where type is feat, fix, core, docs, refactor, chore, test).
---

# Git Push & Commit Skill

Skill này quy chuẩn hóa quy trình commit và push mã nguồn, bài học và tài liệu trong workspace **SelfLearn**, đảm bảo lịch sử Git luôn rõ ràng, nhất quán và dễ truy vết theo thời gian.

---

## 1. Định Dạng Chuẩn Commit Message (Commit Format)

   Mọi commit khi thực hiện trong repository BẮT BUỘC phải tuân theo cú pháp:

```text
<type>: <day-month-year> - <details>
```
*(Chấp nhận định dạng có dấu hai chấm `: ` hoặc khoảng trắng giữa `<type>` và `<day-month-year>`)*

### Thành phần cấu thành:

1. **`<type>`**: Loại thay đổi (chữ thường):
   - `feat`: Thêm bài học mới, chủ đề mới, phòng lab mới, tính năng mới.
   - `fix`: Sửa lỗi kỹ thuật, cú pháp CLI sai, lỗi chính tả, thông tin kiến trúc chưa chuẩn xác.
   - `core`: Cập nhật cấu trúc nền tảng repository, khung chương trình tổng thể, checklist tổng, cập nhật skills/rules của hệ thống.
   - `docs`: Cập nhật tài liệu hướng dẫn, `README.md`, sổ tay ghi chú `note.md`.
   - `refactor`: Tái cấu trúc thư mục, chuẩn hóa phân cấp, sắp xếp lại nội dung mà không làm thay đổi bản chất.
   - `chore`: Cập nhật cấu hình công cụ, `.gitignore`, script tự động hóa, dọn dẹp file tạm.
   - `test`: Thêm kịch bản kiểm thử, script xác minh (`verify.sh`) cho phòng lab.

2. **`<day-month-year>`**: Ngày - Tháng - Năm tại thời điểm commit theo định dạng **`DD-MM-YYYY`** (ví dụ: `19-09-2026`).
   - Lệnh shell lấy nhanh ngày hiện tại: `date +"%d-%m-%Y"`

3. **`<details>`**: Mô tả ngắn gọn, súc tích nội dung thay đổi chính (bằng tiếng Việt hoặc tiếng Anh).

---

## 2. Bảng Ví Dụ Mẫu Chuẩn Xác

| Loại (Type) | Ví dụ Commit Message |
| :--- | :--- |
| **`feat`** | `feat: 19-09-2026 - Thêm bài học 1_1_1 Create users and groups và case study NAB` |
| **`core`** | `core: 19-09-2026 - Khởi tạo cấu trúc 3 tầng cho 5 domain AZ-104 và CHECKLIST.md` |
| **`fix`** | `fix: 19-09-2026 - Đính chính giải thích phân quyền Directory Role cho cá nhân vs nhóm` |
| **`docs`** | `docs: 19-09-2026 - Bổ sung ví dụ đời sống NAB vào note.md và bài giảng 1_1_1` |
| **`refactor`**| `refactor: 19-09-2026 - Chuẩn hóa tên thư mục Domain dùng gạch ngang tương thích Windows` |
| **`chore`** | `chore: 19-09-2026 - Thêm git-push skill và script push.sh tự động` |

---

## 3. Quy Trình Thực Hiện Từng Bước (Workflow)

Khi agent hoặc người dùng chuẩn bị push code:

### Bước 1: Rà soát trạng thái Git (Git Status & Diff)
Kiểm tra các tệp đã sửa đổi hoặc chưa theo dõi:
```bash
git status
git diff --stat
```
> [!WARNING]
> Tuyệt đối không commit các file nhạy cảm: file cấu hình VPN (`*.ovpn`), Private Keys, Secrets, Credentials, Tokens hoặc tệp `.env`. Hãy đảm bảo `.gitignore` đã chặn các file này.

### Bước 2: Thêm các tệp cần commit (Git Add)
```bash
# Thêm toàn bộ các file đã thay đổi (sau khi đã kiểm tra an toàn)
git add .

# Hoặc chỉ thêm các file cụ thể
git add path/to/file.md
```

### Bước 3: Tạo commit theo đúng chuẩn cú pháp
```bash
# Cú pháp tự động lấy ngày hiện tại:
TODAY=$(date +"%d-%m-%Y")
git commit -m "<type>: ${TODAY} - <details>"

# Ví dụ thực tế:
git commit -m "feat: $(date +'%d-%m-%Y') - Hoàn thiện bài giảng 1_1_1 và sổ tay ghi chú AZ-104"
```

### Bước 4: Đẩy lên Git Remote (Git Push)
```bash
# Xác định nhánh hiện tại và push
BRANCH=$(git branch --show-current)
git push origin "$BRANCH"
```

---

## 4. Script Tự Động Hóa (Automation Helper)

Thư mục skill này cung cấp sẵn kịch bản `scripts/push.sh` để thực hiện toàn bộ quy trình trên chỉ với một câu lệnh duy nhất:

```bash
# Cách sử dụng:
./.agents/skills/git-push/scripts/push.sh <type> "<details>"

# Ví dụ:
./.agents/skills/git-push/scripts/push.sh feat "Hoàn thành bài giảng 1_1_1 Create users and groups"
./.agents/skills/git-push/scripts/push.sh docs "Cập nhật sổ tay ghi chú note.md"
```
