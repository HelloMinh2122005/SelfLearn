# 12. Networking

> Câu hỏi viết bằng tiếng Anh (như khi phỏng vấn), đáp án viết bằng tiếng Việt.

---

### 1. Explain the OSI and TCP/IP models. Where do common protocols and devices sit?
<details><summary>Đáp án</summary>

| OSI | Ví dụ |
|---|---|
| 7 Application | HTTP, DNS, gRPC, Kafka protocol |
| 6 Presentation / 5 Session | TLS thường được xếp ở khoảng này |
| 4 Transport | TCP, UDP (port) |
| 3 Network | IP, ICMP, router |
| 2 Data link | Ethernet, MAC, ARP, switch, VLAN |
| 1 Physical | Cáp, sóng |

Mô hình TCP/IP gộp lại thành 4 tầng: Link, Internet, Transport, Application. Khi debug, biết lỗi ở tầng nào sẽ chọn được đúng công cụ: `ping` cho L3, `nc`/`ss` cho L4, `curl` cho L7.
</details>

### 2. TCP vs UDP.
<details><summary>Đáp án</summary>

- **TCP**: có kết nối (handshake), **tin cậy** (ACK, gửi lại), **đúng thứ tự**, kiểm soát luồng và tắc nghẽn. Dùng cho HTTP/1.1, HTTP/2, Kafka, DB.
- **UDP**: không kết nối, không bảo đảm gửi tới hay đúng thứ tự, overhead thấp. Dùng cho DNS (truy vấn thường), streaming, QUIC/HTTP3 (QUIC tự làm phần tin cậy trên UDP).
</details>

### 3. Explain the TCP three-way handshake and connection termination. What is TIME_WAIT?
<details><summary>Đáp án</summary>

- Mở kết nối: client gửi **SYN**, server trả **SYN-ACK**, client gửi **ACK**.
- Đóng kết nối: mỗi bên gửi **FIN** và nhận **ACK** (thường 4 gói).
- Bên **chủ động đóng** vào trạng thái **TIME_WAIT** (khoảng 2×MSL, trên Linux là 60 giây) để gói trễ không lẫn vào kết nối mới.
- Có quá nhiều TIME_WAIT là dấu hiệu mở và đóng kết nối liên tục, nên dùng keep-alive hoặc connection pooling. Nếu không, có thể cạn **ephemeral port** phía client.
</details>

### 4. What happens when you type `https://app.example.com` into a browser?
<details><summary>Đáp án</summary>

1. **DNS**: cache trình duyệt, cache OS, `/etc/hosts`, resolver (đệ quy từ root qua TLD tới authoritative) ra IP.
2. **TCP** handshake tới IP:443.
3. **TLS** handshake: SNI, certificate, trao đổi khóa.
4. Gửi **HTTP request** (Host header, cookie).
5. Qua **load balancer, reverse proxy, ingress** tới backend. Backend có thể gọi tiếp DB hoặc service khác.
6. Nhận **response**, trình duyệt render và tải tiếp tài nguyên con.
</details>

### 5. Explain DNS record types: A, AAAA, CNAME, MX, TXT, NS, SRV, PTR.
<details><summary>Đáp án</summary>

- **A**: tên ra IPv4. **AAAA**: tên ra IPv6.
- **CNAME**: bí danh trỏ tới tên khác. Không đặt được ở apex domain theo chuẩn.
- **MX**: máy chủ mail.
- **TXT**: văn bản (SPF, xác minh domain).
- **NS**: name server có thẩm quyền.
- **SRV**: dịch vụ kèm port (Kubernetes có bản ghi SRV cho named port của Service).
- **PTR**: tra ngược IP ra tên.
- **TTL** quyết định thời gian cache, nên ảnh hưởng tốc độ thay đổi khi chuyển IP.
</details>

### 6. How does name resolution work on a Linux host?
<details><summary>Đáp án</summary>

Thứ tự theo `/etc/nsswitch.conf` (thường là `files dns`). Trước tiên xem `/etc/hosts`, sau đó hỏi nameserver trong `/etc/resolv.conf` (có `search` domain và `options ndots`). Các bản phân phối có thể dùng `systemd-resolved` (stub `127.0.0.53`). Lưu ý: `dig` và `nslookup` hỏi DNS trực tiếp, **bỏ qua `/etc/hosts`**. Muốn kiểm tra theo đúng cách ứng dụng phân giải thì dùng `getent hosts <name>`.
</details>

### 7. Explain the TLS handshake. What changed in TLS 1.3?
<details><summary>Đáp án</summary>

- Client gửi **ClientHello**: phiên bản, cipher suite, **SNI** (tên miền), key share.
- Server gửi **ServerHello** và **certificate**.
- Client **xác minh certificate**: chuỗi tới CA tin cậy, tên khớp SAN, còn hạn.
- Hai bên trao đổi khóa (ECDHE) để tạo khóa phiên đối xứng, rồi truyền dữ liệu đã mã hóa.
- **TLS 1.3**: handshake **1-RTT** (TLS 1.2 cần 2-RTT), bỏ các thuật toán yếu và trao đổi khóa RSA tĩnh (bắt buộc forward secrecy), hỗ trợ 0-RTT khi kết nối lại.
</details>

### 8. What is a certificate chain? What causes `x509: certificate signed by unknown authority`?
<details><summary>Đáp án</summary>

Cert của server được ký bởi **intermediate CA**, intermediate được ký bởi **root CA** có trong trust store. Lỗi `unknown authority` xảy ra khi:
- Server **không gửi intermediate**.
- Cert do **CA nội bộ** cấp nhưng client chưa tin CA đó. Ví dụ Java truststore (`cacerts`) hoặc image container thiếu `ca-certificates`.
- Proxy công ty chặn và ký lại TLS.

Kiểm tra bằng `openssl s_client -connect host:443 -servername host -showcerts`.
</details>

### 9. What is mTLS and where is it used?
<details><summary>Đáp án</summary>

Mutual TLS: **cả hai phía đều trình certificate** và xác minh lẫn nhau. Dùng cho xác thực giữa các service (service mesh tự cấp cert cho từng workload), giữa client và Kafka broker (`SSL` listener với client auth), và giữa các thành phần control plane của Kubernetes (kubelet và API server).
</details>

### 10. HTTP status codes: what's the difference between 502, 503 and 504?
<details><summary>Đáp án</summary>

- **502 Bad Gateway**: proxy hoặc gateway nhận **phản hồi không hợp lệ** từ upstream: kết nối bị đóng, bị reset, upstream bị crash.
- **503 Service Unavailable**: dịch vụ **tạm thời không phục vụ được**: không có backend khỏe (Service không có endpoint), quá tải, đang bảo trì.
- **504 Gateway Timeout**: proxy **chờ upstream quá thời gian** cho phép.
- Ngoài ra: 401 là chưa xác thực, 403 là không có quyền, 404 là không tìm thấy, 429 là bị giới hạn tần suất.
</details>

### 11. Which HTTP methods are idempotent? Why does it matter?
<details><summary>Đáp án</summary>

`GET`, `HEAD`, `OPTIONS`, `PUT`, `DELETE` là idempotent theo định nghĩa. `POST` (và `PATCH` nói chung) thì không. Điều này quyết định có **retry an toàn** được hay không: proxy, client, service mesh chỉ nên tự động retry các method idempotent. Với `POST` cần idempotency key.
</details>

### 12. HTTP/1.1 vs HTTP/2 vs HTTP/3.
<details><summary>Đáp án</summary>

- **HTTP/1.1**: dạng văn bản, keep-alive, mỗi kết nối xử lý một request tại một thời điểm, bị **head-of-line blocking**, trình duyệt phải mở nhiều kết nối.
- **HTTP/2**: nhị phân, **multiplexing** nhiều stream trên một kết nối TCP, nén header (HPACK). gRPC dùng HTTP/2. Vẫn bị chặn đầu hàng ở tầng TCP khi mất gói.
- **HTTP/3**: chạy trên **QUIC (UDP)**, mỗi stream độc lập, handshake nhanh hơn, hỗ trợ chuyển mạng (connection migration).
</details>

### 13. L4 vs L7 load balancing.
<details><summary>Đáp án</summary>

- **L4**: định tuyến theo IP và port, chuyển tiếp **kết nối TCP/UDP**, không đọc nội dung. Nhanh, không terminate TLS (hoặc passthrough). Ví dụ: Kubernetes Service (kube-proxy), NLB.
- **L7**: hiểu HTTP. Định tuyến theo host, path, header, **terminate TLS**, retry, cân bằng theo **từng request**, sticky session theo cookie. Ví dụ: Ingress controller, Gateway API, API Gateway, ALB, Envoy.
</details>

### 14. Name common load-balancing algorithms.
<details><summary>Đáp án</summary>

- Round robin (có trọng số hoặc không).
- Least connections.
- Least response time.
- IP hash hoặc consistent hashing: cùng client hoặc key luôn về cùng backend.
- Random, và "power of two choices" (chọn ngẫu nhiên hai backend rồi lấy cái ít tải hơn).
- Health check để loại backend lỗi.
</details>

### 15. What is SSL/TLS termination and where can it happen?
<details><summary>Đáp án</summary>

Termination là điểm **giải mã TLS**. Có ba cách:
- Tại **load balancer hoặc ingress**: backend nhận HTTP thuần. Đơn giản, quản lý cert tập trung, LB đọc được HTTP để định tuyến.
- **Re-encryption**: LB giải mã rồi mã hóa lại tới backend.
- **Passthrough**: LB chỉ chuyển TCP, backend tự terminate. Mã hóa đầu cuối nhưng LB không định tuyến được theo L7.

Header `X-Forwarded-Proto` và `X-Forwarded-For` báo cho backend biết giao thức và IP gốc.
</details>

### 16. Reverse proxy vs forward proxy. How do `HTTP_PROXY` / `NO_PROXY` affect CI jobs and Pods?
<details><summary>Đáp án</summary>

- **Forward proxy** đứng phía **client**, đi ra internet thay client (proxy công ty).
- **Reverse proxy** đứng phía **server**, nhận request thay backend (nginx, ingress).
- Trong môi trường có proxy, công cụ đọc biến `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`. Lỗi kinh điển: **thiếu `NO_PROXY`** cho địa chỉ nội bộ (`.svc`, `.cluster.local`, IP của API server, registry nội bộ), khiến traffic nội bộ bị đẩy qua proxy và bị timeout.
- Java **không** đọc các biến này một cách tự động. Phải dùng `-Dhttps.proxyHost`, `-Dhttp.nonProxyHosts`.
</details>

### 17. Explain NAT, SNAT, DNAT and private IP ranges.
<details><summary>Đáp án</summary>

- **NAT** đổi địa chỉ IP (và port) trong gói tin khi đi qua thiết bị.
- **SNAT**: đổi **nguồn**, ví dụ mạng private ra internet qua một IP public (masquerade, NAT gateway).
- **DNAT**: đổi **đích**, ví dụ port forwarding, kube-proxy đổi ClusterIP thành IP Pod.
- Dải private (RFC 1918): `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`.
- Dải CIDR của Pod và Service trong Kubernetes **không được trùng** với mạng công ty hoặc VPC, nếu không sẽ lỗi định tuyến.
</details>

### 18. CIDR math: how many addresses in a /24, /16, /20? What is /32?
<details><summary>Đáp án</summary>

Số địa chỉ = 2^(32 − prefix).
- `/24` = 256 địa chỉ (254 host dùng được trong mạng truyền thống).
- `/20` = 4096.
- `/16` = 65 536.
- `/32` = **một địa chỉ** duy nhất (hay dùng trong rule firewall).
- Ví dụ: `10.0.0.0/20` gồm `10.0.0.0`–`10.0.15.255`.
- Cloud thường giữ lại thêm vài IP mỗi subnet (Azure và AWS giữ 5).
</details>

### 19. What is a default gateway? How do you view the routing table?
<details><summary>Đáp án</summary>

Gói tin tới đích không thuộc mạng nào mà host trực tiếp nối tới sẽ được gửi tới **default gateway** (router). Xem bằng `ip route` (`default via 10.0.0.1 dev eth0`). Kiểm tra route tới một IP cụ thể: `ip route get 8.8.8.8`. Xem IP và interface: `ip addr`.
</details>

### 20. What is ARP?
<details><summary>Đáp án</summary>

Address Resolution Protocol tìm **MAC address** ứng với một IP **trong cùng mạng L2**: broadcast "ai có IP này?", máy có IP đó trả lời bằng MAC của nó. Xem bảng bằng `ip neigh`. Một số lỗi mạng (xung đột IP, MetalLB ở chế độ L2) liên quan tới ARP.
</details>

### 21. "Connection refused" vs "timeout" vs "no route to host" vs "connection reset by peer".
<details><summary>Đáp án</summary>

- **Refused**: host phản hồi RST vì **không có gì lắng nghe** ở port đó.
- **Timeout**: không có phản hồi. Gói bị firewall DROP, sai IP, mạng không tới, host quá tải.
- **No route to host**: không có route, hoặc firewall trả ICMP unreachable (REJECT).
- **Reset by peer**: kết nối **đang mở** bị đầu kia đóng đột ngột. Có thể do app crash, LB hoặc proxy cắt kết nối idle, hoặc keep-alive dùng lại kết nối mà phía bên kia đã đóng.
</details>

### 22. Which tools do you use to debug network issues, and what does each tell you?
<details><summary>Đáp án</summary>

- `ping`: L3 có tới không (ICMP có thể bị chặn mà dịch vụ vẫn chạy).
- `traceroute`/`mtr`: đường đi và hop nào mất gói hoặc chậm.
- `dig`/`nslookup`/`getent hosts`: DNS.
- `nc -vz host port` hoặc `telnet`: L4, port có mở không.
- `curl -v` / `curl -w '%{time_namelookup} %{time_connect} %{time_appconnect} %{time_starttransfer}\n'`: L7, và thời gian từng giai đoạn (DNS, TCP, TLS, phản hồi đầu tiên).
- `openssl s_client`: TLS và cert.
- `ss -tanp`: kết nối và trạng thái trên máy.
- `tcpdump -i any port 9092 -nn`: bắt gói để xem thực tế.
- `ip route`/`ip addr`: cấu hình mạng.
</details>

### 23. What is MTU and how can it cause problems in overlay networks?
<details><summary>Đáp án</summary>

MTU là kích thước gói lớn nhất trên một liên kết (Ethernet thường là 1500). Overlay network (VXLAN, IPIP) **bọc thêm header** (VXLAN khoảng 50 byte), nên MTU của Pod phải nhỏ hơn. Cấu hình sai thì **gói nhỏ đi qua được nhưng gói lớn bị rơi**. Triệu chứng điển hình: `ping` và TCP handshake thành công, request nhỏ chạy được, nhưng **TLS handshake hoặc response lớn bị treo**. Kiểm tra bằng `ping -M do -s 1472 host`.
</details>

### 24. How do iptables chains work at a high level?
<details><summary>Đáp án</summary>

Gói đi qua các **table** (`filter`, `nat`, `mangle`, `raw`) và **chain**: `PREROUTING` → (`INPUT` nếu tới chính host, hoặc `FORWARD` nếu đi qua) → `POSTROUTING`. Gói do host tạo ra đi qua `OUTPUT`. Rule khớp sẽ thực hiện **target** (`ACCEPT`, `DROP`, `REJECT`, `DNAT`, `SNAT`, `MASQUERADE`, hoặc nhảy sang chain khác). kube-proxy (chế độ iptables) tạo các chain `KUBE-SERVICES`, `KUBE-SVC-*`, `KUBE-SEP-*` để DNAT ClusterIP tới Pod. nftables là cơ chế kế nhiệm của iptables.
</details>

### 25. Stateful vs stateless firewall.
<details><summary>Đáp án</summary>

- **Stateful** (iptables với conntrack, security group): theo dõi kết nối. Chỉ cần cho phép chiều đi, chiều phản hồi tự được cho qua.
- **Stateless** (ACL mạng kiểu cũ, một số NACL trên cloud): xét từng gói độc lập, phải mở **cả hai chiều**, kể cả dải ephemeral port cho gói trả về.
</details>

### 26. What are ephemeral ports and what is port exhaustion?
<details><summary>Đáp án</summary>

Client dùng port nguồn tạm thời (Linux mặc định trong `net.ipv4.ip_local_port_range`, khoảng 32768–60999) cho mỗi kết nối đi ra. Mỗi kết nối được xác định bằng bộ năm (IP và port nguồn, IP và port đích, giao thức). Nếu mở quá nhiều kết nối tới **cùng một đích** (và để lại TIME_WAIT), hoặc qua **SNAT** dùng chung một IP, thì có thể **hết port**: kết nối mới bị lỗi hoặc timeout. Cách xử lý: connection pooling hoặc keep-alive, thêm IP cho SNAT.
</details>

### 27. What is keep-alive and why can idle timeouts cause intermittent errors?
<details><summary>Đáp án</summary>

Keep-alive giữ kết nối TCP để dùng lại cho nhiều request, đỡ tốn handshake. Nếu **LB hoặc proxy cắt kết nối idle sớm hơn** client nghĩ, client sẽ gửi request trên kết nối đã chết và nhận **reset hoặc 502** ngắt quãng. Cách xử lý: timeout idle của client (pool) phải **ngắn hơn** timeout của LB hoặc server, hoặc dùng TCP keepalive hay health check kết nối.
</details>

### 28. Which ports do you associate with these services: SSH, DNS, HTTP(S), Kubernetes API, etcd, kubelet, Kafka, ZooKeeper, Cassandra, Elasticsearch, Prometheus, Grafana?
<details><summary>Đáp án</summary>

| Dịch vụ | Port mặc định |
|---|---|
| SSH | 22 |
| DNS | 53 (UDP/TCP) |
| HTTP / HTTPS | 80 / 443 |
| Kubernetes API | 6443 |
| etcd | 2379 (client), 2380 (peer) |
| kubelet API | 10250 |
| Kafka | 9092 (thường dùng) |
| ZooKeeper | 2181 (client), 2888 (follower ↔ leader), 3888 (bầu leader) |
| Cassandra | 9042 (CQL), 7000 (internode) |
| Elasticsearch | 9200 (HTTP), 9300 (transport) |
| Prometheus / Grafana | 9090 / 3000 |
</details>

### 29. What is the difference between a VPN, a bastion host and a private endpoint?
<details><summary>Đáp án</summary>

- **VPN**: nối mạng của bạn vào mạng riêng qua đường hầm mã hóa (site-to-site hoặc client).
- **Bastion / jump host**: máy trung gian được bảo vệ chặt, dùng để SSH vào các máy bên trong mà không mở SSH ra internet.
- **Private endpoint / private link**: truy cập một dịch vụ được quản lý (DB, storage, API server của cluster) qua **IP private** trong mạng của bạn thay vì endpoint public.
</details>

### 30. How would you debug a microservice that intermittently can't connect to Kafka on Kubernetes?
<details><summary>Đáp án</summary>

- Kafka client kết nối **bootstrap server** rồi nhận **metadata** chứa địa chỉ của **từng broker** (`advertised.listeners`). Client phải kết nối được **tới địa chỉ đó**. Sai `advertised.listeners` là lỗi kinh điển: chỉ kết nối được lần đầu, hoặc chỉ thành công với một số partition.
- Kiểm tra DNS headless (`kafka-0.kafka-headless...`).
- NetworkPolicy, TLS hoặc SASL (cert hết hạn, truststore).
- Broker đang rolling restart (leader chuyển đi).
- Log của client (`Disconnected`, `NOT_LEADER_OR_FOLLOWER`, `UnknownHostException`).
- Kiểm tra bằng `kafka-broker-api-versions.sh --bootstrap-server ...` từ một Pod debug.
</details>

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [RFC 9293: Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293): TCP, handshake, TIME_WAIT.
- [RFC 8446: TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446): handshake của TLS 1.3.
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110): method, idempotency, status code (502/503/504).
- [RFC 9113: HTTP/2](https://www.rfc-editor.org/rfc/rfc9113) và [RFC 9114: HTTP/3](https://www.rfc-editor.org/rfc/rfc9114): HTTP/2 và HTTP/3.
- [RFC 1918: Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918): dải IP private.
- [RFC 1035: Domain Names](https://www.rfc-editor.org/rfc/rfc1035): DNS.
- [MDN: HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status): giải thích status code.
- [Linux man-pages: ip-route(8)](https://man7.org/linux/man-pages/man8/ip-route.8.html), [tcpdump(1)](https://www.tcpdump.org/manpages/tcpdump.1.html): công cụ mạng.
- [Kubernetes: Ports and Protocols](https://kubernetes.io/docs/reference/networking/ports-and-protocols/): port của các thành phần Kubernetes.
- [Apache Kafka: Broker Configs (`advertised.listeners`)](https://kafka.apache.org/documentation/#brokerconfigs_advertised.listeners): cấu hình listener.
