# Review: 1_7_4 Translation Lookaside Buffer

### Câu Hỏi 1: Vì sao cấu trúc bảng trang đa cấp (Multi-level Page Tables) gây suy giảm hiệu năng nghiêm trọng và TLB giải quyết vấn đề này như thế nào?

<details>
<summary>Đáp án</summary>

Trong các hệ điều hành 64-bit hiện đại (như x86-64), bảng trang có kích thước rất lớn nên phải chia thành bảng trang đa cấp gồm 4 đến 5 tầng lồng nhau nằm rải rác trong RAM. Nếu không có bộ nhớ đệm hỗ trợ, cứ mỗi thao tác đọc/ghi bộ nhớ thông thường của CPU, phần cứng phải thực hiện thêm 4 đến 5 lần truy cập RAM bổ sung để duyệt tuần tự qua các tầng bảng trang trước khi tới được ô nhớ thực tế, làm tốc độ máy tính chậm đi từ $400\%$ đến $500\%$.

**TLB (Translation Lookaside Buffer)** giải quyết vấn đề này bằng cách đóng vai trò là một bộ nhớ đệm phần cứng siêu tốc đặt trực tiếp trên chip CPU bên trong MMU, lưu sẵn các ánh xạ dịch địa chỉ hay dùng để tra cứu nhanh mà không cần đi duyệt bảng trang trong RAM ở đa số trường hợp.
</details>

### Câu Hỏi 2: Bản chất phần cứng của TLB là gì, mỗi dòng trong TLB lưu trữ những thông tin nào và tại sao kích thước TLB thường khá nhỏ?

<details>
<summary>Đáp án</summary>

- **Bản chất phần cứng**: TLB là một bộ nhớ đệm liên kết hoàn toàn (**Fully Associative Cache**), tích hợp các bộ so sánh phần cứng (comparators) hoạt động song song giúp kiểm tra toàn bộ các mục (entries) đồng thời chỉ trong **1 chu kỳ xung nhịp (clock cycle)**.
- **Thông tin mỗi dòng TLB**: Lưu một cặp ánh xạ gồm `[Tag: Virtual Page Number (VPN) | Physical Frame Number (PFN) | Bits thuộc tính]`.
- **Lý do kích thước nhỏ (từ 64 đến 1536 mục, thường chia thành L1 D-TLB, L1 I-TLB và L2 Shared TLB)**: Vì mạch phần cứng so sánh song song rất đắt đỏ, tiêu thụ điện năng lớn và tỏa nhiều nhiệt, nên không thể nhét quá nhiều mục lên diện tích silicon nhỏ của chip CPU.
</details>

### Câu Hỏi 3: Quá trình dịch địa chỉ diễn ra như thế nào khi xảy ra TLB Hit?

<details>
<summary>Đáp án</summary>

Khi xảy ra **TLB Hit (Trúng đệm)**:
1. Phần cứng MMU tra cứu song song và tìm thấy ngay **VPN** trong TLB.
2. **PFN** tương ứng được lấy trực tiếp từ dòng TLB và ghép nối với **Offset** của địa chỉ ảo (`PA = (PFN << 12) | Offset`) để tạo thành địa chỉ vật lý.
3. Dữ liệu trong RAM hoặc CPU Cache L1/L2 được truy xuất tức thì với chỉ 1 lần truy cập dữ liệu, hoàn toàn không cần chạm vào bảng trang trong RAM.
</details>

### Câu Hỏi 4: Khi xảy ra TLB Miss, hai cơ chế Hardware-Managed TLB và Software-Managed TLB xử lý khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

Khi VPN không tồn tại trong TLB (**TLB Miss**), hệ thống phải tiến hành **Page Table Walk** để tìm ánh xạ:
- **Hardware-Managed TLB** (trên kiến trúc x86, ARM): Bộ điều khiển phần cứng tích hợp trên MMU tự động đọc thanh ghi `CR3`, duyệt qua cây bảng trang đa cấp trong RAM, nạp ánh xạ mới vào TLB và tự động thử lại lệnh vừa thực thi.
- **Software-Managed TLB** (trên kiến trúc MIPS, SPARC): Phần cứng bắn ra một ngắt ngoại lệ (**TLB Miss Trap**). Nhân hệ điều hành nhảy vào đoạn mã xử lý ngắt để tra cứu bảng trang bằng phần mềm, gọi lệnh đặc quyền nạp bản ghi vào TLB, rồi trả quyền điều khiển về cho tiến trình.
</details>

### Câu Hỏi 5: Trong kiến trúc bảng trang 4 cấp (4-Level Paging) trên x86-64, địa chỉ ảo 48-bit được chia thành những phần nào và kích thước mỗi bảng trang là bao nhiêu?

<details>
<summary>Đáp án</summary>

Địa chỉ ảo 48-bit được chia thành 5 phần:
- **PML4** (9 bits, Bits 47–39): Page Map Level 4 (gốc bảng trang được trỏ bởi thanh ghi `CR3`).
- **PDPT** (9 bits, Bits 38–30): Page Directory Pointer Table (Level 3).
- **PD** (9 bits, Bits 29–21): Page Directory (Level 2).
- **PT** (9 bits, Bits 20–12): Page Table.
- **Offset** (12 bits, Bits 11–0): Vị trí byte bên trong khung trang vật lý 4 KB.

Mỗi tầng bảng trang có $2^9 = 512$ phần tử (entries), mỗi entry có kích thước $8\text{ bytes}$ ($64\text{ bits}$), nên kích thước mỗi bảng trang ở từng tầng bằng $512 \times 8\text{ bytes} = 4096\text{ bytes} = 4\text{ KB}$ (vừa khít 1 khung trang vật lý tiêu chuẩn).
</details>

### Câu Hỏi 6: Công thức tính Thời gian truy cập bộ nhớ hiệu dụng (EMAT) với bảng trang $N$ cấp là gì và tại sao trường hợp TLB Miss lại cần $(N + 1)$ lần truy cập RAM?

<details>
<summary>Đáp án</summary>

Công thức tính **EMAT (Effective Memory Access Time)**:
$$EMAT = h \times (t_{\text{TLB}} + t_{\text{RAM}}) + (1 - h) \times (t_{\text{TLB}} + (N + 1) \times t_{\text{RAM}})$$

Trong đó:
- $h$: Tỷ lệ trúng đệm TLB (thường đạt $98\%$ đến $99.9\%$ nhờ tính cục bộ Spatial & Temporal Locality).
- $t_{\text{TLB}}$: Thời gian tra cứu TLB ($\approx 1\text{ ns}$).
- $t_{\text{RAM}}$: Thời gian truy xuất RAM ($\approx 50\text{ ns} - 100\text{ ns}$).
- $N$: Số cấp bảng trang ($N=4$ cho 4-level paging, $N=5$ cho 5-level paging).

**Giải thích $(N + 1)$ lần truy cập RAM khi TLB Miss**: Hệ thống mất **$N$ lần** truy cập RAM để duyệt qua $N$ tầng bảng trang nhằm tìm ra PFN, cộng thêm **$1$ lần** truy cập RAM cuối cùng để đọc hoặc ghi dữ liệu thực tế mà câu lệnh yêu cầu.
</details>

### Câu Hỏi 7: Chuyển ngữ cảnh (Context Switch) theo phương pháp truyền thống ảnh hưởng đến TLB như thế nào?

<details>
<summary>Đáp án</summary>

Vì mỗi tiến trình sở hữu một không gian địa chỉ ảo riêng biệt (cùng một VPN ở Tiến trình A và Tiến trình B sẽ trỏ tới hai vùng dữ liệu khác nhau), nên theo phương pháp truyền thống, mỗi khi hệ điều hành chuyển ngữ cảnh và nạp lại thanh ghi cơ sở bảng trang `CR3`, CPU buộc phải **xóa sạch toàn bộ TLB (TLB Flush / Invalidate)**.

Hậu quả là khi tiến trình mới bắt đầu chạy, TLB hoàn toàn trống rỗng (**"Cold TLB"**), khiến tiến trình bị hàng loạt TLB Miss liên tiếp trong những miligiây đầu tiên và làm suy giảm thông lượng hệ thống.
</details>

### Câu Hỏi 8: Tính năng PCID (trên x86-64) và ASID (trên ARM) giúp tối ưu hóa quá trình chuyển ngữ cảnh như thế nào?

<details>
<summary>Đáp án</summary>

- Trên x86-64, tính năng **Process Context Identifier (PCID)** (được kích hoạt qua bit `PCIDE` trong thanh ghi điều khiển `CR4`, tương ứng với **ASID** trên ARM) gắn kèm một nhãn định danh 12-bit vào mỗi dòng lưu trữ trong TLB.
- Khi chuyển ngữ cảnh giữa các tiến trình, CPU chỉ cần thay đổi số PCID hiện tại mà **không cần xóa các dòng TLB của tiến trình cũ**.
- Khi hệ điều hành chuyển ngược lại tiến trình cũ, các ánh xạ của tiến trình đó vẫn còn nguyên trong TLB (**"Warm TLB"**), giúp triệt tiêu chi phí TLB Flush và tránh tình trạng hàng loạt TLB Miss khi quay lại.
</details>

### Câu Hỏi 9: Trên Linux CLI, bạn dùng những lệnh nào để kiểm tra hỗ trợ PCID, phân trang 5 cấp (LA57) và theo dõi TLB Shootdown?

<details>
<summary>Đáp án</summary>

1. **Kiểm tra CPU hỗ trợ PCID**:
   ```bash
   grep -w pcid /proc/cpuinfo | head -n 1
   ```
   Nếu có cờ `pcid`, nhân Linux sẽ tự động kích hoạt `CR4.PCIDE` để tránh TLB Flush khi context switch.
2. **Kiểm tra CPU và Linux Kernel hỗ trợ phân trang 5 cấp (LA57)**:
   ```bash
   grep -w la57 /proc/cpuinfo
   ```
   Cờ `la57` (Linear Address 57-bit) cho phép mở rộng không gian địa chỉ ảo lên 128 PB.
3. **Theo dõi số lượng ngắt TLB Shootdown giữa các CPU Cores**:
   ```bash
   grep -i "tlb" /proc/interrupts
   ```
</details>

### Câu Hỏi 10: Hiện tượng TLB Shootdown là gì và nó gây tác động gì tới hiệu năng hệ thống đa nhân?

<details>
<summary>Đáp án</summary>

**TLB Shootdown** xảy ra khi một luồng trên một CPU core (ví dụ Core 0) thay đổi quyền truy cập hoặc giải phóng một vùng nhớ ảo (chẳng hạn khi gọi `munmap()`). Lúc này, ánh xạ tương ứng trong TLB của các core khác đang chạy cùng tiến trình trở nên không hợp lệ.

Core 0 bắt buộc phải phát một ngắt liên bộ xử lý (**Inter-Processor Interrupt - IPI**) yêu cầu các core khác xóa bỏ dòng TLB đó ngay lập tức. Nếu hiện tượng TLB Shootdown diễn ra quá thường xuyên, hệ thống đa nhân sẽ bị suy giảm hiệu năng nghiêm trọng do tắc nghẽn IPI.
</details>

### Câu Hỏi 11: Tại sao bản vá KPTI chống lỗ hổng Meltdown lại gây suy giảm hiệu năng nặng nề trên các máy chủ dùng CPU Intel đời cũ không có PCID?

<details>
<summary>Đáp án</summary>

Lỗ hổng bảo mật phần cứng **Meltdown** cho phép tiến trình người dùng (Ring 3) đọc trộm bộ nhớ nhân hệ điều hành (Ring 0) thông qua thực thi suy đoán (Speculative Execution). Để ngăn chặn, bản vá **KPTI (Kernel Page Table Isolation)** trên Linux tách rời hoàn toàn bảng trang User Space và bảng trang Kernel Space.

Cứ mỗi lần tiến trình gọi một system call (như `read`, `write`, `getpid`), CPU phải đổi bảng trang và **buộc phải xóa TLB**. Trên các dòng CPU Intel đời cũ không có tính năng **PCID**, việc xóa TLB liên tục sau mỗi system call làm hiệu năng các hệ thống cơ sở dữ liệu và máy chủ web tụt giảm từ **$10\%$ đến $30\%$**; chỉ những CPU có PCID mới duy trì được các ánh xạ TLB tách biệt và giảm thiểu được tổn thất này.
</details>
