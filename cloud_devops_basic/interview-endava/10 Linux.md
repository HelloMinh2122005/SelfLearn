# 10. Linux

> Câu hỏi viết bằng tiếng Anh (như khi phỏng vấn), đáp án viết bằng tiếng Việt.

---

## A. Processes & Signals

### 1. What is the difference between a process and a thread?
<details><summary>Đáp án</summary>

- **Process**: không gian địa chỉ riêng, có tài nguyên riêng (file descriptor, memory), cô lập với process khác.
- **Thread**: luồng thực thi **trong** process, **dùng chung** memory và file descriptor với các thread khác cùng process.
- Trên Linux cả hai đều là "task" tạo bằng `clone()` với cờ chia sẻ khác nhau. Xem thread bằng `ps -eLf` hoặc `top -H`.
</details>

### 2. Explain process states shown by `ps`: R, S, D, Z, T.
<details><summary>Đáp án</summary>

- **R**: đang chạy hoặc sẵn sàng chạy.
- **S**: ngủ, có thể bị đánh thức (chờ sự kiện).
- **D**: ngủ **không thể ngắt**, thường là chờ I/O (disk, NFS). Không kill được ngay. Nhiều process ở trạng thái D là dấu hiệu storage có vấn đề.
- **Z**: **zombie**.
- **T**: bị dừng (SIGSTOP hoặc đang debug).
</details>

### 3. What is a zombie process? What is an orphan process?
<details><summary>Đáp án</summary>

- **Zombie**: process con **đã kết thúc** nhưng process cha **chưa gọi `wait()`** để lấy exit status. Nó chỉ còn một entry trong bảng process, không tốn CPU hay RAM, nhưng chiếm PID. Không thể kill zombie. Phải sửa hoặc kill **process cha**.
- **Orphan**: process con mà cha đã chết, được **PID 1 nhận nuôi** (hoặc subreaper). Trong container, nếu PID 1 là app không biết reap thì zombie sẽ tích tụ (đây là lý do dùng `tini`).
</details>

### 4. Explain common signals: SIGTERM, SIGKILL, SIGINT, SIGHUP, SIGQUIT.
<details><summary>Đáp án</summary>

- **SIGTERM (15)**: yêu cầu kết thúc **lịch sự**. App có thể bắt để dọn dẹp. Đây là signal mặc định của `kill`, cũng là signal Kubernetes gửi khi dừng Pod.
- **SIGKILL (9)**: kernel giết ngay. **Không bắt được, không bỏ qua được**.
- **SIGINT (2)**: Ctrl+C.
- **SIGHUP (1)**: terminal đóng. Nhiều daemon dùng nó để **nạp lại cấu hình** (nginx).
- **SIGQUIT (3)**: Ctrl+\. JVM in **thread dump** khi nhận signal này.
- **SIGSTOP/SIGCONT**: tạm dừng và tiếp tục.
</details>

### 5. What does `nice` do?
<details><summary>Đáp án</summary>

`nice` và `renice` đặt **độ ưu tiên lập lịch CPU** của process, từ -20 (ưu tiên cao nhất) tới 19 (thấp nhất). Mặc định là 0. User thường chỉ được tăng giá trị nice (giảm ưu tiên của chính mình). Hay dùng cho job nền (nén log, backup) để không ảnh hưởng service chính.
</details>

### 6. What is load average? Can it be high when CPU usage is low?
<details><summary>Đáp án</summary>

Load average là trung bình số task **đang chạy hoặc chờ CPU (R)** **cộng với số task ở trạng thái D** (chờ I/O không ngắt được), tính trên 1, 5 và 15 phút. Phải so với **số core**: load 8 trên máy 8 core là vừa đủ tải. **Có thể cao khi CPU thấp** nếu nhiều process ở trạng thái D, nghĩa là nghẽn I/O, NFS treo. Kiểm tra `%wa` trong `top`, `vmstat`, `iostat`.
</details>

### 7. In `top`, what do `us`, `sy`, `wa`, `st`, `id` mean?
<details><summary>Đáp án</summary>

- `us`: thời gian CPU chạy code user.
- `sy`: thời gian chạy code kernel (syscall).
- `wa`: CPU rảnh **trong khi chờ I/O**.
- `st`: **steal**, thời gian hypervisor lấy cho VM khác. Cao nghĩa là VM bị tranh tài nguyên.
- `id`: rảnh.
- `ni`, `hi`, `si`: process có nice, ngắt cứng, ngắt mềm.
</details>

## B. Memory

### 8. Explain the output of `free -h`. Why is "free" memory often low?
<details><summary>Đáp án</summary>

Linux dùng RAM rảnh làm **page cache** (buff/cache) để tăng tốc I/O, nên cột `free` thường thấp. Đây là bình thường. Chỉ số cần xem là **`available`**: lượng memory có thể cấp cho ứng dụng mới mà không phải swap, bao gồm phần cache có thể thu hồi. Thiếu memory thật khi `available` thấp **và** swap hoặc OOM tăng.
</details>

### 9. What is the OOM killer? How do you know it killed your process?
<details><summary>Đáp án</summary>

Khi hệ thống hoặc **cgroup** hết memory, kernel chọn một process để kill dựa trên `oom_score` (mức dùng memory, điều chỉnh bằng `oom_score_adj`). Dấu vết:
- `dmesg -T | grep -i -E 'killed process|out of memory'`.
- `journalctl -k`.
- Trong Kubernetes: `OOMKilled`, exit code 137.
</details>

### 10. What is swap? Why has Kubernetes historically required it to be disabled?
<details><summary>Đáp án</summary>

Swap là vùng trên disk để đẩy các trang memory ít dùng ra ngoài. Swap làm hiệu năng khó dự đoán (latency tăng mạnh khi bị swap), và làm hỏng tính toán memory limit hoặc QoS của kubelet. Vì vậy kubelet trước đây **bắt buộc tắt swap**. Các bản Kubernetes gần đây đã thêm hỗ trợ swap có kiểm soát (NodeSwap). Cần đối chiếu trạng thái tính năng theo phiên bản cụ thể.
</details>

## C. Disk & Filesystem

### 11. `df` shows the disk is full but `du` shows much less usage. Why?
<details><summary>Đáp án</summary>

Thường do file **đã bị xóa nhưng vẫn còn được process mở** (ví dụ log bị `rm` khi app vẫn đang ghi). Inode chưa giải phóng nên `df` vẫn tính dung lượng, còn `du` không thấy file. Tìm bằng `lsof +L1` hoặc `lsof | grep deleted`. Xử lý bằng cách restart process, hoặc truncate qua `/proc/<pid>/fd/<n>` (`: > /proc/<pid>/fd/<n>`). Phòng ngừa: dùng logrotate với `copytruncate` hoặc để app tự mở lại file log.
</details>

### 12. The disk has free space but you get "No space left on device". Why?
<details><summary>Đáp án</summary>

**Hết inode**: có quá nhiều file nhỏ (cache, session, mail queue, layer container). Kiểm tra `df -i`. Tìm thư mục có nhiều file: `find / -xdev -type f | cut -d/ -f2-3 | sort | uniq -c | sort -nr | head`. Nguyên nhân khác: quota, hoặc dung lượng dành riêng cho root (khoảng 5% trên ext4).
</details>

### 13. What is an inode? Hard link vs symbolic link.
<details><summary>Đáp án</summary>

- **Inode** chứa metadata của file (quyền, chủ sở hữu, kích thước, thời gian, vị trí các block), **không chứa tên**. Tên nằm trong directory entry, trỏ tới inode.
- **Hard link**: một tên khác trỏ tới **cùng inode**. Xóa một tên thì file vẫn còn tới khi số link bằng 0. Không tạo được qua filesystem khác, không dùng cho thư mục.
- **Symlink**: file đặc biệt chứa **đường dẫn** tới file khác. Có thể trỏ qua filesystem khác. Link bị "gãy" nếu file đích bị xóa.
</details>

### 14. How do you find what is using the most disk space?
<details><summary>Đáp án</summary>

```bash
df -hT                                        # filesystem nào đầy
du -xh --max-depth=1 /var | sort -h | tail    # thư mục lớn nhất (-x: không sang filesystem khác)
find / -xdev -type f -size +500M -exec ls -lh {} + 2>/dev/null
journalctl --disk-usage
docker system df / crictl images              # trên node chạy container
```
</details>

### 15. Explain the key directories: `/etc`, `/var`, `/proc`, `/sys`, `/tmp`, `/opt`.
<details><summary>Đáp án</summary>

- `/etc`: cấu hình hệ thống.
- `/var`: dữ liệu thay đổi (log trong `/var/log`, spool, dữ liệu của container runtime trong `/var/lib/containerd`).
- `/proc`: filesystem ảo về process và kernel (`/proc/<pid>/`, `/proc/meminfo`).
- `/sys`: thông tin thiết bị, kernel, cgroup (`/sys/fs/cgroup`).
- `/tmp`: file tạm, có sticky bit.
- `/opt`: phần mềm cài thêm.
</details>

## D. Permissions & Users

### 16. Explain Linux permissions and `chmod 755`, `chmod 640`.
<details><summary>Đáp án</summary>

- Ba nhóm: **user / group / others**. Ba quyền: **r=4, w=2, x=1**.
- `755` = `rwxr-xr-x`: chủ sở hữu toàn quyền, người khác đọc và chạy. Dùng cho script hoặc thư mục.
- `640` = `rw-r-----`: chủ đọc ghi, nhóm chỉ đọc, người khác không có quyền. Dùng cho file cấu hình có thông tin nhạy cảm.
- Với **thư mục**: `x` là quyền đi vào (cd, truy cập file bên trong), `r` là liệt kê, `w` là tạo hoặc xóa file.
</details>

### 17. What are setuid, setgid and the sticky bit?
<details><summary>Đáp án</summary>

- **setuid** (`4xxx`) trên file thực thi: chạy với quyền của **chủ file**. Ví dụ `passwd` chạy như root.
- **setgid** (`2xxx`): trên file thì chạy với group của file. Trên thư mục thì file mới tạo **kế thừa group** của thư mục.
- **Sticky** (`1xxx`) trên thư mục: chỉ chủ file mới được xóa file của mình. Ví dụ `/tmp` (`drwxrwxrwt`).
</details>

### 18. What is `umask`?
<details><summary>Đáp án</summary>

Mặt nạ **gỡ bớt quyền** mặc định khi tạo file hoặc thư mục. File mặc định là 666, thư mục là 777. Với umask `022`: file thành `644`, thư mục thành `755`.
</details>

### 19. What are `/etc/passwd`, `/etc/shadow`, `/etc/group`? How does `sudo` work?
<details><summary>Đáp án</summary>

- `/etc/passwd`: tài khoản (tên, UID, GID, thư mục home, shell). Ai cũng đọc được.
- `/etc/shadow`: **hash mật khẩu**, chỉ root đọc được.
- `/etc/group`: nhóm và thành viên.
- `sudo` cho phép user chạy lệnh với quyền user khác (thường là root) theo quy tắc trong `/etc/sudoers` (sửa bằng `visudo`). Mọi lần dùng đều được ghi log.
</details>

## E. Services, Logs & Boot

### 20. How do you manage services with systemd?
<details><summary>Đáp án</summary>

```bash
systemctl status nginx
systemctl start|stop|restart|reload nginx
systemctl enable --now nginx     # tự khởi động khi boot và bật ngay
systemctl list-units --failed
systemctl cat nginx              # xem unit file
systemctl daemon-reload          # sau khi sửa unit file
```
Unit file có các phần `[Unit]`, `[Service]` (`ExecStart`, `Restart=on-failure`, `User`, `Environment`), `[Install]` (`WantedBy=multi-user.target`).
</details>

### 21. A service fails to start. How do you troubleshoot it?
<details><summary>Đáp án</summary>

1. `systemctl status <svc>`: trạng thái, exit code, vài dòng log cuối.
2. `journalctl -u <svc> -b --no-pager -n 200` (hoặc `-f` để theo dõi): lỗi chi tiết.
3. Thường gặp:
   - Sai cấu hình: chạy lệnh kiểm tra cú pháp (`nginx -t`).
   - **Port đã bị chiếm**: `ss -tlnp | grep :80`.
   - Sai quyền file hoặc user.
   - Thiếu file hoặc thư mục.
   - **SELinux** chặn: `ausearch -m avc` hoặc `/var/log/audit/audit.log`.
   - Dependency chưa sẵn sàng.
4. Thử chạy tay lệnh `ExecStart` với đúng user để thấy lỗi trực tiếp.
</details>

### 22. How do you use `journalctl` effectively?
<details><summary>Đáp án</summary>

```bash
journalctl -u kubelet -f                         # theo dõi một unit
journalctl -u kubelet --since "10 min ago"
journalctl -p err -b                             # mức lỗi trở lên, từ lần boot hiện tại
journalctl -k                                    # log kernel (giống dmesg)
journalctl -b -1                                 # lần boot trước (cần journald lưu bền vững)
journalctl -o json-pretty -u x                   # định dạng JSON
```
</details>

### 23. Describe the Linux boot process briefly.
<details><summary>Đáp án</summary>

1. Firmware (BIOS hoặc UEFI) khởi tạo phần cứng.
2. Bootloader (GRUB2) nạp kernel và initramfs.
3. Kernel khởi tạo driver, mount initramfs để tìm root filesystem.
4. Mount root filesystem, chạy **PID 1 (systemd)**.
5. systemd khởi động các unit theo target (`multi-user.target`, `graphical.target`).
</details>

### 24. What is logrotate?
<details><summary>Đáp án</summary>

Công cụ (thường chạy hằng ngày qua cron hoặc systemd timer) **xoay vòng, nén và xóa** log cũ theo cấu hình trong `/etc/logrotate.d/`: `daily`, `rotate 7`, `compress`, `maxsize`, `copytruncate` hoặc `postrotate` (gửi SIGHUP để app mở lại file log). Không có logrotate thì disk sẽ đầy log.
</details>

### 25. Explain cron syntax. How is it different from systemd timers?
<details><summary>Đáp án</summary>

`m h dom mon dow command`. Ví dụ `*/5 * * * *` là mỗi 5 phút, `0 2 * * 1` là 2 giờ sáng thứ Hai. Lỗi thường gặp: cron chạy với **PATH và môi trường tối giản**, nên lệnh chạy tay được mà cron thì không. Hãy dùng đường dẫn tuyệt đối. **systemd timer** có log trong journal, có thể chạy bù nếu máy tắt lúc tới giờ (`Persistent=true`), quản lý dependency tốt hơn.
</details>

## F. Networking & Diagnostics on Linux

### 26. How do you check which process is listening on a port?
<details><summary>Đáp án</summary>

```bash
ss -tulpn                 # TCP/UDP đang lắng nghe, kèm process (cần root để thấy PID)
ss -tlnp 'sport = :8080'
lsof -i :8080
```
`netstat` thuộc gói net-tools cũ, `ss` là công cụ thay thế.
</details>

### 27. What are file descriptors? How do you fix "Too many open files"?
<details><summary>Đáp án</summary>

FD là số nguyên đại diện cho file, socket hoặc pipe mà process đang mở (0 = stdin, 1 = stdout, 2 = stderr). Lỗi xảy ra khi chạm giới hạn `RLIMIT_NOFILE`. Cách xử lý:
- Kiểm tra: `ls /proc/<pid>/fd | wc -l`, `cat /proc/<pid>/limits`, `ulimit -n`.
- Nếu là **rò rỉ** (socket hoặc file không đóng) thì sửa code.
- Nếu tải thật sự cần nhiều thì tăng `LimitNOFILE=` trong unit systemd hoặc cấu hình limits của container runtime.
- Kafka, Elasticsearch, Cassandra đều cần giới hạn FD cao.
</details>

### 28. What do `strace` and `lsof` tell you?
<details><summary>Đáp án</summary>

- `strace -p <pid> -f -e trace=network,file`: các **syscall** process đang gọi. Thấy nó đang treo ở đâu (chờ `connect`, `read`), file nào không tìm thấy (`ENOENT`), quyền bị từ chối (`EACCES`).
- `lsof -p <pid>`: các file, socket, thư viện process đang mở.
- Cả hai cực hữu ích khi không có log rõ ràng.
</details>

### 29. Which commands do you use for performance triage (CPU, memory, disk, network)?
<details><summary>Đáp án</summary>

- `uptime` (load).
- `top`/`htop`.
- `vmstat 1` (run queue, swap, `wa`).
- `free -h`.
- `iostat -xz 1` (`%util`, `await` của disk).
- `pidstat 1`.
- `sar` (lịch sử, gói sysstat).
- `ss -s` (tóm tắt socket).
- `dmesg -T` (lỗi kernel, OOM, disk).
- `df -h`/`df -i`.
</details>

### 30. You cannot SSH into a server. How do you troubleshoot?
<details><summary>Đáp án</summary>

- Phía client: `ssh -vvv user@host`. Kết quả **timeout** nghĩa là có vấn đề mạng hoặc firewall. **Refused** nghĩa là sshd không chạy hoặc sai port. Lỗi **auth** nghĩa là sai key, sai quyền `~/.ssh` (700) hoặc `authorized_keys` (600), user bị khóa.
- Kiểm tra DNS hoặc IP, security group, firewall (`firewall-cmd`, `iptables`), bastion.
- Nếu có console (cloud serial console, Run Command): `systemctl status sshd`, disk đầy (sshd có thể lỗi), `journalctl -u sshd`.
</details>

### 31. Explain SSH key authentication and SSH local port forwarding.
<details><summary>Đáp án</summary>

- Client có **private key**, server có **public key** trong `~/.ssh/authorized_keys`. Server gửi challenge, client ký bằng private key, server kiểm tra bằng public key. Private key không bao giờ rời khỏi client. `known_hosts` lưu khóa của server để phát hiện tấn công MITM.
- `ssh -L 5432:db.internal:5432 bastion`: truy cập `localhost:5432` trên máy mình sẽ được chuyển qua bastion tới `db.internal:5432`.
</details>

## G. Kernel Features Behind Containers

### 32. What are namespaces? Name the types.
<details><summary>Đáp án</summary>

Namespace bao một tài nguyên toàn cục để process trong namespace thấy **bản riêng** của tài nguyên đó:
- `pid`: cây process riêng, PID 1 riêng.
- `net`: interface, IP, routing, port riêng.
- `mnt`: điểm mount riêng.
- `uts`: hostname riêng.
- `ipc`: shared memory, semaphore.
- `user`: ánh xạ UID/GID (nền tảng của rootless).
- `cgroup`, `time`.

Xem bằng `lsns`. Vào namespace của process khác bằng `nsenter -t <pid> -n` (debug mạng của container từ node).
</details>

### 33. What are cgroups? What changed in cgroup v2?
<details><summary>Đáp án</summary>

cgroups **giới hạn, tính toán và cô lập** tài nguyên (CPU, memory, I/O, PIDs) cho nhóm process. **cgroup v2** dùng **một cây thống nhất** thay vì mỗi controller một cây, với giao diện thống nhất (`memory.max`, `memory.current`, `cpu.max`, `pids.max`) và quản lý memory và áp lực tài nguyên tốt hơn (PSI). Các bản phân phối mới dùng v2 mặc định. JVM và Kubernetes đều đã hỗ trợ v2.
</details>

### 34. What is SELinux? How do you troubleshoot a denial?
<details><summary>Đáp án</summary>

SELinux là **kiểm soát truy cập bắt buộc** (MAC) dựa trên nhãn (context) gắn cho process và file. Nó vẫn chặn kể cả khi quyền Unix cho phép.
- Chế độ: `Enforcing`, `Permissive` (chỉ ghi log), `Disabled`. Xem bằng `getenforce`.
- Lỗi bị chặn: `ausearch -m avc -ts recent`, `/var/log/audit/audit.log`, `sealert`.
- Sửa đúng cách: gán lại nhãn (`restorecon -Rv`, `semanage fcontext`), bật boolean (`setsebool -P httpd_can_network_connect on`). Đừng tắt SELinux. Với Podman, mount volume cần `:Z`/`:z`.
</details>

### 35. What are sysctl parameters? Give examples relevant to Kafka or Elasticsearch nodes.
<details><summary>Đáp án</summary>

`sysctl` đọc và ghi tham số kernel (`/proc/sys`). Cấu hình lâu dài đặt trong `/etc/sysctl.d/*.conf`. Ví dụ:
- `vm.max_map_count=262144`: Elasticsearch yêu cầu.
- `vm.swappiness`: mức kernel dùng swap.
- `net.core.somaxconn`: hàng đợi kết nối.
- `net.ipv4.ip_forward=1`: node Kubernetes cần để chuyển gói.
- `fs.file-max`.

Trong Kubernetes, sysctl "safe" đặt được qua `securityContext.sysctls`. Loại khác phải đặt ở node.
</details>

### 36. What is the difference between `.bashrc` and `.bash_profile`? Why does an environment variable work in my terminal but not in a cron job or systemd service?
<details><summary>Đáp án</summary>

- `.bash_profile` (hoặc `.profile`) chạy cho **login shell**. `.bashrc` chạy cho **interactive non-login shell** (thường `.bash_profile` gọi `.bashrc`).
- Cron và systemd **không chạy qua shell đăng nhập**, nên không đọc các file này. Biến đặt trong đó không tồn tại.
- Khai báo trong crontab, `Environment=`/`EnvironmentFile=` của unit, hoặc trong script.
</details>

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [Linux man-pages: proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html): `/proc`, trạng thái process, `/proc/<pid>/fd`, limits.
- [Linux man-pages: signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html): các signal và hành vi mặc định.
- [Linux man-pages: namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html) và [cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html): namespace và cgroup.
- [Linux kernel docs: Control Group v2](https://docs.kernel.org/admin-guide/cgroup-v2.html): `memory.max`, `cpu.max`, PSI.
- [systemd.service](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html) và [journalctl](https://www.freedesktop.org/software/systemd/man/latest/journalctl.html): quản lý service và log.
- [Red Hat: Using SELinux (RHEL 9)](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/using_selinux/index): SELinux.
- [Linux man-pages: ss(8)](https://man7.org/linux/man-pages/man8/ss.8.html), [strace(1)](https://man7.org/linux/man-pages/man1/strace.1.html), [lsof(8)](https://man7.org/linux/man-pages/man8/lsof.8.html): công cụ chẩn đoán.
- [Kubernetes: Swap memory management](https://kubernetes.io/docs/concepts/cluster-administration/swap-memory-management/): trạng thái hỗ trợ swap.
- [Kubernetes: Using sysctls in a Kubernetes Cluster](https://kubernetes.io/docs/tasks/administer-cluster/sysctl-cluster/): sysctl trong Pod.
