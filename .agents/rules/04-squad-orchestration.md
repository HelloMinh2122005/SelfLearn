# Quy Tắc 04: Điều Phối Biệt Đội Tác Tử (Squad Orchestration Protocol)

Quy tắc này quy định chuẩn giao tiếp, phân chia trách nhiệm và quy trình phối hợp khép kín giữa các tác tử trong biệt đội **SelfLearn Squad**:
- **Teacher - Orchestrator**: Điều phối viên & Giảng viên trưởng.
- **Author** (`author`): Viết bản nháp bài học ngay, từ hiểu biết của mình, gắn claim ID cho mọi fact; sau đó chỉ sửa các claim bị verifier đánh trượt. Mỗi bài học hoặc lab một instance mới, chạy song song. Không nghiên cứu trước (từ 20/11/2026, xem mục 2.1 điểm 12).
- **Verifier** (`verifier`): Mỗi instance kiểm chứng một nhóm ≤ 10 claim trên trang chính thức, nhiều instance chạy song song (xem `05-verification-gates.md`).

---

## 1. Bảng Phân Quyền & Ranh Giới Trách Nhiệm (Role Separation)

| Tác tử | Định Danh | Trách Nhiệm Trọng Tâm | Quyền Ghi File | Quyền Truy Cập Mạng |
| :--- | :--- | :--- | :---: | :---: |
| **Teacher - Orchestrator** | `teacher-orchestrator` | **Chỉ giao task, review báo cáo, thiết kế khung sư phạm và truyền đạt cho người học**. Tuyệt đối không search web và không ghi file giáo trình trong mọi trường hợp. | ❌ (Chỉ đọc) | ❌ |
| **Author** (1 instance / bài hoặc lab) | `author` | **Một bài học, từ nháp đến đóng bài**: viết file `*.md` đủ 7 mục trong một lượt, gắn tag `<!-- ev: C<P>.n -->` cho mọi fact (12–25 claim), chạy kiểm tra nháp, báo cáo ≤ 15 dòng kèm các chunk claim. Sau đó chỉ sửa đúng các câu FAIL / NOT_FOUND, và đóng bài sau PASS (kiểm tra cuối, header, `CHECKLIST.md`). Nhận cả việc nhỏ (pre-flight, sửa README, đóng module). | ✅ (`*.md`) | ❌ (không `search_web`, không `fetch`) |
| **Verifier** (1 instance / chunk ≤ 10 claim) | `verifier` | **Kiểm chứng độc lập từng claim**: tự tìm và mở trang Tier-1, ghi verify ledger có trích dẫn nguyên văn và kết luận `VERIFIED` / `FAIL` (kèm câu đúng) / `NOT_FOUND`, chạy `evidence.py quotes`. Một instance mỗi bài làm thêm sweep (fact không tag, link, coverage). Không sửa giáo trình. | ✅ (chỉ verify ledger của mình) | ✅ (`search_web`, `evidence.py fetch`) |

---

## 2. Luồng Phối Hợp (Write-First Delivery Pipeline)

$$\text{Learner} \rightarrow \text{Teacher} \xrightarrow{\text{Contract}} \text{Author} \times N \xrightarrow{\text{Draft + chunks}} \text{Verifier} \times K \xrightarrow{\text{FAIL ids}} \text{Author fix} \xrightarrow{} \text{Re-check} \xrightarrow{\text{PASS}} \text{Close} \rightarrow \text{Learner}$$

1. **Bước 1: Tiếp nhận & Phân rã (Teacher)**
   - Teacher tiếp nhận yêu cầu (tiếng Việt hoặc tiếng Anh) và tách run thành **một contract cho mỗi bài học**, mỗi contract giao cho một `author` mới, chạy song song.
   - Khung sư phạm (ẩn dụ, thông điệp cốt lõi) và `CLAIM_PREFIX` được ghi **ngay trong contract**.
2. **Bước 2: Viết nháp (Author - G1)**
   - Viết bài một lượt từ hiểu biết của mình, theo quy tắc viết cho người mới (`03-learning-methodology.md` mục 2), ≤ 24 KB.
   - Mỗi fact một tag `C<P>.n`. Không chắc thì bỏ hoặc nói khái quát hơn, không bịa flag hay URL.
   - Chạy `check_curriculum.py --only` + `evidence.py lesson` (draft mode) + `evidence.py claims --chunk 10`, tối đa 2 lần. Báo cáo kèm danh sách chunk.
3. **Bước 3: Kiểm chứng song song (Verifier × K - G2)**
   - Teacher kiểm báo cáo nháp (G1), rồi gọi **một verifier mới cho mỗi chunk**, tất cả cùng lúc, `Model: "pro"`. Một verifier mỗi bài có `SWEEP: yes`.
   - Mỗi verifier ghi ledger riêng `.evidence/verify/<WRITING_TASK_ID>-V<k>.md` và báo cáo ≤ 12 dòng.
4. **Bước 4: Sửa cục bộ & kiểm lại (Author - G3, Verifier - G4)**
   - Không có FAIL: sang bước 5.
   - Có FAIL / NOT_FOUND / tag cần thêm: Teacher gửi đúng các ID đó cho chính Author (`send_message`). Author chỉ sửa các câu đó.
   - Một verifier mới kiểm lại **chỉ các ID đã sửa**, ghi ledger `-RC<n>`. Tối đa 2 vòng.
5. **Bước 5: Đóng bài & Giảng dạy (Author - G5, Teacher)**
   - Author chạy kiểm tra cuối với mọi ledger (ledger kiểm lại truyền sau cùng), đổi header `Trạng thái`, ghi evidence index, cập nhật `CHECKLIST.md` (nếu contract có).
   - Teacher trình bày bài giảng kèm Active Recall Quiz và kết quả kiểm chứng (số claim, số FAIL ban đầu, đã sửa gì).

---

## 2.1 Ngân Sách Ngữ Cảnh & Chi Phí (Context and Cost Budget)

Số liệu đo từ đợt chạy 12–14/11/2026 (module 1_1 đến 1_7, khoảng 42 bài): **243M input token**. **78%** đến từ các subagent bị dùng lại qua nhiều bài/module cho tới khi context chạm giới hạn 256K. Research report 100–140 KB được gửi thẳng vào context của Teacher. Writer chuyển lệnh kiểm tra xuống chạy nền rồi poll tới 75 lần. Teacher gọi `manage_subagents` 50 lần để kiểm tra tiến độ. Các quy định dưới đây **không nới lỏng cổng kiểm chứng nào**:

1. **Mỗi task một subagent mới**: Mỗi contract bắt đầu bằng `invoke_subagent` mới. Chỉ dùng `send_message` cho chính task đó (vòng sửa G3).
2. **Truyền đường dẫn, không truyền nội dung**: Verifier nhận đường dẫn bài + claim ID, không nhận bài học hay ledger dán vào tin nhắn.
3. **Không poll**: Sau `invoke_subagent` thì chờ tin nhắn kết quả. Lệnh kiểm tra chạy foreground (mỗi lệnh dưới 30 giây).
4. **Mở trang bằng script**: `evidence.py fetch <url> --grep <term>` cache mỗi URL một file và chỉ in dòng khớp. Cấm `cat` cả trang.
5. **Ngân sách bài học**: giới hạn cứng 24 KB, 12–25 claim nguyên tử, **không có ngưỡng mềm**.
6. **Mỗi RUN một conversation**: Báo cáo xong thì dừng.

Đo lại trên RUN 6_3 (8 bài) và RUN 6_5 (6 bài) sau 6 quy định trên. Bảng sau đếm cả cache read, bằng `run_cost.py`:

| Run | Tổng | Writer | Researcher | Teacher | Verifier |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 6_3 | 68,7M | 58% (526 call) | 35% (249 call) | 3,6% | 2,5% |
| 6_5:1-6 | 64,9M | 51% (413 call) | 43% (283 call) | 2,9% | 2,6% |

- Researcher ôm cả chủ đề: 115–158 call, context 200–250K, ledger 31–60 claim mỗi bài.
- Writer viết 26–30 KB rồi cắt từng câu, 5–7 vòng, context 100–140K, 46–99 call mỗi instance.
- Phần Verifier thấp vì G5 của 6_3 chưa chạy xong. Ở các run network 14/11, Verifier chiếm 14–37%.

Vì vậy bổ sung:

7. **Một bài một tác tử**, song song. Tối đa 25 claim. Fact dùng chung thuộc về bài đầu tiên dạy nó.
8. **Viết một lượt**: lập dàn ý theo KB, ghi file một lần, giới hạn số lần chạy kiểm tra.
9. **Mỗi kiểm tra chỉ chạy một lần**: verifier chạy `evidence.py quotes` trên ledger của mình; kiểm tra cuối chạy một lần khi đóng bài.
10. **Gộp researcher và writer thành `author`** (19/11/2026). Sau quy định 7, mỗi bài có đúng một researcher và một writer, nên việc tách chỉ còn chi phí bàn giao. Tính độc lập mà Quy tắc 05 yêu cầu là giữa **tác giả và Verifier**, nên vẫn giữ nguyên.
11. **Đo sau mỗi RUN**: `python3 .agents/skills/curriculum-verify/scripts/run_cost.py` in token theo vai trò và model thực tế.
12. **Viết trước, kiểm chứng sau** (20/11/2026). RUN `8830302d` (viết lại bài 6_5_5 theo mô hình `author` nghiên cứu trước, 21 claim, 3,7M token) đo theo thời gian thực:

    | Pha | Thời gian | Ghi chú |
    | :--- | :--- | :--- |
    | Teacher trước khi giao việc | ~2,0 phút | 5 lần đoán đường dẫn file sai (`file does not exist`) |
    | Author nghiên cứu + ledger + `quotes` | ~3,5 phút | nằm trên đường găng, các bài khác không chạy thay được |
    | Author viết bài | ~1,8 phút | |
    | Author sửa lỗi kiểm tra cơ học + `--online` | ~3,4 phút | |
    | Verifier | ~1,3 phút | chỉ đối chiếu quote có sẵn trong ledger |
    | **Tổng từ lúc yêu cầu đến khi kiểm chứng xong** | **~12,7 phút** | |

    Nghiên cứu trước khi viết là bước dài nhất trên đường găng, chạy tuần tự trong một agent, trong khi verifier lại mở cùng các trang đó. Mô hình mới: Author viết ngay (không `search_web`), verifier làm phần nghiên cứu **sau khi viết, song song theo chunk ≤ 10 claim**, và chỉ các câu FAIL quay lại Author. Kỳ vọng: đường găng còn khoảng viết + một chunk verifier + (nếu có) một vòng sửa ngắn. Rủi ro đã biết: bản nháp từ trí nhớ sai nhiều hơn với tính năng mới (Helm 4, CLI đổi gần đây), làm tăng số vòng sửa. **Chưa có số đo**; RUN đầu tiên theo mô hình này là mốc so sánh. Cần ghi: thời gian thực từng pha, tỷ lệ claim FAIL/NOT_FOUND ở G2, số vòng G3-G4, token mỗi bài (6_5 là ~10,8M, RUN 8830302d là 3,7M). Nếu tỷ lệ FAIL ở G2 vượt khoảng 30% claim, cân nhắc cho Author tra cứu có giới hạn các claim phụ thuộc phiên bản.

13. **Patch cho bài đã có** (21/11/2026). RUN `40d9f976`: người học nhờ "update giải thích này vào file" bài 6_5_7. Teacher giao contract viết bài mới. Draft check liệt kê mọi dòng chưa tag của bài cũ, nên Author viết lại 98 dòng và gắn 19 claim. Sau đó 3 verifier chạy (một verifier ~76 call cho 9 claim). Tổng **~24 phút, 12,8M token**, trong khi đoạn giải thích chỉ thành một gạch đầu dòng. Bổ sung: Teacher phân loại yêu cầu trước (hỏi đáp / patch / bài mới); patch dùng `MODE: patch` và `evidence.py lesson --base <bản sao trước khi sửa>`, chỉ xét dòng mới; một verifier chỉ kiểm claim mới; verifier dừng ở giới hạn call và trả `INCOMPLETE`. Mục tiêu cho một patch: dưới 5 phút.

---

## 3. Quy Chuẩn Đa Ngôn Ngữ (Dynamic Language)

- Tự động nhận diện và phản hồi theo ngôn ngữ của người học (tiếng Anh hoặc tiếng Việt). Giữ nguyên thuật ngữ kỹ thuật chuẩn quốc tế.

---

## 4. Mẫu Giao Thức Phân Công (Contract)

Mẫu đầy đủ: Author ở `.agents/agents/teacher-orchestrator.md` mục 2 và `.agents/agents/author.md` mục 4 (giống nhau); Verifier ở `.agents/agents/verifier.md` mục 5. Các trường bắt buộc của Author: `WRITING_TASK_ID`, `LESSON`, `ACCEPTANCE_CRITERIA`, `AUTHORIZED_SOURCES`, `CLAIM_PREFIX`, `CLAIMS: 12-25`, `OUT_OF_SCOPE`, `TARGET_FILE`, `SIZE_BUDGET: tối đa 24 KB`, `PEDAGOGICAL_BLUEPRINT`, `CHECKLIST_FILE`.
