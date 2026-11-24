# Review: 1_7_3 Paging Architecture

### Câu Hỏi 1: Phân mảnh ngoại vi (External Fragmentation) là gì trong các cơ chế cấp phát bộ nhớ liên tục trước đây, và tại sao việc gom bộ nhớ (Compaction) lại gây hại cho hiệu năng?

<details>
<summary>Đáp án</summary>

- **Phân mảnh ngoại vi (External Fragmentation)**: Là tình trạng tổng dung lượng RAM còn trống của hệ thống có thể rất lớn (lên tới hàng Gigabyte), nhưng lại bị xé nhỏ thành các khe hở vụn vặt rải rác khắp nơi. Do cơ chế cấp phát liên tục (Contiguous Allocation) và phân đoạn (Segmentation) đòi hỏi mỗi tiến trình phải có một dải ô nhớ vật lý liền mạch, hệ điều hành không thể nạp một tiến trình mới dù chỉ cần vài Megabyte liền khối.
- **Lý do Compaction gây hại**: Việc gom bộ nhớ (Compaction) để dọn dẹp các khe hở này đòi hỏi phải sao chép hàng gigabyte dữ liệu trên RAM, làm đóng băng toàn bộ hệ thống.
</details>

---

### Câu Hỏi 2: Trang ảo (Page) và Khung trang vật lý (Frame) trong kiến trúc phân trang (Paging) là gì, kích thước chuẩn phổ biến là bao nhiêu, và tại sao Paging loại bỏ hoàn toàn phân mảnh ngoại vi?

<details>
<summary>Đáp án</summary>

- **Khung trang vật lý (Physical Page Frame / Frame)**: Là các khối nhớ cố định được chia từ thanh RAM vật lý, kích thước chuẩn phổ biến nhất trên các kiến trúc hiện đại (x86, ARM, RISC-V) là $4096\text{ Bytes} = 4\text{ KB}$ ($2^{12}\text{ bytes}$).
- **Trang ảo (Virtual Page / Page)**: Là các lát cắt được chia từ không gian địa chỉ ảo của mỗi tiến trình, có kích thước bằng hệt kích thước Frame ($4\text{ KB}$).
- **Lý do loại bỏ 100% phân mảnh ngoại vi**: Vì mọi Trang ảo (Page) của tiến trình đều có thể được nạp vào **bất kỳ Khung trang vật lý (Frame) nào còn trống** trên RAM, bất kể vị trí của Frame đó nằm ở đầu, giữa hay cuối RAM. Hệ điều hành không cần vùng RAM liền mạch và không bao giờ phải gom bộ nhớ (Compaction).
</details>

---

### Câu Hỏi 3: Phân mảnh nội vi (Internal Fragmentation) xuất hiện như thế nào trong Paging, và mức lãng phí trung bình theo thống kê là bao nhiêu?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân xuất hiện**: Bộ nhớ trong kiến trúc phân trang luôn được cấp phát theo bội số nguyên của kích thước trang ($4\text{ KB}$). Nếu một tiến trình yêu cầu $4097\text{ bytes}$ dữ liệu, hệ điều hành bắt buộc phải cấp phát tròn **2 Pages ($8192\text{ bytes}$)**. Trang thứ hai chỉ dùng đúng $1\text{ byte}$, khiến $4095\text{ bytes}$ còn lại bên trong trang đó bị bỏ phí hoàn toàn.
- **Mức lãng phí trung bình**: Về mặt thống kê xác suất, trung bình mỗi phân vùng cấp phát chỉ lãng phí **nửa trang ($\approx 2\text{ KB}$)**.
</details>

---

### Câu Hỏi 4: Với kích thước trang chuẩn $4\text{ KB}$ ($2^{12}\text{ bytes}$), một địa chỉ ảo được chia thành những thành phần nào? Hãy nêu công thức tách các thành phần đó và công thức tính địa chỉ vật lý (Physical Address).

<details>
<summary>Đáp án</summary>

Một địa chỉ ảo được phần cứng tự động chẻ làm 2 phần:
1. **Virtual Page Number (VPN - Số hiệu trang ảo)**:
   - Nằm ở các bit cao (`[Chiều dài địa chỉ - 1 ... 12]`), biểu diễn số thứ tự trang ảo cần truy xuất và dùng làm chỉ số (Index) tra cứu trong Bảng Trang.
   - Công thức: $\text{VPN} = \text{Virtual Address} \gg 12$.
2. **Offset (Độ dời trong trang)**:
   - Nằm ở 12 bits thấp (`[11 ... 0]`), biểu diễn vị trí chính xác của byte dữ liệu bên trong trang (từ byte $0$ đến byte $4095$).
   - Công thức: $\text{Offset} = \text{Virtual Address} \ \& \ 0\text{xFFF}$.
   - **Tính bất biến**: Khi chuyển đổi sang địa chỉ vật lý, **Offset được giữ nguyên tuyệt đối** vì kích thước của Page và Frame hoàn toàn bằng nhau.

**Công thức tính Địa chỉ Vật lý:**
$$\text{Physical Address} = (\text{Physical Frame Number (PFN)} \times 4096) + \text{Offset} = (\text{PFN} \ll 12) \ | \ \text{Offset}$$
</details>

---

### Câu Hỏi 5: Bảng Trang (Page Table), Page Table Entry (PTE) và thanh ghi PTBR (`CR3` trên x86) đóng vai trò gì trong việc quản lý bộ nhớ giữa các tiến trình?

<details>
<summary>Đáp án</summary>

- **Bảng Trang (Page Table)**: Mỗi tiến trình độc lập sở hữu một Bảng Trang riêng do hệ điều hành quản lý. Đây là một mảng gồm các phần tử gọi là **Page Table Entry (PTE)**, mỗi phần tử lưu thông tin ánh xạ cho biết Trang ảo $i$ đang nằm tại Khung vật lý $\text{PFN}$ nào trên RAM cùng các bit điều khiển.
- **Thanh ghi cơ sở Bảng Trang (PTBR - Page Table Base Register)**: Nằm trực tiếp trên CPU (trên kiến trúc Intel/AMD x86 chính là thanh ghi điều khiển **`CR3`**). Mỗi khi hệ điều hành thực hiện chuyển đổi ngữ cảnh (Context Switch) sang tiến trình mới, nó chỉ cần nạp địa chỉ vật lý của Bảng Trang tiến trình đó vào `CR3`.
</details>

---

### Câu Hỏi 6: Trong cấu trúc PTE 64-bit của kiến trúc x86-64, các bit Present (`P`), Read/Write (`R/W`) và User/Supervisor (`U/S`) có chức năng gì?

<details>
<summary>Đáp án</summary>

1. **Present / Valid Bit (`P` - Bit 0)**:
   - `1`: Khung trang đang thực sự hiện diện trên thanh RAM vật lý.
   - `0`: Trang chưa được nạp hoặc đã bị hoán đổi (swap) ra ổ cứng. Nếu CPU truy xuất vào trang có `P = 0`, phần cứng sẽ kích hoạt bẫy **Ngắt Thiếu Trang (Page Fault Trap)**.
2. **Read / Write Bit (`R/W` - Bit 1)**:
   - `0`: Trang chỉ có quyền Đọc (Read-Only). Mọi hành vi ghi dữ liệu sẽ bị MMU chặn lại và báo lỗi `SIGSEGV`.
   - `1`: Trang cho phép cả Đọc và Ghi (Read-Write).
3. **User / Supervisor Bit (`U/S` - Bit 2)**:
   - `0`: Trang thuộc đặc quyền của Nhân (Kernel Mode / Ring 0); mã chạy ở User Mode truy xuất sẽ bị tiêu diệt ngay lập tức.
   - `1`: Trang cho phép tiến trình người dùng (User Mode / Ring 3) truy cập.
</details>

---

### Câu Hỏi 7: Các bit Accessed (`A`), Dirty (`D`), Page Size (`PS`) và No-Execute (`NX / XD`) trong PTE đảm nhận nhiệm vụ gì?

<details>
<summary>Đáp án</summary>

1. **Accessed Bit (`A` - Bit 5)**: Phần cứng CPU tự động bật bit này lên `1` mỗi khi có lệnh đọc hoặc ghi vào trang nhớ. Nhân OS dùng bit này để nhận diện trang nào đang được sử dụng (phục vụ thuật toán thay thế trang Clock / LRU).
2. **Dirty Bit (`D` - Bit 6)**: Phần cứng CPU tự động bật bit này lên `1` ngay khi có lệnh **Ghi** làm thay đổi nội dung trang. Nhờ đó hệ điều hành biết trang đã bị sửa đổi (dirty) và bắt buộc phải ghi dữ liệu trở lại ổ cứng trước khi giải phóng RAM.
3. **Page Size Bit (`PS` - Bit 7)**: `0` áp dụng kích thước trang chuẩn $4\text{ KB}$; `1` kích hoạt chế độ **Trang Siêu Lớn (Huge Page - $2\text{ MB}$ hoặc $1\text{ GB}$)**.
4. **No-Execute / Execute-Disable Bit (`NX / XD` - Bit 63)**: Khi bit này bật lên `1`, CPU từ chối nạp mã lệnh máy tính từ trang đó để thực thi. Hệ điều hành bật bit `NX` trên toàn bộ vùng nhớ Stack và Heap để vô hiệu hóa các cuộc tấn công tiêm mã độc (Shellcode Injection / Buffer Overflow); nếu có nỗ lực thực thi trên trang `NX = 1`, CPU phát ngắt ngoại lệ và OS gửi `SIGSEGV` kết liễu tiến trình.
</details>

---

### Câu Hỏi 8: Hãy tóm tắt luồng hoạt động của phần cứng MMU khi dịch một địa chỉ ảo sang địa chỉ vật lý trên RAM.

<details>
<summary>Đáp án</summary>

1. Địa chỉ ảo (ví dụ 32-bit với trang $4\text{ KB}$) được tách thành **VPN** (bits `[31:12]`) và **Offset** (bits `[11:0]`).
2. MMU đọc thanh ghi **`CR3` (PTBR)** để xác định vị trí của Bảng Trang (Page Table) hiện hành trong RAM, rồi dùng **VPN** làm chỉ số (Index) tra cứu ra phần tử **PTE** tương ứng.
3. MMU kiểm tra các bit trạng thái và quyền trong PTE (`P == 1` và các quyền `R/W`, `U/S`, `NX` hợp lệ):
   - **Nếu chưa nạp (`P == 0`) hoặc vi phạm quyền**: MMU lập tức kích hoạt ngoại lệ **Page Fault Trap** (khi `P = 0`) hoặc dẫn tới lỗi **`SIGSEGV`** (khi vi phạm quyền).
   - **Nếu hợp lệ**: MMU lấy **PFN** từ PTE, giữ nguyên phần **Offset** từ địa chỉ ảo ban đầu, và ghép lại thành **Địa chỉ Vật lý (Physical Address)** để truy xuất ô nhớ thực trên RAM.
</details>

---

### Câu Hỏi 9: Trên hệ thống 32-bit với kích thước trang $4\text{ KB}$, giả sử Bảng Trang cho biết `VPN = 3` đang ánh xạ tới `PFN = 2` (với `P = 1`). Địa chỉ logic `0x00003058` sẽ được dịch thành địa chỉ vật lý nào?

<details>
<summary>Đáp án</summary>

- **Bước 1 — Tách Offset và VPN**:
  - Vì kích thước trang là $4\text{ KB} = 2^{12}\text{ bytes}$, 12 bits thấp nhất (tương ứng **3 chữ số Hex cuối cùng**) là Offset:
    $$\text{Offset} = \text{0x058} \text{ (bằng } 5 \times 16^1 + 8 \times 16^0 = 88\text{ bytes)}$$
  - Các chữ số Hex còn lại phía trước là VPN:
    $$\text{VPN} = \text{0x00003058} \gg 12 = \text{0x00003} = 3$$
- **Bước 2 — Tra cứu Bảng Trang**:
  - Với $\text{VPN} = 3$, Bảng Trang có $P = 1$ và $\text{PFN} = 2$ (`0x2`).
- **Bước 3 — Ghép thành Địa chỉ Vật lý**:
  $$\text{Physical Address} = (\text{0x2} \ll 12) \ | \ \text{0x058} = \text{0x00002058}$$
  (Ở hệ thập phân: $2 \times 4096 + 88 = 8280$).
</details>

---

### Câu Hỏi 10: Trên Linux CLI, ta kiểm tra kích thước trang chuẩn và cờ hỗ trợ phần cứng `nx`/`pae` bằng lệnh nào? Các chỉ số `Rss`, `Pss` và `Private_Dirty` trong `/proc/[pid]/smaps` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

- **Lệnh kiểm tra kích thước trang chuẩn**: `getconf PAGESIZE` hoặc `getconf PAGE_SIZE` (thường trả về `4096`).
- **Lệnh kiểm tra cờ `nx` và `pae` của CPU**: `grep --color=auto -E "nx|pae" /proc/cpuinfo | head -n 2`.
- **Ý nghĩa các chỉ số trong `/proc/[pid]/smaps`**:
  - **`Rss` (Resident Set Size)**: Dung lượng RAM thực tế đang bị chiếm giữ bởi các trang nhớ có mặt (`P = 1`).
  - **`Pss` (Proportional Set Size)**: Phần RAM thực tế sau khi đã chia đều các trang dùng chung (Shared Pages) cho các tiến trình khác.
  - **`Private_Dirty`**: Lượng bộ nhớ riêng của tiến trình đã bị ghi đè, bắt buộc phải lưu ra đĩa swap nếu cần giải phóng RAM.
</details>

---

### Câu Hỏi 11: Tại sao thiết kế Bảng Trang phẳng (Flat Page Table) lại gây lãng phí RAM nghiêm trọng (hoặc bất khả thi trên hệ 64-bit), và hệ điều hành hiện đại giải quyết bằng kiến trúc nào?

<details>
<summary>Đáp án</summary>

- **Cạm bẫy của Bảng Trang phẳng (Flat Page Table)**:
  - Trên hệ **32-bit** với trang $4\text{ KB}$, không gian địa chỉ $4\text{ GB}$ có $2^{20} \approx 1.000.000\text{ Pages}$; với mỗi PTE chiếm $4\text{ bytes}$, mỗi Bảng Trang tiêu tốn **$4\text{ MB}$ RAM**. Nếu chạy $1000$ tiến trình, riêng việc lưu trữ Bảng Trang đã ngốn mất **$4\text{ GB}$ RAM**.
  - Trên hệ **64-bit**, không gian $2^{64}$ nếu dùng bảng phẳng sẽ tiêu tốn hàng triệu Terabyte RAM, hoàn toàn bất khả thi.
- **Giải pháp**: Hệ điều hành hiện đại dùng **Bảng Trang Đa Tầng (Multi-Level Page Tables)** (ví dụ cấu trúc 4 tầng PML4 trên x86-64: `PGD -> P4D -> PUD -> PMD -> PTE`). Nhờ đó, những vùng nhớ ảo chưa được tiến trình cấp phát sẽ không cần khởi tạo các bảng trang con, giúp tiết kiệm đến 99% bộ nhớ lưu trữ Bảng Trang.
</details>

---

### Câu Hỏi 12: Trang Siêu Lớn (Huge Pages: $2\text{ MB}$ và $1\text{ GB}$) giải quyết vấn đề hiệu năng nào cho các cơ sở dữ liệu lớn hoặc KVM/QEMU, và tại sao Redis hay MongoDB thường khuyến nghị tắt Transparent Huge Pages (THP)?

<details>
<summary>Đáp án</summary>

- **Vấn đề mà Huge Pages giải quyết**: Khi các CSDL lớn (PostgreSQL, MySQL InnoDB, Oracle Database, Redis) hoặc cụm máy ảo KVM/QEMU cấp phát hàng trăm GB RAM bằng trang nhỏ $4\text{ KB}$, số lượng phần tử Bảng Trang trở nên khổng lồ, khiến bộ nhớ đệm dịch địa chỉ phần cứng (**TLB - Translation Lookaside Buffer**) bị tràn liên tục (**TLB Miss Storm**) và kéo tụt 20–30% hiệu năng CPU. Dùng Huge Pages ($2\text{ MB}$ — gấp 512 lần trang chuẩn, hoặc $1\text{ GB}$) giúp giảm mạnh số lượng mục cần lưu trong TLB (ví dụ cấu hình qua `/proc/sys/vm/nr_hugepages`).
- **Lý do tắt Transparent Huge Pages (THP) trên Redis / MongoDB**: Dù THP tự động gom các trang $4\text{ KB}$ thành $2\text{ MB}$, nhưng trên các CSDL có tính chất truy cập ngẫu nhiên như Redis hay MongoDB, cơ chế chống phân mảnh động của THP (defrag background daemon) có thể gây ra hiện tượng giật lag độ trễ (**Latency Spikes**). Vì vậy khuyến nghị chính thức là tắt THP (`echo never | sudo tee /sys/kernel/mm/transparent_hugepage/enabled`).
</details>
