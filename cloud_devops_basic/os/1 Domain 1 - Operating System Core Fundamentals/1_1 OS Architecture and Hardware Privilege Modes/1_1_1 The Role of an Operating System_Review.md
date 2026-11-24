# Review: 1_1_1 The Role of an Operating System

### Câu Hỏi 1: Hệ điều hành (Operating System - OS) là gì?

<details>
<summary>Đáp án</summary>

Hệ điều hành (OS) là lớp phần mềm hệ thống cơ bản nhất, nằm giữa **phần cứng vật lý** (CPU, RAM, thiết bị lưu trữ, I/O) và **các chương trình ứng dụng người dùng**.
</details>

### Câu Hỏi 2: Theo giáo trình *Operating Systems: Three Easy Pieces (OSTEP)*, ba trụ cột nền tảng của hệ điều hành là gì?

<details>
<summary>Đáp án</summary>

Hệ điều hành có 3 trụ cột chính:
- Ảo hoá: Chuyển đổi các tài nguyên vật lý như CPU, RAM, memory thành các tài nguyên ảo cho chương trình dễ dàng xử dụng, khiến cho mỗi chương trình có ảo tưởng rằng mình sở hữu hoàn toàn phần tài nguyên ấy thay vì phải tìm cách dùng chung phần chia sẻ
- Đồng thời: Xử lý đồng thời nhiều tác vụ, giải quyết bài toán tranh giành tài nguyên giữa các tiến trình trên hệ điều hành thông qua các cơ chế như lập lịch, đồng bộ hoá giữa các thread & tiến trình, quản lý truy cập dữ liệu dùng chung.
- Lưu trữ bền vững: Mọi dữ liệu an toàn đều lưu dưới ổ đĩa, không mất đi khi mất điện hoặc khởi động lại
</details>

### Câu Hỏi 3: Trong trụ cột Ảo hóa (Virtualization), hệ điều hành tạo ra những tài nguyên ảo nào từ phần cứng vật lý?

<details>
<summary>Đáp án</summary>

Hệ điều hành chuyển đổi CPU, RAM và ổ đĩa vật lý thành các dạng tài nguyên ảo. Nhờ đó, mỗi chương trình hoạt động như thể nó đang độc quyền sở hữu:
- Một **CPU riêng** (thông qua tiến trình và bộ lập lịch).
- Một **không gian địa chỉ bộ nhớ riêng biệt khổng lồ** (thông qua bộ nhớ ảo).
</details>

### Câu Hỏi 4: Trụ cột Xử lý đồng thời (Concurrency) giúp hệ điều hành giải quyết những bài toán kỹ thuật nào?

<details>
<summary>Đáp án</summary>

Khi hệ thống phải xử lý nhiều luồng công việc cùng lúc (trong cùng một chương trình hoặc trên toàn bộ hệ thống), trụ cột Xử lý đồng thời giúp hệ điều hành giải quyết các bài toán tương tranh gồm:
- Lập lịch thực thi.
- Đồng bộ hóa giữa các luồng và tiến trình.
- Quản lý truy cập dữ liệu dùng chung để đảm bảo tính nhất quán của hệ thống.
</details>

### Câu Hỏi 5: Vì sao hệ điều hành cần trụ cột Lưu trữ bền vững (Persistence) bên cạnh bộ nhớ chính DRAM, và nó sử dụng cơ chế nào để thực hiện?

<details>
<summary>Đáp án</summary>

Các bộ nhớ chính như DRAM là bộ nhớ khả biến (**volatile**), nghĩa là dữ liệu sẽ biến mất ngay khi mất nguồn điện. Để lưu giữ dữ liệu an toàn lâu dài và có thể truy xuất lại sau mỗi lần tái khởi động, hệ điều hành cung cấp **hệ thống tệp (filesystem)** để quản lý các thiết bị lưu trữ không khả biến (**non-volatile storage devices** như SSD, HDD).
</details>

### Câu Hỏi 6: Với vai trò là Bộ quản trị tài nguyên (Resource Manager), hệ điều hành đảm nhận những quyết định điều phối nào?

<details>
<summary>Đáp án</summary>

Do nhiều chương trình cùng chạy đồng thời và chia sẻ CPU, RAM, ổ đĩa cũng như thiết bị ngoại vi, hệ điều hành đóng vai trò cơ quan quản lý và điều phối để quyết định:
- Tiến trình nào được cấp phát bao nhiêu CPU.
- Dung lượng bộ nhớ nào được cấp cho ứng dụng nào.
- Điều phối quyền truy cập thiết bị I/O một cách hiệu quả và công bằng.
</details>

### Câu Hỏi 7: Lớp trừu tượng hóa phần cứng (Hardware Abstraction Layer) và lời gọi hệ thống (system calls - syscalls) giải quyết khó khăn gì cho lập trình viên và ứng dụng?

<details>
<summary>Đáp án</summary>

Nếu không có OS, lập trình viên sẽ phải tự viết mã thao tác trực tiếp với từng thanh ghi, cổng I/O hay giao thức điều khiển chi tiết của từng dòng phần cứng khác nhau. Hệ điều hành che giấu hoàn toàn sự phức tạp ở tầng vật lý và cung cấp giao diện máy ảo (**virtual machine interface**) thông qua các **lời gọi hệ thống (syscalls)**, giúp ứng dụng chỉ cần gọi các hàm trừu tượng tiêu chuẩn (như đọc/ghi tệp, cấp phát bộ nhớ) mà không cần quan tâm đến loại phần cứng bên dưới.
</details>

### Câu Hỏi 8: Nguyên lý Cô lập (Isolation) và Bảo vệ (Protection) hoạt động như thế nào, và điều gì xảy ra nếu một tiến trình ứng dụng bị lỗi nghiêm trọng (crash)?

<details>
<summary>Đáp án</summary>

- **Cách hoạt động**: Hệ điều hành cô lập các tiến trình hoàn toàn độc lập với nhau; mỗi tiến trình chạy trong một không gian địa chỉ riêng biệt và không thể trực tiếp đọc, ghi đè dữ liệu của tiến trình khác hay can thiệp vào bộ nhớ của Kernel. Ranh giới bảo vệ này được thiết lập nhờ sự hỗ trợ của phần cứng (chế độ đặc quyền CPU).
- **Khi một tiến trình bị crash**: Chỉ tiến trình gặp lỗi đó bị kết thúc/ảnh hưởng, không thể kéo sập toàn bộ cỗ máy vật lý hay làm ảnh hưởng tới các ứng dụng khác đang chạy song song.
</details>

### Câu Hỏi 9: Trong phần thực hành trên Linux, lệnh `uname -srm` dùng để kiểm tra những thông tin gì?

<details>
<summary>Đáp án</summary>

Lệnh `uname` đọc dữ liệu hệ thống do kernel cung cấp. Khi kết hợp các cờ `-srm`:
- `-s`: In tên hệ điều hành (ví dụ: `Linux`).
- `-r` (`--kernel-release`): In phiên bản phát hành của Linux Kernel đang chạy (ví dụ: `6.8.0-49-generic`).
- `-m` (`--machine`): In tên kiến trúc phần cứng của máy (ví dụ: `x86_64`).
</details>

### Câu Hỏi 10: Tập tin ảo `/proc/version` trên Linux thuộc hệ thống tệp nào và cung cấp thông tin gì?

<details>
<summary>Đáp án</summary>

Tập tin `/proc/version` nằm trong `/proc` — một **hệ thống tệp ảo trong bộ nhớ (virtual pseudo-filesystem / virtual procfs)** cho phép không gian người dùng nhìn vào cấu trúc nội tại của Kernel. Tập tin này định danh cụ thể chuỗi phiên bản Linux Kernel đang chạy, bao gồm cả phiên bản trình biên dịch GCC đã dùng để build kernel.
</details>

### Câu Hỏi 11: Tiện ích `lscpu` thu thập dữ liệu từ đâu và hiển thị những thông tin nào thể hiện khả năng trừu tượng hóa phần cứng của OS?

<details>
<summary>Đáp án</summary>

`lscpu` thu thập thông tin kiến trúc CPU từ hệ thống tệp ảo **`sysfs`** và **`/proc/cpuinfo`**. Nó hiển thị các thông tin như kiến trúc (`Architecture`), chế độ hoạt động CPU (`CPU op-mode(s)` như 32-bit, 64-bit), tên mô hình vi xử lý (`Model name`) và công nghệ hỗ trợ ảo hóa phần cứng (`Virtualization`, ví dụ `VT-x`).
</details>

### Câu Hỏi 12: Trong môi trường sản xuất (production), hiệu ứng "Hàng xóm ồn ào" (Noisy Neighbor) có thể dẫn đến cơ chế gì của Kernel, và cần cấu hình gì để phòng tránh?

<details>
<summary>Đáp án</summary>

- **Cơ chế bị kích hoạt**: Khi một tiến trình gặp lỗi rò rỉ bộ nhớ (memory leak) hoặc vòng lặp vô tận làm cạn kiệt RAM vật lý của máy, Kernel buộc phải kích hoạt **Out-Of-Memory Killer (OOM Killer)** để tiêu diệt tiến trình nhằm cứu vãn hệ thống (và đôi khi có thể tiêu diệt nhầm ứng dụng nghiệp vụ quan trọng khác cùng chia sẻ máy chủ).
- **Cách phòng tránh**: Cấu hình giới hạn tài nguyên phân cấp, chẳng hạn như **Linux cgroups** trong container.
</details>

### Câu Hỏi 13: Điều gì xảy ra khi một ứng dụng trong User Space cố gắng truy cập trực tiếp vùng nhớ ngoài không gian địa chỉ được cấp phát?

<details>
<summary>Đáp án</summary>

Phần cứng và OS sẽ chặn đứng hành vi này để duy trì nguyên tắc cô lập: CPU sẽ kích hoạt ngoại lệ (**General Protection Fault / Page Fault**) và hệ điều hành sẽ phát tín hiệu kết thúc tiến trình ngay lập tức (**`SIGSEGV` - Segmentation Fault**).
</details>

### Câu Hỏi 14: Vì sao việc hệ điều hành dùng bộ đệm trong RAM (Page Cache/Buffer) lại tiềm ẩn rủi ro mất dữ liệu khi mất điện đột ngột, và các cơ sở dữ liệu dùng lời gọi nào để khắc phục?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân rủi ro**: Để tối ưu hiệu năng I/O, hệ điều hành thường lưu dữ liệu ghi vào bộ đệm trong RAM (**Page Cache/Buffer**) trước khi xả định kỳ xuống ổ đĩa không khả biến. Nếu máy chủ vật lý mất điện đột ngột trước khi dữ liệu kịp xả xuống đĩa, dữ liệu trong RAM khả biến sẽ bị mất, gây lỗi tính nhất quán.
- **Cách khắc phục**: Các dịch vụ cơ sở dữ liệu quan trọng chủ động sử dụng các lời gọi đồng bộ dữ liệu như **`fsync()`** hoặc **`fdatasync()`** để yêu cầu OS xả ngay lập tức dữ liệu xuống đĩa trước khi báo hoàn tất giao dịch.
</details>
