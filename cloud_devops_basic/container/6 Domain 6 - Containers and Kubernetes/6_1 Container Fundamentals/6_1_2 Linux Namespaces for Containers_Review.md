# Ôn Tập: 6_1_2 Linux Namespaces for Containers

### Câu Hỏi 1: Theo `namespaces(7)`, Linux namespace là gì? Namespace khác gì với cgroups và máy ảo (VM)?

<details>
<summary>Đáp án</summary>

- **Định nghĩa**: Một namespace bao một tài nguyên toàn cục trong một lớp trừu tượng, làm cho các process bên trong namespace thấy như chúng có một bản cô lập riêng của tài nguyên đó. Container thực chất là process được đặt vào một bộ namespace riêng.
- **So với cgroups**: Namespace quyết định process **"nhìn thấy gì"** (tính cô lập), còn cgroups quyết định process **"được dùng bao nhiêu"** tài nguyên (giới hạn CPU, RAM...).
- **So với máy ảo (VM)**: Tất cả các namespace vẫn dùng **chung một Linux kernel** trên máy chủ (host), không chạy kernel riêng như máy ảo.
</details>

### Câu Hỏi 2: Linux hiện có bao nhiêu loại namespace? Hãy liệt kê tên từng loại, cờ `CLONE_NEW*` tương ứng, tài nguyên được cô lập và lý do vì sao một số tài liệu cũ chỉ ghi 7 loại.

<details>
<summary>Đáp án</summary>

Linux hiện có **8 loại namespace**:

| Namespace | Cờ `CLONE_NEW*` | Tài nguyên được cô lập |
| :--- | :--- | :--- |
| `cgroup` | `CLONE_NEWCGROUP` | Cgroup root directory |
| `ipc` | `CLONE_NEWIPC` | System V IPC, POSIX message queues |
| `net` | `CLONE_NEWNET` | Network devices, stacks, ports, v.v. |
| `mnt` | `CLONE_NEWNS` | Mount points |
| `pid` | `CLONE_NEWPID` | Process IDs |
| `time` | `CLONE_NEWTIME` | Boot và monotonic clocks |
| `user` | `CLONE_NEWUSER` | User và group IDs |
| `uts` | `CLONE_NEWUTS` | Hostname và NIS domain name |

*(Lưu ý: loại `mnt` dùng cờ `CLONE_NEWNS`, không phải `CLONE_NEWMNT`.)*

**Lý do tài liệu cũ chỉ ghi 7 loại**: Namespace `time` chỉ mới có handle `/proc/pid/ns/time` từ **Linux 5.6**, nên các tài liệu viết trước thời điểm này chỉ liệt kê 7 loại.
</details>

### Câu Hỏi 3: Trong một PID namespace mới, process đầu tiên có vai trò gì? Điều gì xảy ra với process mồ côi (orphan) và toàn bộ namespace nếu process đầu tiên này kết thúc?

<details>
<summary>Đáp án</summary>

- **Vai trò**: Process đầu tiên được tạo trong PID namespace mới mang **PID 1** và đóng vai trò là process **init** của namespace đó.
- **Với process mồ côi (orphan)**: Process mồ côi sẽ được **gán lại cho init** của PID namespace chứa cha nó.
- **Khi PID 1 (init) kết thúc**: Kernel sẽ **giết mọi process còn lại** trong PID namespace đó bằng tín hiệu `SIGKILL`. Đây là lý do trong container, khi process chính (PID 1) chết thì toàn bộ container cũng chết theo.
</details>

### Câu Hỏi 4: Nêu ba quy tắc cơ bản về thiết bị mạng, cặp `veth` và vòng đời tài nguyên trong Network Namespace.

<details>
<summary>Đáp án</summary>

1. Một thiết bị mạng vật lý chỉ có thể thuộc về **đúng một** network namespace tại một thời điểm.
2. Cặp `veth` đóng vai trò như "đường ống" dùng để kết nối các network namespace với nhau (cơ sở để container runtime nối container ra mạng).
3. Khi một network namespace bị giải phóng, các thiết bị `veth` nằm bên trong nó sẽ bị hủy.
</details>

### Câu Hỏi 5: Làm thế nào để quan sát các namespace của một process từ bên ngoài và kiểm tra chắc chắn hai process có dùng chung một namespace hay không?

<details>
<summary>Đáp án</summary>

- Mỗi process đều có thư mục `/proc/pid/ns/`, bên trong chứa một mục cho mỗi loại namespace hỗ trợ `setns(2)` (ví dụ với shell hiện tại có thể chạy `ls -l /proc/$$/ns`).
- Mỗi mục là một symlink có nội dung dạng `"loại:[inode]"`, ví dụ `uts:[4026531838]`.
- Để kiểm tra chắc chắn hai process có dùng chung một namespace (chẳng hạn container có dùng chung `net` namespace với PID 1 của host không), ta **so sánh số inode** trong `/proc/pid/ns/<loại>` chứ không dựa vào tên: hai process có cùng inode là đang ở cùng một namespace.
</details>

### Câu Hỏi 6: Phân biệt mục đích sử dụng của 3 công cụ dòng lệnh trong `util-linux`: `lsns`, `unshare` và `nsenter`.

<details>
<summary>Đáp án</summary>

- **`lsns`**: Liệt kê các namespace đang truy cập được trên hệ thống (có thể lọc theo loại bằng `-t`, hỗ trợ 8 loại: `mnt`, `net`, `ipc`, `user`, `pid`, `uts`, `cgroup`, `time`).
- **`unshare`**: Chạy một chương trình trong namespace **mới** được tạo ra (dùng để tự dựng thử không gian cô lập / container thô).
- **`nsenter`**: Chạy một chương trình trong namespace **đã tồn tại** của một process khác (dùng để đi vào kiểm tra bên trong một container đang chạy).
</details>

### Câu Hỏi 7: So sánh cơ chế hoạt động của 3 Linux syscall làm việc với namespace: `clone(2)`, `unshare(2)` và `setns(2)`.

<details>
<summary>Đáp án</summary>

- **`clone(2)`**: Tạo một process mới; khi truyền các cờ `CLONE_NEW*`, kernel tạo namespace mới cho từng cờ và chỉ **process con** trở thành thành viên của các namespace mới đó (process cha giữ nguyên namespace cũ).
- **`unshare(2)`**: Không tạo process mới mà chuyển **chính process gọi** sang namespace mới (tùy loại, xem thêm ngoại lệ của `CLONE_NEWTIME`).
- **`setns(2)`**: Cho **chính process gọi** gia nhập một namespace **đã có**. Hàm này nhận một file descriptor mở từ `/proc/<pid>/ns/<loại>` và đối số thứ hai (`nstype`, như `CLONE_NEWUSER`, `CLONE_NEWUTS`) để chỉ rõ loại namespace mong đợi.
</details>

### Câu Hỏi 8: Để tạo namespace bằng `clone(2)` hoặc `unshare(2)` cần quyền gì? Trường hợp nào là ngoại lệ?

<details>
<summary>Đáp án</summary>

- Trong hầu hết trường hợp, tạo namespace bằng `clone(2)` hoặc `unshare(2)` yêu cầu capability **`CAP_SYS_ADMIN`** (thường tương ứng chạy với quyền `root` / `sudo`).
- **Ngoại lệ là User Namespace (`CLONE_NEWUSER`)**: Từ **Linux 3.8**, việc tạo user namespace **không cần đặc quyền**. Nhờ đó, một user thường có thể tạo user namespace mới (kèm theo các namespace khác như UTS, PID, time bên trong nó) mà không cần `sudo`.
</details>

### Câu Hỏi 9: Khi một process không có quyền `root` dùng `setns(2)` để gia nhập đồng thời User namespace và UTS namespace của một process đích (do chính user đó tạo), vì sao phải gọi `setns` vào `user` namespace trước rồi mới vào `uts` namespace?

<details>
<summary>Đáp án</summary>

Việc này dựa trên 3 quy tắc quyền hạn của `setns(2)`:
1. Process cha có cùng effective UID với chủ sở hữu (owner) của user namespace con thì có mọi capability bên trong user namespace đó.
2. Gia nhập một **user namespace** chỉ cần `CAP_SYS_ADMIN` **trong user namespace đích**.
3. Gia nhập một **UTS namespace** cần `CAP_SYS_ADMIN` cả trong user namespace của chính mình **và** trong user namespace sở hữu UTS namespace đích.

Vì vậy, process phải gia nhập `user` namespace đích trước để đạt đủ quyền (`CAP_SYS_ADMIN` bên trong user namespace đó), sau đó mới đủ điều kiện gia nhập `uts` namespace thuộc quyền sở hữu của nó.
</details>

### Câu Hỏi 10: Cơ chế ánh xạ UID/GID trong User Namespace hoạt động như thế nào và nó là nền tảng cho khái niệm container nào?

<details>
<summary>Đáp án</summary>

- Khi một user namespace mới được tạo, nó **chưa có ánh xạ** UID/GID nào tới user namespace cha.
- Thông tin ánh xạ được lưu trong hai file `/proc/pid/uid_map` và `/proc/pid/gid_map`. Mỗi dòng trong các file này định nghĩa một ánh xạ 1-1 cho một **dải** ID liên tiếp giữa hai user namespace.
- **Ý nghĩa**: Một process bên trong container có thể là **UID 0 (`root`)**, nhưng nhìn từ bên ngoài host nó chỉ là một **UID thường** (ví dụ `1000`), tùy theo bảng ánh xạ. Đây chính là nền tảng cho container **rootless**.
</details>

### Câu Hỏi 11: Time Namespace ảo hóa những đồng hồ nào? Nó có đổi được ngày giờ thực (wall-clock) của container không? Hành vi của `unshare(2)` với `CLONE_NEWTIME` có gì đặc biệt?

<details>
<summary>Đáp án</summary>

- **Hai đồng hồ được ảo hóa**: `CLOCK_MONOTONIC` và `CLOCK_BOOTTIME`. Mỗi time namespace có một giá trị độ lệch (**offset**) so với time namespace khởi tạo, có thể xem tại `/proc/pid/timens_offsets`.
- **Đổi ngày giờ thực**: **Không**, vì đồng hồ thời gian thực (wall-clock) không nằm trong danh sách hai đồng hồ được time namespace ảo hóa.
- **Hành vi đặc biệt của `unshare(2)` với `CLONE_NEWTIME`**: Khác với các namespace khác, `unshare(2)` với `CLONE_NEWTIME` **không** đưa chính process gọi vào time namespace mới, mà chỉ các **process con được tạo sau đó** mới đi vào namespace này. Do đó, handle tương ứng là `/proc/pid/ns/time_for_children`.
</details>

### Câu Hỏi 12: Giải thích ý nghĩa các tùy chọn trong lệnh `sudo unshare -p -f -u -n bash`, và nêu cạm bẫy thường gặp nếu quên tùy chọn `-f` (`--fork`).

<details>
<summary>Đáp án</summary>

- Ý nghĩa các cờ:
  - `-p`: Tạo một **PID namespace** mới.
  - `-f` (`--fork`): Fork tiến trình trước khi chạy lệnh, tức chạy `bash` như tiến trình con của `unshare`.
  - `-u`: Tạo một **UTS namespace** mới (cho phép đổi hostname mà không ảnh hưởng host).
  - `-n`: Tạo một **network namespace** mới.
- **Cạm bẫy khi quên `-f`**: Khi tạo PID namespace mới mà không có `-f`, lệnh có thể bị lỗi hoặc process không nằm trong PID namespace như mong đợi. Đặc biệt theo tài liệu, việc tạo một PID namespace **bền vững (persistent)** sẽ **lỗi** nếu không chỉ định `--fork`. Vì vậy cần luôn dùng `-f` đi kèm `-p`.
</details>

### Câu Hỏi 13: Trong lệnh `unshare -r -p -f --mount-proc bash -c 'echo PID=$$; ps -e'`, hai cờ `-r` và `--mount-proc` có tác dụng gì?

<details>
<summary>Đáp án</summary>

- **`-r` (`--map-root-user`)**: Tự động ánh xạ user hiện tại ở bên ngoài thành `root` (UID 0) trong user namespace mới (nhờ vậy lệnh chạy được mà không cần `sudo`). Ví dụ: `/proc/self/uid_map` sẽ ghi `0  1000  1` (UID 0 bên trong ứng với UID 1000 bên ngoài, dải dài 1).
- **`--mount-proc`**: Mount lại một filesystem `proc` mới ngay trước khi chạy chương trình. Khi tạo PID namespace mới, cờ này giúp các công cụ đọc từ `/proc` như `ps -e` chỉ nhìn thấy các process bên trong PID namespace mới (với `bash` là PID 1) thay vì thấy toàn bộ process của máy chủ.
</details>

### Câu Hỏi 14: Làm thế nào để thử nghiệm Time Namespace không cần `sudo` bằng `unshare` và kiểm chứng kết quả?

<details>
<summary>Đáp án</summary>

Ta kết hợp `-r` (tạo user namespace không cần root) với `-T` (tạo time namespace) và cờ chỉ định offset như `--boottime`:

```bash
cat /proc/uptime
unshare -r -T --boottime 86400 bash -c 'cat /proc/uptime; cat /proc/self/timens_offsets'
```

- **Kết quả quan sát**: Giá trị trong `/proc/uptime` bên trong shell mới sẽ tăng thêm đúng `86400` giây so với bên ngoài, trong khi đồng hồ trên máy chủ không đổi; file `/proc/self/timens_offsets` hiển thị `boottime 86400 0` và `monotonic 0 0`.
- Lưu ý trong thực tế với công cụ `unshare(1)`, `unshare -T` tự đặt process chạy chương trình vào time namespace mới mà không cần thêm `-f`.
</details>

### Câu Hỏi 15: Để kiểm tra cấu hình mạng (`ip addr`) bên trong network namespace của một container đang chạy (chẳng hạn quản lý bằng Podman), ta thực hiện qua các bước và lệnh nào?

<details>
<summary>Đáp án</summary>

1. **Lấy PID của process container nhìn từ máy chủ**: Dùng lệnh như `podman inspect <tên>` và tìm trường chứa PID của container.
2. **Dùng `nsenter` gia nhập network namespace của PID đó và chạy `ip addr`**:
   ```bash
   sudo nsenter -t <PID> -n ip addr
   ```
   - `-t <PID>`: Chỉ định process đích.
   - `-n`: Chỉ định gia nhập **network namespace** của process đích (không truyền đối số sau `-n` nghĩa là dùng network namespace của process đích).
3. **Kiểm tra bổ sung bằng `lsns`**: Có thể chạy `lsns -t net` để liệt kê riêng các network namespace hiện có trên máy và đối chiếu inode với PID 1 trên host.
</details>
