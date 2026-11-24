# Review: 1_7_2 Contiguous Allocation and Fragmentation

### Câu Hỏi 1: Cấp phát bộ nhớ liên tục (Contiguous Memory Allocation) là gì và phần cứng cần những thanh ghi nào để kiểm tra ranh giới bộ nhớ?

<details>
<summary>Đáp án</summary>

**Cấp phát bộ nhớ liên tục** là phương thức quản lý bộ nhớ trong đó mỗi tiến trình người dùng khi nạp vào RAM bắt buộc phải chiếm giữ một **vùng nhớ vật lý duy nhất, liền mạch không đứt quãng** từ địa chỉ bắt đầu đến địa chỉ kết thúc. Về mặt phần cứng, giải pháp này chỉ cần một cặp thanh ghi **`Base`** và **`Limit`** để kiểm tra ranh giới bộ nhớ.
</details>

### Câu Hỏi 2: Trong mô hình cấp phát liên tục dạng phân vùng biến đổi (Variable-Partition Allocation), các "lỗ trống" (Holes) xuất hiện như thế nào?

<details>
<summary>Đáp án</summary>

Trong mô hình phân vùng biến đổi, bộ nhớ được chia thành các phân vùng có kích thước vừa khít với yêu cầu của tiến trình. Khi các tiến trình kết thúc và giải phóng bộ nhớ rải rác, những khoảng bộ nhớ tự do gọi là **"lỗ trống" (Holes)** sẽ xuất hiện nằm xen kẽ giữa các tiến trình đang hoạt động.
</details>

### Câu Hỏi 3: Phân mảnh ngoại vi (External Fragmentation) là gì và gây ra hậu quả gì cho hệ thống?

<details>
<summary>Đáp án</summary>

**Phân mảnh ngoại vi** là hiện tượng tổng dung lượng bộ nhớ trống cộng lại thừa đủ cho yêu cầu của một tiến trình mới, nhưng bộ nhớ bị chia cắt thành nhiều khối nhỏ rời rạc nên **không có bất kỳ một lỗ trống đơn lẻ nào đủ lớn và liền mạch** để chứa tiến trình đó. Hệ quả là tiến trình bị từ chối cấp phát dù bộ nhớ RAM vẫn còn nhiều chỗ trống.
</details>

### Câu Hỏi 4: Phân mảnh nội vi (Internal Fragmentation) là gì, xảy ra khi nào và mức tổn thất trung bình trên mỗi yêu cầu cấp phát là bao nhiêu?

<details>
<summary>Đáp án</summary>

**Phân mảnh nội vi** là vùng nhớ bị lãng phí **nằm ngay bên trong** không gian đã được cấp phát cho một tiến trình cụ thể. Nó xảy ra khi hệ thống cấp phát bộ nhớ theo các khối có kích thước cố định (Fixed-size Allocation Units, ví dụ các trang 4KB hoặc khối 512 bytes) và tiến trình yêu cầu ít hơn kích thước khối được cấp, khiến phần dư bên trong bị bỏ phí.

Nếu kích thước khối cấp phát cố định là $B$ và tiến trình yêu cầu dung lượng $S$, tiến trình sẽ được cấp $\lceil S / B \rceil \times B$. Trung bình trên nhiều lần cấp phát, dung lượng bị lãng phí bên trong khối cuối cùng xấp xỉ:
$$\text{Tổn thất trung bình} \approx \frac{1}{2} \times B \quad (\text{nửa khối nhớ trên mỗi yêu cầu})$$
</details>

### Câu Hỏi 5: Ba chiến lược cấp phát lỗ trống First-Fit, Best-Fit và Worst-Fit hoạt động như thế nào và có đặc điểm gì?

<details>
<summary>Đáp án</summary>

1. **First-Fit (Lựa chọn đầu tiên)**: Quét danh sách lỗ trống từ đầu đến cuối và cấp phát **ngay lỗ trống đầu tiên** có kích thước $\ge$ kích thước yêu cầu. Chiến lược này có tốc độ thực thi nhanh nhất ($O(1)$ nếu tìm thấy sớm), nhưng có xu hướng dồn các mảnh vụn nhỏ về phía đầu bộ nhớ.
2. **Best-Fit (Lựa chọn vừa khít nhất)**: Quét duyệt qua **toàn bộ danh sách** lỗ trống và chọn ra lỗ trống **nhỏ nhất mà vẫn đủ lớn** để chứa tiến trình. Dù cố gắng tối thiểu hóa phần dư của lỗ trống được chọn, phần dư còn lại sau khi cắt thường là những mẩu vụn tí hon (Tiny Leftover Holes) không một tiến trình nào khác có thể tận dụng.
3. **Worst-Fit (Lựa chọn lỗ trống lớn nhất)**: Quét duyệt toàn bộ danh sách và chọn **lỗ trống có kích thước lớn nhất**, với hy vọng phần dư còn lại vẫn đủ lớn để cấp cho tiến trình khác. Tuy nhiên trong thực tế, Worst-Fit lại phá nát các khối nhớ lớn quý giá và có hiệu năng thực nghiệm kém nhất trong cả ba.
</details>

### Câu Hỏi 6: Quy tắc 50% của Donald Knuth (The 50-Percent Rule) cho biết điều gì về mức độ lãng phí bộ nhớ do phân mảnh ngoại vi?

<details>
<summary>Đáp án</summary>

Quy tắc 50% của Donald Knuth chứng minh rằng đối với bất kỳ giải thuật cấp phát **First-Fit** nào ở trạng thái cân bằng (Steady State), nếu có $N$ khối nhớ đang được cấp phát cho các tiến trình thì trung bình sẽ có thêm khoảng $0.5 \times N$ lỗ trống phân mảnh. Điều này đồng nghĩa với việc khoảng **một phần ba ($33\%$) tổng dung lượng bộ nhớ khả dụng** của hệ thống có thể bị lãng phí hoàn toàn thành vùng nhớ "chết" không thể sử dụng.
</details>

### Câu Hỏi 7: Kỹ thuật Compaction (Dồn bộ nhớ / Defragmentation) khắc phục phân mảnh ngoại vi theo cơ chế nào?

<details>
<summary>Đáp án</summary>

**Compaction** khắc phục phân mảnh ngoại vi bằng cách di chuyển vị trí của toàn bộ các tiến trình đang chạy dồn sát về một phía của thanh RAM (thường là dồn về gốc địa chỉ thấp), từ đó gom tất cả các lỗ trống phân tán rải rác lại thành **một khối trống liền mạch khổng lồ duy nhất** ở phía trên.
</details>

### Câu Hỏi 8: Điều kiện tiên quyết nào bắt buộc phải có để thực hiện Compaction và vì sao kỹ thuật này có chi phí rất đắt?

<details>
<summary>Đáp án</summary>

- **Điều kiện tiên quyết**: Cơ chế dịch địa chỉ (Address Binding) bắt buộc phải là **Động tại thời gian chạy (Execution-Time Dynamic Binding)** thông qua thanh ghi Relocation (`Base` Register). Khi dịch chuyển tiến trình sang vị trí mới, hệ điều hành chỉ cần cập nhật lại thanh ghi `Base`. Nếu gán địa chỉ lúc biên dịch (Compile-time) hoặc lúc nạp (Load-time), việc dịch chuyển mã lệnh trong RAM sẽ phá hủy toàn bộ con trỏ và làm sụp đổ chương trình.
- **Chi phí đắt đỏ**: Việc sao chép hàng gigabyte dữ liệu của các tiến trình từ vị trí này sang vị trí khác trong RAM ngốn rất nhiều băng thông bộ nhớ và chu kỳ CPU, khiến toàn bộ hệ thống bị đứng hình (Freeze/Latency Spike) trong suốt quá trình dồn dịch.
</details>

### Câu Hỏi 9: Trên Linux hiện đại, bộ cấp phát nào quản lý các khung trang vật lý (Page Frames) và câu lệnh nào dùng để quan sát phân mảnh bộ nhớ vật lý theo thời gian thực?

<details>
<summary>Đáp án</summary>

Nhân Linux sử dụng **Bộ cấp phát Buddy (Buddy Allocator)** để quản lý bộ nhớ vật lý ở cấp độ trang (Page Frame), nhằm đáp ứng các trường hợp hạt nhân vẫn cần khối trang liền mạch ở tầng vật lý (ví dụ cho bộ nhớ DMA của phần cứng mạng). Để theo dõi phân mảnh bộ nhớ vật lý theo thời gian thực, ta sử dụng lệnh:
```bash
cat /proc/buddyinfo
```
</details>

### Câu Hỏi 10: Các cột số liệu trong `/proc/buddyinfo` mang ý nghĩa gì và dấu hiệu nào cho thấy RAM đang bị phân mảnh nặng?

<details>
<summary>Đáp án</summary>

Các cột trong `/proc/buddyinfo` biểu thị số lượng khối trống theo các bậc phân bổ $2^0, 2^1, 2^2, \dots, 2^{10}$ trang vật lý (với 1 trang tiêu chuẩn $= 4\text{ KB}$):
- Cột 1: $2^0 = 1$ trang ($4\text{ KB}$)
- Cột 2: $2^1 = 2$ trang ($8\text{ KB}$)
- Cột 5: $2^4 = 16$ trang ($64\text{ KB}$)
- Cột 11: $2^{10} = 1024$ trang ($4\text{ MB}$)

**Dấu hiệu phân mảnh nặng**: Các cột bậc cao (ví dụ từ bậc 7 trở đi trong `zone Normal`) hiển thị giá trị `0`. Điều này cho thấy dù RAM vẫn còn hàng chục ngàn trang $4\text{ KB}$ đơn lẻ nhưng hạt nhân không còn khối nhớ lớn liền mạch (như $4\text{ MB}$) để cấp phát.
</details>

### Câu Hỏi 11: Kiến trúc Phân trang (Paging) ra đời đã giải quyết triệt để hiện tượng phân mảnh ngoại vi bằng cách nào?

<details>
<summary>Đáp án</summary>

Kiến trúc Phân trang (Paging) thực hiện theo cơ chế:
1. Chia bộ nhớ vật lý thành các khung cố định bằng nhau gọi là **Frames (Khung trang)**.
2. Chia không gian địa chỉ của tiến trình thành các khối có kích thước bằng hệt gọi là **Pages (Trang nhớ)**.
3. Cho phép một tiến trình **không cần nằm liên tục trong bộ nhớ vật lý** (ví dụ Trang 0 nằm ở Frame 100, Trang 1 nằm ở Frame 2).

Nhờ bất kỳ khung trang vật lý trống nào cũng có thể gán cho bất kỳ trang logic nào của tiến trình, hiện tượng **Phân mảnh ngoại vi bị xóa sổ hoàn toàn** khỏi hệ thống.
</details>

### Câu Hỏi 12: Trong môi trường sản xuất (như cụm Redis, MongoDB, PostgreSQL), vì sao tính năng Transparent Huge Pages (THP) có thể gây ra đỉnh nhọn độ trễ (Latency Spikes) và giải pháp khuyến nghị là gì?

<details>
<summary>Đáp án</summary>

Khi bật **Transparent Huge Pages (THP - trang khổng lồ 2MB)**, nhân Linux liên tục phải gom các trang nhỏ $4\text{ KB}$ thành các khối liên tục $2\text{ MB}$. Khi bộ nhớ bị phân mảnh, tiến trình nền **`kcompactd`** sẽ thức dậy và chạy thuật toán Compaction trong kernel space để dồn dịch các trang vật lý. Quá trình này gây nghẽn khóa hạt nhân (Spinlock Contention) và tạo ra các **đỉnh nhọn độ trễ (Latency Spikes)** tăng vọt lên hàng chục giây, làm cơ sở dữ liệu bị "đơ" tạm thời và gây timeout hàng loạt kết nối microservices.

**Khuyến nghị sản xuất**: Tắt Transparent Huge Pages trên các máy chủ cơ sở dữ liệu đòi hỏi độ trễ thấp bằng lệnh:
```bash
echo never > /sys/kernel/mm/transparent_hugepage/enabled
```
</details>
