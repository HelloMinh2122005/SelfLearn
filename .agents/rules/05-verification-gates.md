# Quy Tắc 05: Cổng Kiểm Chứng Bắt Buộc (Verification Gates)

Quy tắc này áp dụng cho mọi thao tác tạo mới hoặc sửa nội dung giáo trình, bao gồm cả việc sửa theo kết quả audit. Nếu quy tắc này mâu thuẫn với tốc độ hoàn thành, **ưu tiên quy tắc này**.

Từ 20/11/2026 quy trình là **viết trước, kiểm chứng sau** (lý do và số đo: `04-squad-orchestration.md` mục 2.1 điểm 12). Mức kiểm chứng không giảm: mọi claim vẫn phải có trang chính thức và trích dẫn nguyên văn. Chỉ thứ tự thay đổi.

---

## 1. Nguyên Tắc Nền Tảng

1. **Không có bằng chứng thì không công bố**: `author` được viết bản nháp từ hiểu biết của mình. Bản nháp chưa phải giáo trình: header ghi `Trạng thái: Bản nháp, chờ kiểm chứng`, không đánh dấu `[x]`, Teacher không trình bày như kiến thức đã kiểm chứng. Bài chỉ được công bố khi **mọi** claim đều `VERIFIED`.
2. **Mọi fact đều có claim ID**: Mỗi câu chứa fact kỹ thuật mang tag `<!-- ev: C<P>.n -->`. Fact không có tag thì không ai kiểm, nên kiểm tra cơ học coi dòng thiếu tag là lỗi phải sửa, và một verifier rà soát (sweep) tìm fact viết bằng lời không có tag.
3. **Snippet không phải bằng chứng**: Kết quả của `search_web` chỉ dùng để tìm URL. Verifier phải mở trang bằng `evidence.py fetch` trước khi kết luận.
4. **Trí nhớ của model không phải nguồn**: Bản nháp viết từ trí nhớ là giả thuyết. Verifier không dùng trí nhớ để chấm `VERIFIED`.
5. **Người viết không tự kiểm chứng bài của mình**: `author` không có `search_web`; `verifier` là subagent riêng, chạy model khác, và không sửa bài.
6. **Sửa cục bộ**: Claim `FAIL` hay `NOT_FOUND` chỉ làm sửa đúng câu hoặc khối đó. Không viết lại phần đã `VERIFIED`.
7. **Tuyên bố phải đi kèm bằng chứng**: Không được nói "đã kiểm chứng" hoặc "đã sửa hết" nếu không có ledger và Verification Report tương ứng.

---

## 2. Verify Ledger (Sổ Kiểm Chứng)

Mỗi verifier ghi ledger riêng tại `<course-folder>/.evidence/verify/<WRITING_TASK_ID>-V<k>.md` (lần kiểm lại: `-RC<n>.md`). Thiếu cột nào thì báo cáo không hợp lệ.

| ID | Lesson | Claim as written | URL + section đã mở | Trích dẫn nguyên văn (≤ 300 ký tự) | Áp dụng cho (phiên bản/nền tảng) | Trạng thái | Correct statement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C5.3 | 6_5_5 | ... | ... | "..." | Helm 3.x | VERIFIED | |

- Trạng thái chỉ gồm: `VERIFIED`, `FAIL` (kèm câu đúng theo trang), `NOT_FOUND`.
- ID của dòng = claim ID trong bài. ID từ `C<P>.101` trở lên là fact không có tag do verifier rà soát tìm ra.
- Verifier chạy `evidence.py quotes <ledger>` trước khi báo cáo: không có dòng `MISSING`. Dấu `|` trong trích dẫn viết là `\|`.
- **Không sửa ledger cũ**. Lần kiểm lại ghi ledger mới; khi đóng bài, ledger kiểm lại được truyền sau cùng và ghi đè dòng cùng ID (`evidence.py lesson --ledger V1 … Vk RC1 …`).
- Ledger nghiên cứu cũ (`.evidence/research/`, ID `R`/`L`) vẫn hợp lệ cho các bài viết trước 20/11/2026.

---

## 3. Các Cổng Bắt Buộc

| Cổng | Ai, khi nào | Điều kiện đạt | Khi không đạt |
| :--- | :--- | :--- | :--- |
| **G1: Draft** | Author, ngay sau khi viết; Teacher kiểm trên báo cáo | `check_curriculum.py --only` và `evidence.py lesson` (draft mode, không `--ledger`) exit `0`: đủ 7 mục, ≤ 24 KB, 12–25 claim ID, 0 dòng fact thiếu tag | Author sửa một đợt, chạy lại một lần |
| **G2: Claim Verification** | Verifier × K song song (≤ 10 claim mỗi verifier, một verifier có `SWEEP`) | Mọi claim `VERIFIED` trên trang đã mở, `evidence.py quotes` 0 `MISSING`; sweep: script exit `0`, fact không tag đều đúng, link mục 7 sống | Chuyển danh sách FAIL / NOT_FOUND / tag cần thêm cho chính Author đó (G3) |
| **G3: Local Fix** | Author, cùng task | Chỉ đổi các câu bị nêu: FAIL → viết lại theo trích dẫn, giữ ID; NOT_FOUND → xóa hoặc bỏ fact; thêm tag được yêu cầu. Không thêm claim mới | Teacher gửi lại đúng các ID còn thiếu |
| **G4: Re-check** | Một verifier mới, `MODE: recheck` | Mọi ID đã sửa hoặc thêm tag đều `VERIFIED` trong ledger `-RC<n>` | Tối đa 2 vòng G3 + G4, sau đó báo người học các ID còn mở |
| **G5: Close** | Author, sau khi Teacher báo PASS | `evidence.py lesson <file> --ledger V1 … Vk RC…` và `check_curriculum.py --online --only` exit `0`; header `Trạng thái` đổi thành `Đã kiểm chứng (verifier PASS, <ngày>)` | Author báo lỗi cho Teacher, không đánh dấu `[x]` |

Chỉ sau khi G5 đạt mới được đánh dấu `[x]` trong `CHECKLIST.md` và trình bày bài học là đã kiểm chứng.

### 3.1 Patch (sửa một phần bài đã có)

Yêu cầu kiểu "cập nhật giải thích này vào file" là **patch**, không phải bài mới. Cổng thu nhỏ theo phần được chèn:

| Cổng | Patch |
| :--- | :--- |
| G1 | `evidence.py lesson <file> --base <bản sao trước khi sửa>`: tối đa 3 dòng cũ bị đổi, chỉ dòng mới cần tag, vượt 24 KB chỉ là cảnh báo (báo người học, không cắt phần khác) |
| G2 | Một verifier, `PATCH: yes`, chỉ các claim ID trên dòng mới, không sweep. Patch không có claim (chỉ ẩn dụ, giải thích) thì bỏ qua G2 |
| G3–G4 | Như bài mới, chỉ trên các ID đó |
| G5 | `evidence.py lesson <file> --base <bản sao> --ledger …` exit `0`; header giữ nguyên |

Phần cũ của bài không bị kiểm lại trong một patch. Muốn kiểm lại bài cũ thì đó là yêu cầu riêng, người học phải nói rõ.

---

## 4. Điều Phối Subagent

1. **Không poll và không hối thúc**: Không dùng `sleep`, `tail` transcript, `manage_subagents`/`manage_task` để hỏi tiến độ, hoặc tin nhắn kiểu "gửi báo cáo ngay". Subagent sẽ tự gửi kết quả khi xong. Mỗi lần poll là một lượt gọi model đọc lại toàn bộ context.
2. **Mỗi task một subagent mới**: Mỗi bài, mỗi chunk verifier và mỗi lần re-check là một subagent mới. Chỉ vòng sửa G3 dùng `send_message` tới chính Author đã viết bài.
3. **Song song tối đa**: Mọi Author của một run chạy cùng lúc; mọi verifier của mọi bài chạy cùng lúc ngay khi bài đó qua G1.
4. **Không kill Author hoặc Verifier đang chạy** trừ khi người học yêu cầu hoặc subagent đã treo quá 15 phút không có bước mới. Subagent bị kill hoặc trả kết quả rỗng: giao lại chunk đó cho subagent mới. Không tự viết hay tự kiểm thay.
5. **Verifier phải chạy trên model khác tác giả**: Gọi `invoke_subagent` với `TypeName: "verifier"` và `Model: "pro"`, không dùng `inherit`. Lưu ý: ở RUN 6_3, 6_5 và 8830302d (20/11), transcript cho thấy Verifier thực tế chạy `gemini-3.8-flash-tiered`, không phải `pro`. Sau mỗi RUN, kiểm tra cột model của `run_cost.py`; nếu Verifier không chạy trên model khác Author, ghi rõ trong báo cáo cuối.

---

## 5. Sửa Nội Dung Đã Có

1. Sửa từng đoạn bằng `edit_file`. **Cấm ghi đè toàn bộ file** đã có nội dung.
2. Kết quả audit từ AI hoặc người khác là **danh sách cần kiểm chứng**, không phải bằng chứng. Mỗi mục được sửa như một patch (mục 3.1).
3. Chỉ được xóa hoặc đổi tên heading, hoặc rút gọn file đáng kể, khi người học đồng ý rõ ràng. Không còn công cụ tự động chặn việc này (đã bỏ rewrite guard), nên Author phải tự giữ quy tắc.
