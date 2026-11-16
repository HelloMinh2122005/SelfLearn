# Evidence Index: WRITE-CTR-6_1_9

- **Task ID**: WRITE-CTR-6_1_9
- **Assignee**: main session (không dùng subagent), 16-11-2026
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_1 Container Fundamentals/6_1_9 Container Networking Basics.md`
- **Topic Title**: 6_1_9 Container Networking Basics
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_1_9.md`
- **Gate status**: G1 (quotes OK), G2, G3, G4 (`evidence.py lesson` 0 errors). **G5 (verifier độc lập): CHƯA CHẠY**.

## Claim IDs Used
  - `R9.1`: veth là thiết bị Ethernet ảo, có thể làm đường hầm giữa các network namespace.
  - `R9.2`: veth luôn được tạo theo cặp nối với nhau.
  - `R9.3`: Một thiết bị mạng vật lý chỉ thuộc đúng một network namespace.
  - `R9.4`: Podman: mode bridge tạo network stack trên bridge mặc định, là mặc định cho container rootful.
  - `R9.5`: Podman: pasta tạo network stack ở user-mode, là mặc định cho container rootless và chỉ hỗ trợ rootless.
  - `R9.6`: Với pasta, địa chỉ IPv4/IPv6, route và tên interface được sao chép từ máy chủ theo mặc định.
  - `R9.7`: Podman -p/--publish công bố cổng container ra máy chủ.
  - `R9.8`: Docker: -p 8080:80 tạo ánh xạ giữa cổng 8080 trên máy chủ và cổng 80 của container.
  - `R9.9`: Docker publish cổng dùng luật firewall để làm NAT, PAT và masquerading.
  - `R9.10`: Docker: user-defined bridge có DNS tự động giữa các container.
  - `R9.11`: Docker: trên default bridge chỉ truy cập nhau bằng địa chỉ IP (trừ --link, được coi là legacy).
  - `R9.12`: Netavark là network stack viết bằng Rust cho container, thiết kế để dùng với Podman.
  - `R9.13`: aardvark-dns là DNS server có thẩm quyền cho bản ghi A/AAAA của container, chuyển tiếp yêu cầu khác tới /etc/resolv.conf của máy chủ.
