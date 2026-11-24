# Review: 1_1_4 Kernel Architectures Monolithic Microkernel Hybrid

### Câu Hỏi 1: Bài toán thiết kế cơ bản nhất của một hệ điều hành là gì, và việc giải quyết bài toán đó đã hình thành nên ba trường phái kiến trúc nhân nào?

<details>
<summary>Đáp án</summary>

Bài toán kiến trúc cơ bản nhất của hệ điều hành là quyết định: **những dịch vụ nào nên đặt bên trong không gian đặc quyền của Kernel (Ring 0) và những dịch vụ nào nên đẩy ra ngoài không gian người dùng (Ring 3)**.

Từ việc phân định ranh giới này đã hình thành ba trường phái kiến trúc nhân kinh điển:
1. **Monolithic Kernel** (Nhân nguyên khối — điển hình: Linux).
2. **Microkernel** (Vi nhân — điển hình: seL4, Mach, Minix 3).
3. **Hybrid Kernel** (Nhân lai — điển hình: Windows NT).
</details>

### Câu Hỏi 2: Trong kiến trúc Monolithic Kernel (như Linux), các dịch vụ cốt lõi của hệ điều hành được tổ chức và vận hành ở đâu?

<details>
<summary>Đáp án</summary>

Trong kiến trúc Monolithic Kernel, **tất cả các dịch vụ cốt lõi của hệ điều hành**—bao gồm Quản lý bộ nhớ ảo, Lập lịch tiến trình (Process Scheduler), Hệ thống tệp ảo (Virtual File System - VFS), Ngăn xếp mạng (Network Stack), Giao tiếp liên tiến trình (IPC) và toàn bộ Trình điều khiển thiết bị (Device Drivers)—đều cùng vận hành trong **một không gian địa chỉ ảo duy nhất tại Kernel Mode (Ring 0)**.
</details>

### Câu Hỏi 3: Vì sao Monolithic Kernel đạt được hiệu năng thực thi cực đại, và nhược điểm "Vùng ảnh hưởng lỗi duy nhất" (Single Failure Domain) của nó là gì?

<details>
<summary>Đáp án</summary>

- **Hiệu năng thực thi cực đại**: Do toàn bộ các thành phần nằm chung trong một không gian địa chỉ của nhân, việc trao đổi dữ liệu giữa hệ thống tệp, bộ lập lịch và driver được thực hiện qua **các lời gọi hàm trực tiếp trong bộ nhớ (in-memory function calls)**, không tốn chi phí chuyển đổi ngữ cảnh (context switch) hay chuyển đổi mức đặc quyền phần cứng giữa các thành phần nội bộ.
- **Single Failure Domain**: Do tất cả mã chạy trong Kernel Mode dùng chung một không gian địa chỉ ảo duy nhất nên các kernel driver không được cô lập với nhau hay với hệ điều hành. Nếu một driver gặp lỗi ghi đè sai địa chỉ bộ nhớ ảo, nó có thể phá hủy dữ liệu của kernel hoặc driver khác, khiến toàn bộ hệ điều hành sụp đổ ngay lập tức (**Kernel Panic** trên Linux hoặc **BSOD** trên Windows).
</details>

### Câu Hỏi 4: Cơ chế Loadable Kernel Modules (LKM) trong Linux giải quyết nhược điểm nào của Monolithic Kernel, được nạp qua lời gọi hệ thống nào và thực thi ở mức đặc quyền nào?

<details>
<summary>Đáp án</summary>

- **Nhược điểm được giải quyết**: LKM (các tệp định dạng `.ko`) giải quyết nhược điểm phải biên dịch lại toàn bộ nhân hoặc khởi động lại máy tính mỗi khi cần bổ sung driver phần cứng, hệ thống tệp hoặc packet filter mới, bằng cách cho phép nạp động hoặc gỡ bỏ mã trực tiếp vào kernel đang chạy.
- **Cách nạp**: Thực hiện qua các lời gọi hệ thống `init_module(2)` hoặc `finit_module(2)`.
- **Mức đặc quyền**: Sau khi nạp, mã của module gắn trực tiếp vào không gian địa chỉ nhân và chạy với toàn quyền đặc quyền **Ring 0 (Kernel Mode)** y hệt như mã nhân gốc.
</details>

### Câu Hỏi 5: Các công cụ `lsmod`, `/proc/modules` và `modinfo` trên Linux cung cấp những thông tin kỹ thuật quan trọng nào về Loadable Kernel Modules (LKM)?

<details>
<summary>Đáp án</summary>

- **`lsmod`**: Đọc từ `/proc/modules` để hiển thị danh sách các module đang nạp với 3 cột: `Module` (tên module), `Size` (kích thước RAM chiếm dụng tính theo byte trong kernel space) và `Used by` (số lượng thành phần phụ thuộc cùng tên các module liên quan).
- **`/proc/modules`**: Cho biết trạng thái module (ví dụ `Live` là đang hoạt động bình thường) và địa chỉ hex ở cuối dòng (ví dụ `0xffffffffc0920000`), đây là **địa chỉ bộ nhớ ảo thực tế trong không gian địa chỉ 64-bit của Kernel Mode (Ring 0)** nơi module được nạp vào.
- **`modinfo`**: Trích xuất siêu dữ liệu từ tệp `.ko`, nổi bật gồm:
  - `filename`: Đường dẫn tệp module nhị phân trên đĩa.
  - `license`: Giấy phép mã nguồn (nếu nạp module có license không tương thích như `"Proprietary"`, kernel sẽ bị đánh dấu là `"tainted"`).
  - `retpoline: Y`: Xác nhận module được biên dịch với kỹ thuật phòng vệ chống tấn công đầu cơ nhánh Spectre V2.
  - `vermagic`: Chuỗi phiên bản kiểm tra tính tương thích nghiêm ngặt; nếu không khớp với kernel đang chạy, lệnh nạp sẽ bị từ chối để tránh làm sập nhân.
</details>

### Câu Hỏi 6: Trong kiến trúc Microkernel (như seL4, Minix 3), chỉ những cơ chế tối thiểu nào được giữ lại trong Ring 0, và các dịch vụ hệ điều hành truyền thống khác chạy ở đâu?

<details>
<summary>Đáp án</summary>

- **Trong Kernel Mode (Ring 0)**, Microkernel chỉ giữ lại 3 cơ chế nguyên thủy tối thiểu (minimal primitives):
  1. Giao tiếp liên tiến trình (**IPC - Inter-Process Communication**).
  2. Lập lịch tiến trình mức cơ bản (Basic Scheduling).
  3. Quản lý ánh xạ không gian địa chỉ và bộ nhớ ảo cấp thấp.
- **Trong User Space (Ring 3)**: Tất cả các dịch vụ truyền thống khác—như File Systems, Network Stack, Device Drivers và trình quản lý tiến trình cấp cao—đều được tách ra ngoài để chạy dưới dạng các tiến trình máy chủ độc lập (**Isolated User-Space Servers**).
</details>

### Câu Hỏi 7: Vì sao Microkernel có khả năng cô lập lỗi vượt trội, và nguyên nhân nào làm giảm hiệu năng I/O của kiến trúc này so với Monolithic Kernel?

<details>
<summary>Đáp án</summary>

- **Khả năng cô lập lỗi vượt trội**: Vì Device Drivers và Network Stack chạy trong các không gian địa chỉ ảo tách biệt ở Ring 3, nếu một driver (như driver card mạng) bị crash do lỗi con trỏ hoặc tràn bộ đệm, **nhân microkernel và các thành phần khác hoàn toàn không bị ảnh hưởng**. Hệ thống chỉ cần khởi động lại tiến trình server bị lỗi trong vài mili-giây mà không phải reboot toàn máy. Ngoài ra, **seL4** còn được kiểm chứng toán học hình thức (formally verified) chứng minh không có lỗi tràn bộ đệm hay rò rỉ quyền hạn.
- **Nguyên nhân suy giảm hiệu năng (IPC Overhead)**: Các thành phần phải giao tiếp thông qua cơ chế truyền thông điệp đồng bộ (synchronous message passing) qua các đối tượng kernel gọi là **endpoints**. Một thao tác đọc đĩa cần nhiều lượt chuyển ngữ cảnh qua lại giữa ứng dụng, kernel, File Server và Disk Driver Server, kéo theo chi phí lưu/khôi phục thanh ghi CPU, chuyển đổi bảng phân trang MMU và xả bộ nhớ đệm (**TLB/Cache misses**).
</details>

### Câu Hỏi 8: Kiến trúc Hybrid Kernel (điển hình là Windows NT) kết hợp những đặc tính nào của Microkernel và Monolithic Kernel?

<details>
<summary>Đáp án</summary>

Windows NT kết hợp cả hai mô hình nhằm cân bằng giữa tính module hóa và tốc độ thực thi:
1. **Đặc tính Microkernel**: Tổ chức tài nguyên hệ thống (tệp tin, thiết bị, khóa Registry, tiến trình, luồng, cơ chế đồng bộ) thành các **Objects** được quản lý thống nhất bởi **Object Manager**, đồng thời hỗ trợ mô hình Client/Server qua cơ chế gọi thủ tục cục bộ nâng cao (**ALPC - Advanced Local Procedure Call**).
2. **Đặc tính Monolithic**: Để loại bỏ suy giảm hiệu năng do IPC giữa User Mode và Kernel Mode, toàn bộ **Executive Subsystems, Microkernel, HAL (`hal.dll`), Device Drivers và hệ thống đồ họa giao diện người dùng (`win32k.sys`)** đều chạy chung trong một không gian địa chỉ **Kernel Mode (Ring 0)**.
</details>

### Câu Hỏi 9: Trong phân cấp kiến trúc của Windows NT, các thành phần chính ở User Mode (Ring 3) và Kernel Mode (Ring 0) đảm nhiệm vai trò gì?

<details>
<summary>Đáp án</summary>

- **User Mode (Ring 3)**:
  - **System Processes**: Các tiến trình hệ thống nền tảng bắt buộc như `smss.exe` (Session Manager), `csrss.exe` (Client/Server Runtime Subsystem), `lsass.exe` (Local Security Authority Subsystem) và `services.exe` (Service Control Manager).
  - **Subsystem DLLs & User Apps**: Các thư viện API người dùng (`kernel32.dll`, `user32.dll`, `gdi32.dll`) chuyển tiếp yêu cầu từ ứng dụng xuống kernel.
- **Kernel Mode (Ring 0)**:
  - **Executive**: Chứa các hệ thống con quản lý cấp cao như Object Manager, Virtual Memory Manager, Process & Thread Manager, I/O Manager.
  - **Kernel (Microkernel)**: Đảm nhiệm lập lịch luồng cấp thấp, đồng bộ hóa đa xử lý (spinlocks) và phân phối ngắt.
  - **HAL (`hal.dll`)**: Lớp trừu tượng phần cứng cách ly kernel khỏi sự khác biệt của bo mạch chủ, chipset và bộ điều khiển ngắt APIC.
  - **Windowing and Graphics System (`win32k.sys`)**: Đảm nhiệm toàn bộ việc dựng hình GUI, quản lý cửa sổ và hiển thị.
</details>

### Câu Hỏi 10: Bước ngoặt lịch sử trên Windows NT 4.0 liên quan đến phân hệ đồ họa `win32k.sys` là gì và vì sao Microsoft quyết định thực hiện thay đổi này?

<details>
<summary>Đáp án</summary>

- **Bối cảnh trước NT 4.0**: Trong Windows NT 3.1 đến NT 3.51, hệ thống đồ họa và giao diện người dùng (GDI / USER) chạy ở User Mode trong một tiến trình riêng theo đúng chuẩn microkernel. Mọi thao tác như di chuyển chuột, vẽ nút bấm hay kéo thanh cuộn đều phát sinh hàng loạt thông điệp IPC (LPC) và chuyển đổi ngữ cảnh, khiến giao diện của NT 3.51 rất chậm chạp và giật lag so với Windows 95.
- **Bước ngoặt ở NT 4.0**: Microsoft chuyển toàn bộ phân hệ đồ họa **`win32k.sys` từ User Mode vào chạy trực tiếp trong Kernel Mode (Ring 0)** để đạt tốc độ đồ họa vượt bậc—đánh dấu sự xác lập dứt khoát của mô hình **Hybrid Kernel** (chấp nhận đánh đổi một phần ranh giới an toàn tuyệt đối để đổi lấy hiệu năng thực tế).
</details>

### Câu Hỏi 11: Trong thực tế sản xuất, vì sao Linux (Monolithic) vẫn thống trị hạ tầng Cloud & DevOps trong khi Microkernel lại là lựa chọn ưu tiên cho các hệ thống an toàn sinh mạng (Safety-Critical)?

<details>
<summary>Đáp án</summary>

- **Linux Monolithic thống trị Cloud & DevOps**: Trong hạ tầng Hyper-Scale Cloud (AWS EC2, Google Cloud, Azure VMs, Kubernetes), **thông lượng (throughput) và độ trễ (latency)** là yếu tố sống còn, nên chi phí chuyển đổi ngữ cảnh IPC của Microkernel không phù hợp cho I/O đĩa và mạng quy mô lớn. Linux giữ hiệu năng Monolithic ở Ring 0 và bổ sung rào chắn an toàn bằng:
  - **cgroups và namespaces** để cô lập ứng dụng (nền tảng của Docker và Kubernetes Containers).
  - **eBPF (Extended Berkeley Packet Filter)** cho phép chạy mã tùy biến an toàn bên trong nhân mà không cần nạp kernel module, nhờ được **eBPF Verifier** kiểm tra an toàn tĩnh trước khi chạy để đảm bảo không làm crash kernel.
- **Microkernel thống trị hệ thống Safety-Critical / Mission-Critical**: Trong xe tự hành (dùng **QNX Neutrino** hoặc **seL4** theo chuẩn **ISO 26262 ASIL-D**), hàng không và y tế, an toàn sinh mạng quan trọng hơn thông lượng thô. Nếu một driver cảm biến LiDAR hoặc camera bị crash, microkernel khởi động lại driver đó trong vài mili-giây mà hệ thống phanh/lái không bị tê liệt; đồng thời khả năng **Formal Verification** của seL4 giúp chứng minh toán học không có lỗi.
</details>
