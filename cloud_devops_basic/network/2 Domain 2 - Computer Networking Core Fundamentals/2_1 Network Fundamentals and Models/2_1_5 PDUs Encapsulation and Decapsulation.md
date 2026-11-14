# 2_1_5 PDUs Encapsulation and Decapsulation

> **Khóa học**: Cloud DevOps Basic — Networking Core  
> **Phân nhóm**: 2 Domain 2 - Computer Networking Core Fundamentals › 2_1 Network Fundamentals and Models  
> **Chủ đề**: Đơn vị dữ liệu giao thức (PDU), Toàn trình Đóng gói (Encapsulation) / Mở gói (Decapsulation) và Cơ chế Phân kênh (Demultiplexing)  
> **Trạng thái**: Draft (WRITE-CDB-2_1_5, 14-11-2026)  
> **Checklist đối chiếu**: [2_1_5](../../../CHECKLIST.md#domain-2-computer-networking-core-fundamentals-43-items)  

---

## 1. Khái Niệm Cốt Lõi & Bản Chất Kỹ Thuật (Core Concepts & Technical Deep Dive)

Trong kiến trúc mạng máy tính phân tầng, dữ liệu ứng dụng không thể tự truyền thẳng từ tiến trình gửi sang tiến trình nhận qua dây cáp mà phải trải qua một quy trình xử lý đa tầng nghiêm ngặt. Mỗi tầng trong ngăn xếp mạng đảm nhận một nhiệm vụ chuyên biệt, đóng gói siêu dữ liệu điều khiển vào bức điện trước khi chuyển xuống tầng dưới, và bóc tách, thẩm định siêu dữ liệu đó khi nhận được từ tầng dưới đưa lên. Hai quá trình mang tính nền tảng này được gọi là **Đóng gói (Encapsulation)** và **Giải đóng gói (Decapsulation)**.

---

### 1.1 Khái niệm PDU, SDU và PCI theo chuẩn OSI / ISO/IEC 7498-1

Theo đặc tả chuẩn quốc tế **ITU-T Recommendation X.200 (Clause 5.6.1.1 – 5.6.1.3)** và mô hình tham chiếu **ISO/IEC 7498-1**, cấu trúc truyền thông giữa các tầng được định nghĩa chính xác thông qua ba khái niệm toán học và kiến trúc:

1. **SDU (Service Data Unit - Đơn vị Dữ liệu Dịch vụ)**:
   - Là phần dữ liệu người dùng được tầng trên $(N+1)$ chuyển giao nguyên vẹn xuống tầng dưới $(N)$ để yêu cầu dịch vụ truyền tải.
   - Đối với tầng $(N)$, SDU là phần "tải trọng" (payload) thuần túy mà tầng $(N)$ không cần quan tâm đến ngữ nghĩa nội dung bên trong.
2. **PCI (Protocol Control Information - Thông tin Điều khiển Giao thức)**:
   - Là tập hợp các thông tin điều khiển do tầng $(N)$ tạo ra và trao đổi với thực thể đồng tầng $(N)$ tại máy nhận nhằm phối hợp hoạt động (như định danh nguồn/đích, số thứ tự tuần tự, mã kiểm tra lỗi).
   - Trong thực tế cài đặt, PCI thường xuất hiện dưới dạng **Header** (phần đầu) và đôi khi kèm theo **Trailer** (phần đuôi kiểm tra lỗi).
3. **PDU (Protocol Data Unit - Đơn vị Dữ liệu Giao thức)**:
   - Là đơn vị dữ liệu hoàn chỉnh của tầng $(N)$, bao gồm thông tin điều khiển $(N)\text{-PCI}$ kết hợp cùng dữ liệu người dùng $(N)\text{-user-data}$ (tức $(N)\text{-SDU}$):
     $$(N)\text{-PDU} = (N)\text{-PCI} + (N)\text{-SDU}$$
   - Khi $(N)\text{-PDU}$ được chuyển tiếp xuống tầng dưới $(N-1)$, toàn bộ khối dữ liệu này lại đóng vai trò là $(N-1)\text{-SDU}$ đối với tầng $(N-1)$.

```
+-------------------------------------------------------------+
|                      (N)-PDU                                |
|  +--------------------+----------------------------------+  |
|  |      (N)-PCI       |             (N)-SDU              |  |
|  | (Thông tin Header) |   (Payload từ tầng N+1 đưa xuống)|  |
|  +--------------------+----------------------------------+  |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     (N-1)-PDU                               |
|  +--------------------+----------------------------------+  |
|  |     (N-1)-PCI      |            (N-1)-SDU             |  |
|  | (Header tầng dưới) |        (Toàn bộ (N)-PDU)         |  |
|  +--------------------+----------------------------------+  |
+-------------------------------------------------------------+
```

---

### 1.2 Tên gọi PDU chuẩn tại từng tầng mạng

Mỗi tầng trong mô hình OSI và mô hình TCP/IP sử dụng một thuật ngữ riêng biệt để chỉ PDU của mình. Việc sử dụng chính xác danh xưng kỹ thuật là bắt buộc trong giao tiếp kỹ thuật và thiết kế hệ thống mạng:

| Tầng mạng | Mô hình OSI / TCP/IP | Tên gọi PDU chuẩn | Thành phần cấu tạo chính |
| :--- | :--- | :--- | :--- |
| **Layer 7, 6, 5** | Application / Presentation / Session | **Data / Message** | Dữ liệu ứng dụng thuần túy (HTTP Request/Response, DNS Query...). |
| **Layer 4** | Transport Layer | **Segment** (TCP) hoặc **Datagram** (UDP) | L4 Header (Source/Destination Port, Flags, Seq/Ack) + Application Data. |
| **Layer 3** | Network / Internet Layer | **Packet** hoặc **IP Datagram** | L3 Header (Source/Destination IP, TTL, Protocol) + Transport Segment. |
| **Layer 2** | Data Link Layer | **Frame (Khung dữ liệu)** | L2 Header (Source/Destination MAC, EtherType) + IP Packet + FCS Trailer. |
| **Layer 1** | Physical Layer | **Bits** (Chuỗi bit 0 và 1) | Tín hiệu điện, xung ánh sáng hoặc sóng vô tuyến biểu diễn chuỗi bit. |

---

### 1.3 Toàn trình Đóng gói (Encapsulation) tại bên gửi

Theo giáo trình chuẩn Kurose & Ross (Computer Networking: A Top-Down Approach, Section 1.5.2) cùng các chuẩn RFC 791 và RFC 894, quá trình đóng gói tại máy gửi diễn ra theo chiều dọc từ trên xuống dưới (top-down):

1. **Tầng Ứng dụng (Layer 7)**: Ứng dụng tạo ra thông điệp dữ liệu (Application Data/Message), ví dụ một truy vấn HTTP GET hoặc chuỗi JSON. Dữ liệu này được chuyển xuống Tầng Giao vận (Transport Layer) dưới dạng L4-SDU.
2. **Tầng Giao vận (Layer 4)**: 
   - Ngăn xếp TCP hoặc UDP tiếp nhận dữ liệu và bổ sung **L4 Header** (chứa cổng nguồn Source Port, cổng đích Destination Port, số hiệu tuần tự Sequence Number, cờ điều khiển).
   - Kết quả tạo thành một **TCP Segment** (hoặc UDP Datagram). Khối dữ liệu này trở thành L3-SDU khi chuyển giao xuống Tầng Mạng.
3. **Tầng Mạng (Layer 3)**:
   - Giao thức IP (IPv4 hoặc IPv6) tiếp nhận Segment và bổ sung **L3 Header** (chứa địa chỉ IP nguồn Source IP, địa chỉ IP đích Destination IP, thời gian sống TTL, và trường nhận diện giao thức tầng trên Protocol ID).
   - Kết quả tạo thành một **IP Packet** (hoặc IP Datagram). Toàn bộ IP Packet trở thành L2-SDU khi chuyển xuống Tầng Liên kết dữ liệu.
4. **Tầng Liên kết dữ liệu (Layer 2)**:
   - Trình điều khiển card mạng (NIC Driver) tiếp nhận IP Packet và bổ sung **L2 Header** ở đầu (chứa địa chỉ MAC nguồn, địa chỉ MAC đích của chặng kế tiếp, mã định danh EtherType).
   - Đồng thời, NIC tính toán mã băm kiểm tra dư thừa tuần hoàn CRC-32 trên toàn bộ khung và gắn thêm **Trailer FCS (Frame Check Sequence)** 4 bytes vào cuối khung.
   - Kết quả tạo thành một **Ethernet Frame**.
5. **Tầng Vật lý (Layer 1)**:
   - Bộ điều khiển giao tiếp mạng (NIC PHY transceiver) chuyển đổi cấu trúc khung Ethernet Frame thành các xung tín hiệu vật lý (điện áp trên cáp đồng xoắn đôi, xung ánh sáng trên sợi quang) để truyền dẫn chuỗi bit qua môi trường truyền thông.

---

### 1.4 Toàn trình Giải đóng gói (Decapsulation) tại bên nhận

Tại máy nhận (hoặc thiết bị đích cuối cùng), quy trình diễn ra theo chiều ngược lại từ dưới lên trên (bottom-up) theo nguyên tắc thẩm định tính hợp lệ tại từng tầng (RFC 1812, Section 3.1 & 5.2.2):

1. **Tiếp nhận Bit tại Layer 1**: Bộ thu phát vật lý ghi nhận tín hiệu từ đường dây cáp, tái tạo thành chuỗi bit số và chuyển giao lên card mạng (NIC).
2. **Thẩm định và bóc tách tại Layer 2 (Frame Decapsulation)**:
   - NIC thu thập khung tin và tính toán lại mã CRC-32 trên toàn bộ khung dữ liệu nhận được, sau đó so khớp với giá trị lưu trong trường **FCS (Frame Check Sequence)** ở cuối khung.
   - **Quy tắc toàn vẹn**: Nếu mã CRC tính toán không khớp với FCS, khung tin đã bị suy hao hoặc biến dạng bit trên đường truyền. NIC lập tức loại bỏ (drop) khung tin mà không cần xử lý thêm.
   - **Quy tắc định địa chỉ**: Nếu CRC khớp, NIC kiểm tra địa chỉ MAC đích. Nếu MAC đích trùng với địa chỉ MAC vật lý của card mạng, hoặc là địa chỉ Broadcast (`FF:FF:FF:FF:FF:FF`), hoặc multicast đã đăng ký, card mạng chấp nhận khung tin.
   - NIC bóc bỏ L2 Header và FCS Trailer, trích xuất IP Packet (L2-SDU) và chuyển lên Tầng Mạng.
3. **Thẩm định và bóc tách tại Layer 3 (Packet Decapsulation)**:
   - Ngăn xếp giao thức IP kiểm tra tính toàn vẹn của IP Header (Header Checksum trong IPv4).
   - Kiểm tra địa chỉ IP đích: Nếu IP đích trùng với địa chỉ IP cục bộ của máy chủ, ngăn xếp IP chấp nhận gói tin.
   - Bóc bỏ IP Header, trích xuất Transport Segment (L3-SDU) và chuyển lên Tầng Giao vận.
4. **Tái lắp ráp và bóc tách tại Layer 4 (Segment Decapsulation)**:
   - Ngăn xếp TCP/UDP kiểm tra checksum tầng giao vận để xác nhận tính toàn vẹn của cả header lẫn payload.
   - Với TCP: Tiến hành sắp xếp tuần tự các gói tin theo Sequence Number, xử lý xác nhận Acknowledgement và loại bỏ gói tin trùng lặp.
   - Bóc bỏ L4 Header, chuyển giao khối Application Data nguyên vẹn lên vùng đệm (buffer) của tiến trình ứng dụng đang lắng nghe.
5. **Tiếp nhận tại Layer 7 (Application Processing)**:
   - Tiến trình người dùng (ví dụ: Nginx, Apache, API service) đọc dữ liệu từ socket buffer và thực thi logic nghiệp vụ.

---

### 1.5 Cơ chế Phân kênh ngược (Demultiplexing) và các khóa nhận diện

Trong một hệ thống máy tính, có vô số ứng dụng và giao thức cùng hoạt động đồng thời trên một giao diện mạng vật lý duy nhất. Làm thế nào một tầng bên dưới biết chính xác phải chuyển giao dữ liệu lên giao thức hoặc tiến trình cụ thể nào ở tầng trên? Câu trả lời nằm ở cơ chế **Demultiplexing (Phân kênh ngược)** dựa trên các trường định danh chuẩn hóa:

```
+-------------------------------------------------------------+
| Layer 4 / Ứng dụng:  HTTP (Port 80)  |  SSH (Port 22)       |
+-------------------------------------------------------------+
                               ^               ^
             Port Number (16-bit)              |
                               +-------+-------+
                                       |
+-------------------------------------------------------------+
| Layer 3:             IPv4            |  IPv6                |
|                      Protocol = 6    |  Next Header = 6     |
+-------------------------------------------------------------+
                               ^               ^
             EtherType (16-bit)| (0x0800)      | (0x86DD)
                               +-------+-------+
                                       |
+-------------------------------------------------------------+
| Layer 2:             Ethernet II Frame                      |
+-------------------------------------------------------------+
```

1. **Khóa phân kênh Layer 2 — Trường EtherType (16 bits / 2 bytes)**:
   - Nằm trong Header Ethernet II (RFC 894, RFC 2464).
   - Cho biết giao thức mạng Layer 3 nào đang nằm bên trong phần dữ liệu của Frame:
     * `0x0800`: Giao thức **IPv4** (Internet Protocol version 4).
     * `0x86DD`: Giao thức **IPv6** (Internet Protocol version 6).
     * `0x0806`: Giao thức **ARP** (Address Resolution Protocol).
2. **Khóa phân kênh Layer 3 — Trường Protocol (8 bits / 1 byte)**:
   - Nằm trong Header IPv4 (RFC 791, Page 14) (hoặc trường *Next Header* trong IPv6).
   - Cho biết giao thức giao vận Layer 4 nào chịu trách nhiệm xử lý gói tin:
     * `6`: Giao thức **TCP** (Transmission Control Protocol - RFC 9293).
     * `17`: Giao thức **UDP** (User Datagram Protocol - RFC 768).
     * `1`: Giao thức **ICMP** (Internet Control Message Protocol).
3. **Khóa phân kênh Layer 4 — Trường Destination Port (16 bits / 2 bytes)**:
   - Nằm trong Header TCP hoặc UDP (RFC 9293, RFC 768).
   - Cho biết socket mạng và tiến trình ứng dụng cụ thể nào trên hệ điều hành đang mở kết nối tiếp nhận dữ liệu (ví dụ: port 80/443 cho Web Server HTTP/HTTPS, port 22 cho SSH Server, port 53 cho DNS Resolver).

Nhờ bộ ba khóa phân kênh tuần tự này (`EtherType` $\rightarrow$ `Protocol` $\rightarrow$ `Port`), dữ liệu được định tuyến chính xác tuyệt đối từ dây cáp vật lý lên đến từng dòng code của ứng dụng người dùng.

---

## 2. Ví Dụ Đời Sống Thực Tế Dễ Hiểu (Intuitive Real-World Analogies)

Để hình dung trực quan bản chất của Đóng gói và Giải đóng gói, hãy đối chiếu với hai mô hình quen thuộc trong đời sống: **Búp bê Matryoshka Nga** và **Hệ thống chuyển phát bưu phẩm quốc tế đa tầng**.

### Mô hình Búp bê Matryoshka Nga (Nesting Dolls)
Hãy tưởng tượng dữ liệu ứng dụng của bạn là búp bê nhỏ nhất bằng gỗ ở trong cùng:
- Khi đóng gói, bạn đặt con búp bê nhỏ nhất vào bụng một con búp bê lớn hơn (bổ sung TCP Header tạo thành Segment).
- Tiếp theo, bạn đặt con búp bê đó vào bụng một con búp bê lớn hơn nữa (bổ sung IP Header tạo thành Packet).
- Cuối cùng, bạn nhét toàn bộ vào con búp bê to nhất ngoài cùng (bổ sung Ethernet Header và Trailer tạo thành Frame).
- Khi người nhận mở ra, họ bắt buộc phải bóc mở từng lớp vỏ ngoài cùng thì mới có thể chạm được tới con búp bê cốt lõi bên trong.

---

### Mô hình Hệ thống Chuyển phát Bưu phẩm Đa tầng

```
[BÊN GỬI: ENCAPSULATION]
Lá thư nội bộ (Data)
   └─> Nhét vào Phong bì dán số phòng ban (TCP Segment: Port 80)
         └─> Nhét vào Thùng Carton dán địa chỉ nhà (IP Packet: IP 192.168.1.10)
               └─> Nhét vào Thùng Container dán kẹp chì niêm phong (Ethernet Frame: MAC + FCS)
                     └─> Xe cẩu bốc lên boong tàu chở đi (Physical Bits)

[BÊN NHẬN: DECAPSULATION]
Kiểm tra chì niêm phong còn nguyên vẹn? (FCS / CRC Check)
   └─> Kiểm tra số hiệu Container (MAC đích) -> Mở container lấy Thùng Carton
         └─> Kiểm tra địa chỉ nhà (IP đích) -> Mở thùng carton lấy Phong bì
               └─> Đọc số phòng ban (Port 80) -> Trao lá thư cho đúng nhân viên xử lý
```

1. **Chiều gửi (Encapsulation — Chuẩn bị bưu kiện)**:
   - **Tầng Ứng dụng**: Bạn viết một bức thư tay chứa nội dung quan trọng (**Data Payload**).
   - **Tầng Giao vận**: Bạn cho bức thư vào một phong bì nhỏ dán nhãn ghi rõ "Kính gửi Phòng Kế toán - Tầng 3" (**TCP Header chứa Destination Port**). Lúc này bạn có một bưu phẩm con (**Segment**).
   - **Tầng Mạng**: Bạn đặt phong bì đó vào một kiện hộp carton dán nhãn địa chỉ tòa nhà văn phòng và mã bưu điện (**IP Header chứa Destination IP**). Lúc này bạn có một kiện hàng bưu chính (**Packet**).
   - **Tầng Liên kết**: Bạn đưa kiện hàng ra bến cảng logistics. Tại đây, công ty vận tải đặt kiện carton vào một thùng container kim loại khổng lồ mang biển số xe vận tải nội bộ bến bãi (**MAC Header**), đồng thời bấm chốt khóa kẹp chì niêm phong bằng kim loại (**FCS Trailer**). Lúc này bạn có một kiện vận chuyển hoàn chỉnh (**Frame**).
   - **Tầng Vật lý**: Cần cẩu nâng thùng container lên boong tàu thủy và vận chuyển vượt biển (**Physical Bits** truyền trên đường cáp).

2. **Chiều nhận (Decapsulation — Tiếp nhận và xử lý bưu kiện)**:
   - **Tại Cảng đích (Layer 2)**: Nhân viên cảng kiểm tra khóa kẹp chì niêm phong xem có dấu hiệu bị va đập, cạy phá hay rách vỡ trên đường đi hay không (**FCS Check**). Nếu khóa kẹp chì bị đứt gãy, container bị phế bỏ ngay lập tức. Nếu nguyên vẹn, họ kiểm tra biển số container (**Destination MAC**), bóc dỡ vỏ thép container và lấy kiện hộp carton bên trong ra ngoài.
   - **Tại Tòa nhà đích (Layer 3)**: Nhân viên bảo vệ tòa nhà kiểm tra nhãn địa chỉ trên hộp carton xem có đúng tòa nhà của mình không (**Destination IP**). Họ đọc mã phân loại hàng hóa (**Protocol = 6 TCP**), rạch băng dính hộp carton và lấy phong bì thư ra.
   - **Tại Văn phòng (Layer 4)**: Nhân viên lễ tân nhìn vào nhãn phòng ban trên phong bì (**Destination Port 80**), mang trực tiếp đến đúng bàn làm việc của Trưởng phòng Kế toán.
   - **Tại Bàn làm việc (Layer 7)**: Người nhận bóc phong bì và đọc lá thư nguyên vẹn ban đầu.

---

## 3. Kiến Trúc, Luồng Hoạt Động & Hình Ảnh Trực Quan (Architecture, Diagrams & Visual Media)

### 3.1 Quy trình tương tác hai đầu mút (Sequence Diagram)

Sơ đồ tuần tự dưới đây thể hiện chi tiết luồng dữ liệu hai chiều: Chiều đóng gói tuần tự tại Host A (Sender) và Chiều giải đóng gói kèm các bước kiểm tra phân kênh ngược tại Host B (Receiver).

```mermaid
sequenceDiagram
    autonumber
    participant AppS as Host A: Application (L7)
    participant TransS as Host A: Transport (L4)
    participant NetS as Host A: Network (L3)
    participant LinkS as Host A: Data Link (L2)
    participant Wire as Physical Wire (L1 Bits)
    participant LinkR as Host B: Data Link (L2)
    participant NetR as Host B: Network (L3)
    participant TransR as Host B: Transport (L4)
    participant AppR as Host B: Application (L7)

    Note over AppS,LinkS: GIAI ĐOẠN 1: ĐÓNG GÓI DỮ LIỆU (ENCAPSULATION)
    AppS->>TransS: 1. Application Data (L4-SDU)
    Note over TransS: Gắn L4 Header (Src/Dst Port: 80, Seq, Ack)<br/>-> Tạo thành TCP Segment
    TransS->>NetS: 2. TCP Segment (L3-SDU)
    Note over NetS: Gắn L3 Header (Src/Dst IP, Protocol: 6, TTL)<br/>-> Tạo thành IP Packet
    NetS->>LinkS: 3. IP Packet (L2-SDU)
    Note over LinkS: Gắn L2 Header (Src/Dst MAC, EtherType: 0x0800)<br/>+ Tính toán gắn L2 Trailer FCS (CRC-32)<br/>-> Tạo thành Ethernet Frame
    LinkS->>Wire: 4. Điều chế chuỗi bit điện/quang lên đường dây

    Wire-->>LinkR: 5. Thu nhận xung tín hiệu và giải mã bit

    Note over LinkR,AppR: GIAI ĐOẠN 2: GIẢI ĐÓNG GÓI & PHÂN KÊNH (DECAPSULATION & DEMUX)
    Note over LinkR: Bước 1: Tính toán lại CRC-32 & so sánh với FCS<br/>Bước 2: So khớp Dst MAC với MAC của card NIC<br/>Bước 3: Đọc EtherType (0x0800) -> Chuyển lên IPv4 module
    LinkR->>NetR: 6. Giao nộp IP Packet (Đã bóc L2 Header & FCS Trailer)
    Note over NetR: Bước 1: Kiểm tra tính hợp lệ IP Header Checksum<br/>Bước 2: So khớp Dst IP với IP cục bộ của host<br/>Bước 3: Đọc Protocol field (6) -> Chuyển lên TCP module
    NetR->>TransR: 7. Giao nộp TCP Segment (Đã bóc L3 IP Header)
    Note over TransR: Bước 1: Kiểm tra TCP Checksum & xác nhận tính toàn vẹn<br/>Bước 2: Tái lắp ráp phân đoạn tuần tự (Sequence buffer)<br/>Bước 3: Đọc Dst Port -> Chuyển vào Socket Buffer tương ứng
    TransR->>AppR: 8. Giao nộp Application Payload (Đã bóc L4 TCP Header)
    Note over AppR: Tiến trình máy chủ Web (HTTP) xử lý yêu cầu
```

---

### 3.2 Cấu trúc phân cấp lồng nhau của PDU (PDU Hierarchy & Data Nesting)

Khi quan sát một khung truyền thông Ethernet II hoàn chỉnh trên đường dây mạng vật lý, cấu trúc đóng gói lồng nhau xuất hiện tuần tự theo định dạng chuẩn:

```
+----------------------------------------------------------------------------------------------------+
|                                    ETHERNET II FRAME (LAYER 2)                                     |
+--------------------------+-------------------------------------------------------------+-----------+
|    ETHERNET HEADER       |                   ETHERNET PAYLOAD (L2-SDU)                 |  TRAILER  |
|        (14 Bytes)        |                       (46 - 1500 Bytes)                     | (4 Bytes) |
+--------+--------+--------+-------------------------------------------------------------+-----------+
| Dst MAC| Src MAC| Type   |                       IP PACKET (LAYER 3)                   |    FCS    |
| (6 B)  | (6 B)  | 0x0800 |                                                             |  (CRC-32) |
+--------+--------+--------+--------------------------+----------------------------------+-----------+
                           |     IPv4 HEADER          |       IPv4 PAYLOAD (L3-SDU)      |
                           |   (Tối thiểu 20 Bytes)   |                                  |
                           +--------------------------+----------------------------------+
                           | Version, IHL, Total Len, |      TCP SEGMENT (LAYER 4)       |
                           | TTL, Protocol=6, Src/Dst |                                  |
                           +--------------------------+------------------+---------------+
                                                      |   TCP HEADER     |  DATA PAYLOAD |
                                                      | (Min 20 Bytes)   |  (L4-SDU /    |
                                                      +------------------+  APPLICATION) |
                                                      | Src/Dst Port,    |               |
                                                      | Seq, Ack, Flags  | (Ví dụ HTTP)  |
                                                      +------------------+---------------+
```

---

## 4. Code Mẫu Trực Quan Hoặc Dòng Lệnh Thực Chiến (Runnable Sample Code / CLI)

### 4.1 Bảng chi tiết kích thước Header và Giới hạn MTU các tầng mạng

Việc nắm chắc kích thước chính xác của từng trường header là điều kiện tiên quyết để kỹ sư DevOps và Network tính toán tải trọng mạng, phát hiện tắc nghẽn và tối ưu hóa chi phí đường truyền:

| Tầng | Giao thức | Tên PDU | Độ dài Header tối thiểu | Các trường điều khiển cốt lõi | Ranh giới & Giới hạn chuẩn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Layer 2** | **Ethernet II** | Frame | **14 bytes Header**<br>+ **4 bytes FCS** | - Dst MAC (6B)<br>- Src MAC (6B)<br>- EtherType (2B: `0x0800`, `0x86DD`, `0x0806`)<br>- FCS Trailer (4B CRC-32) | - MTU chuẩn: **1500 bytes** (kích thước IP packet tối đa).<br>- Payload tối thiểu: **46 bytes**.<br>- Kích thước frame tối thiểu trên cáp: **64 bytes** ($14 + 46 + 4$). |
| **Layer 3** | **IPv4** | Packet | **20 bytes** (khi trường IHL = 5, không có Options) | - Version & IHL (1B)<br>- Total Length (2B)<br>- TTL (1B)<br>- Protocol (1B: 6=TCP, 17=UDP, 1=ICMP)<br>- Header Checksum (2B)<br>- Src IP (4B)<br>- Dst IP (4B) | - Kích thước gói tin IPv4 tối đa trên lý thuyết: 65,535 bytes.<br>- Không được vượt quá MTU của liên kết bên dưới nếu không phân mảnh. |
| **Layer 4** | **TCP** | Segment | **20 bytes** (khi Data Offset = 5, không có Options) | - Src Port (2B)<br>- Dst Port (2B)<br>- Sequence Number (4B)<br>- Acknowledgment Number (4B)<br>- Data Offset & Control Flags (2B)<br>- Window Size (2B)<br>- Checksum (2B) | - Hướng kết nối (connection-oriented), đảm bảo tin cậy và kiểm soát luồng. |
| **Layer 4** | **UDP** | Datagram | **8 bytes** (cố định tuyệt đối) | - Src Port (2B)<br>- Dst Port (2B)<br>- Length (2B)<br>- Checksum (2B) | - Phi kết nối (connectionless), tối ưu độ trễ thấp, kích thước header siêu nhẹ (chỉ 8 bytes). |

---

### 4.2 Bài toán tính toán kích thước đóng gói toàn phần (Overhead Calculation)

#### Đề bài thực tế:
Một microservice backend gửi một thông điệp phản hồi HTTP JSON có dung lượng chính xác **1000 bytes** thông qua ngăn xếp giao thức **TCP/IPv4 trên đường truyền Ethernet II** (sử dụng cấu trúc header chuẩn không chứa trường tùy chọn Options).
Hãy tính:
1. Kích thước TCP Segment tại Layer 4.
2. Kích thước IPv4 Packet tại Layer 3.
3. Kích thước Ethernet II Frame trên đường truyền vật lý tại Layer 2.
4. Tổng lượng siêu dữ liệu điều khiển (Overhead) và tỷ lệ % overhead chiếm dụng trên đường truyền.

---

#### Các bước tính toán chi tiết:

1. **Bước 1: Tính kích thước TCP Segment ($L_{\text{segment}}$)**:
   - Dữ liệu ứng dụng ($L_{\text{data}}$): $1000 \text{ bytes}$.
   - Header TCP tối thiểu ($\text{Header}_{\text{TCP}}$): $20 \text{ bytes}$.
   $$L_{\text{segment}} = L_{\text{data}} + \text{Header}_{\text{TCP}} = 1000 + 20 = 1020 \text{ bytes}$$

2. **Bước 2: Tính kích thước IPv4 Packet ($L_{\text{packet}}$)**:
   - Payload của IPv4 chính là toàn bộ TCP Segment ($1020 \text{ bytes}$).
   - Header IPv4 chuẩn tối thiểu ($\text{Header}_{\text{IPv4}}$): $20 \text{ bytes}$.
   $$L_{\text{packet}} = L_{\text{segment}} + \text{Header}_{\text{IPv4}} = 1020 + 20 = 1040 \text{ bytes}$$
   > *Kiểm tra ranh giới MTU*: $L_{\text{packet}} = 1040 \text{ bytes} \le 1500 \text{ bytes}$ (MTU chuẩn của Ethernet II). Do đó, gói tin không bị phân mảnh (no IP fragmentation).

3. **Bước 3: Tính kích thước Ethernet Frame toàn phần ($L_{\text{frame}}$)**:
   - Payload của Ethernet Frame chính là IPv4 Packet ($1040 \text{ bytes}$).
   - Header Ethernet II ($\text{Header}_{\text{Eth}}$): $14 \text{ bytes}$ ($6\text{B Destination MAC} + 6\text{B Source MAC} + 2\text{B EtherType}$).
   - Trailer kiểm tra lỗi FCS ($\text{Trailer}_{\text{FCS}}$): $4 \text{ bytes}$ (CRC-32).
   $$L_{\text{frame}} = L_{\text{packet}} + \text{Header}_{\text{Eth}} + \text{Trailer}_{\text{FCS}} = 1040 + 14 + 4 = 1058 \text{ bytes}$$
   > *Kiểm tra kích thước tối thiểu*: Tải trọng Ethernet $1040 \text{ bytes} > 46 \text{ bytes}$ tối thiểu, và toàn bộ khung $1058 \text{ bytes} > 64 \text{ bytes}$ tối thiểu. Do đó, card mạng không cần bổ sung bit đệm zero-padding.

4. **Bước 4: Tính tổng lượng Overhead và tỷ lệ chiếm dụng**:
   - Tổng siêu dữ liệu đóng gói:
     $$\text{Overhead} = \text{Header}_{\text{TCP}} + \text{Header}_{\text{IPv4}} + \text{Header}_{\text{Eth}} + \text{Trailer}_{\text{FCS}} = 20 + 20 + 14 + 4 = 58 \text{ bytes}$$
   - Tỷ lệ % chi phí đóng gói trên tổng dung lượng vật lý truyền đi:
     $$\text{Tỷ lệ Overhead} = \frac{\text{Overhead}}{L_{\text{frame}}} \times 100\% = \frac{58}{1058} \times 100\% \approx 5.48\%$$

---

### 4.3 Thực hành soi gói tin thực tế bằng `tcpdump` trên Linux

Để quan sát tường tận cấu trúc đóng gói đa tầng từ Layer 2 đến Layer 4 trên một giao diện mạng thực tế, chúng ta sử dụng công cụ chuẩn `tcpdump` của Linux với các tham số chuyên sâu:
- `-e`: Yêu cầu in thông tin tiêu đề liên kết dữ liệu Layer 2 (Link-level header / MAC addresses).
- `-nn`: Không chuyển đổi địa chỉ IP và số port thành tên miền hoặc tên dịch vụ (giữ nguyên số định danh thuần túy).
- `-v`: Hiển thị chi tiết (verbose output) các trường trong IP Header như TTL, ID, Flags, Total Length, Protocol.
- `-c 2`: Chỉ bắt đúng 2 gói tin rồi tự động dừng lại.

```bash
# Lệnh lắng nghe và giải mã cấu trúc đóng gói từ L2 đến L4 trên giao diện eth0
sudo tcpdump -e -nn -v -c 2 -i eth0 "tcp port 80"
```

> 💡 **Minh họa thực thi (Illustrative Output)**:

```text
08:24:12.105432 00:1a:2b:3c:4d:5e > 52:54:00:12:34:56, ethertype IPv4 (0x0800), length 74: (tos 0x0, ttl 64, id 41203, offset 0, flags [DF], proto TCP (6), length 60)
    192.168.1.100.45230 > 192.168.1.10.80: Flags [S], cksum 0x7fa2 (correct), seq 3829104812, win 64240, options [mss 1460,sackOK,TS val 2891230 ecr 0,nop,wscale 7], length 0

08:24:12.105890 52:54:00:12:34:56 > 00:1a:2b:3c:4d:5e, ethertype IPv4 (0x0800), length 74: (tos 0x0, ttl 64, id 0, offset 0, flags [DF], proto TCP (6), length 60)
    192.168.1.10.80 > 192.168.1.100.45230: Flags [S.], cksum 0x8ab1 (correct), seq 1049281745, ack 3829104813, win 65160, options [mss 1460,sackOK,TS val 1984210 ecr 2891230,nop,wscale 7], length 0
```

#### Bóc tách giải phẫu kết quả chụp gói tin (Gói 1):

1. **Thông tin Layer 2 (Link-Layer Ethernet II)**:
   - `00:1a:2b:3c:4d:5e > 52:54:00:12:34:56`: Địa chỉ MAC nguồn (`00:1a:2b:3c:4d:5e`) truyền tới địa chỉ MAC đích (`52:54:00:12:34:56`).
   - `ethertype IPv4 (0x0800)`: Trường **EtherType** mang giá trị hexa `0x0800`, báo hiệu cho NIC biết payload L3 bên trong là một gói tin IPv4.
   - `length 74`: Tổng kích thước khung Ethernet (bao gồm 14B MAC header + 60B IPv4 packet; trường FCS 4B thường được card mạng phần cứng loại bỏ trước khi chuyển lên kernel buffer).
2. **Thông tin Layer 3 (Network Layer IPv4)**:
   - `ttl 64`: Trường Time-To-Live quy định số chặng tối đa gói tin có thể đi qua.
   - `id 41203, offset 0, flags [DF]`: Cờ **Don't Fragment [DF]** được bật, báo hiệu cho các router dọc đường không được chia nhỏ gói tin này.
   - `proto TCP (6)`: Trường **Protocol** mang giá trị số nguyên `6`, đóng vai trò chìa khóa phân kênh để tầng mạng chuyển gói tin lên module TCP.
   - `length 60`: Tổng độ dài của IP Packet (20B IP header + 40B TCP header chứa options).
3. **Thông tin Layer 4 (Transport Layer TCP)**:
   - `192.168.1.100.45230 > 192.168.1.10.80`: Cổng nguồn Source Port là `45230` (ephemeral port của trình duyệt client) và Cổng đích Destination Port là `80` (well-known port của dịch vụ Web HTTP).
   - `Flags [S]`: Cờ SYN khởi tạo bắt tay 3 bước TCP (Three-way handshake).
   - `seq 3829104812`: Số thứ tự tuần tự ban đầu (ISN - Initial Sequence Number).
   - `length 0`: Dữ liệu tải trọng ứng dụng (Payload L4) trong gói tin bắt tay này là 0 byte.

---

## 5. Cạm Bẫy Thực Tế & Thực Tiễn Sản Xuất (Production Gotchas & Best Practices)

Trong môi trường vận hành hạ tầng Cloud, Kubernetes và hệ thống mạng doanh nghiệp, hiểu sai hoặc bỏ qua các nguyên tắc đóng gói PDU thường dẫn tới các sự cố hiệu năng nghiêm trọng và lỗi "bí ẩn" khó chẩn đoán.

---

### 5.1 Cạm bẫy 1: Sự cố "Hố Đen Mạng" do MTU Mismatch và Don't Fragment (DF) Black Hole

- **Bản chất kỹ thuật**:
  - Khi triển khai mạng ảo hóa (overlay network như VxLAN trong Kubernetes CNI, hoặc VPN IPsec / WireGuard), các công nghệ này thực hiện **đóng gói lồng thêm một lớp Header nữa** (ví dụ VxLAN thêm 50 bytes header gồm Outer IP + UDP + VxLAN).
  - Nếu card mạng vật lý của máy chủ chỉ hỗ trợ MTU chuẩn $1500 \text{ bytes}$, thì không gian hữu ích cho gói tin của ứng dụng bị thu hẹp lại chỉ còn $1500 - 50 = 1450 \text{ bytes}$.
  - Nếu ứng dụng gửi gói tin kích thước $1500 \text{ bytes}$ với cờ `[DF]` (Don't Fragment) được bật, thiết bị trung gian sẽ không thể đóng gói chuyển tiếp và bắt buộc phải loại bỏ gói tin (drop), đồng thời gửi lại thông báo lỗi `ICMP Type 3 Code 4 (Fragmentation Needed and DF set)`.
  - Nếu tường lửa (Firewall/Security Group) chặn mất thông điệp ICMP này, máy gửi sẽ không bao giờ biết lý do gói tin bị mất, tiếp tục retransmit và kết nối bị treo hoàn toàn (**Path MTU Discovery Black Hole**).
- **Thực tiễn sản xuất**:
  - Luôn cấu hình đồng bộ MTU trên toàn bộ chuỗi giao tiếp. Với các mạng overlay trong cloud, điều chỉnh MTU của card mạng container (veth) xuống mức an toàn (ví dụ: $1450$ hoặc $1420 \text{ bytes}$), hoặc bật tính năng **MSS Clamping** trên router/firewall (`iptables -t mangle -A POSTROUTING -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu`).

---

### 5.2 Cạm bẫy 2: Chi phí Overhead khổng lồ của Gói tin Nhỏ (Small Packet Overhead Trap)

- **Bản chất kỹ thuật**:
  - Như đã tính toán ở Mục 4.2, mỗi gói tin truyền qua mạng TCP/IPv4/Ethernet tiêu tốn tối thiểu **$58 \text{ bytes}$ siêu dữ liệu cố định** ($14\text{B MAC} + 4\text{B FCS} + 20\text{B IP} + 20\text{B TCP}$).
  - Nếu ứng dụng IoT hoặc Microservice gửi các thông điệp telemetry cực nhỏ (ví dụ gửi một giá trị nhiệt độ chỉ dài $2 \text{ bytes}$):
    $$\text{Tổng kích thước trên cáp} = 2 + 58 = 60 \text{ bytes}$$
    Do kích thước khung tối thiểu của Ethernet là $64 \text{ bytes}$, NIC phải đệm thêm $4 \text{ bytes}$ zero-padding, nâng tổng số lên $64 \text{ bytes}$.
  - Lúc này, dữ liệu thực tế chỉ chiếm $2 / 64 = 3.125\%$, trong khi **hơn 96% băng thông mạng bị lãng phí hoàn toàn cho các thông tin tiêu đề điều khiển**!
  - Bên cạnh đó, số lượng gói tin trên giây (PPS - Packets Per Second) tăng vọt khiến CPU của hệ điều hành phải liên tục xử lý ngắt phần cứng (softirq) để giải đóng gói.
- **Thực tiễn sản xuất**:
  - Không truyền tải dữ liệu vụn vặt theo thời gian thực đơn lẻ. Áp dụng kỹ thuật gom mẻ (batching/buffering) dữ liệu ở tầng ứng dụng trước khi gửi.
  - Sử dụng các giao thức hiện đại như HTTP/2, gRPC với cơ chế nén tiêu đề HPACK hoặc multiplexing nhiều luồng trên một kết nối duy nhất để giảm thiểu chi phí đóng gói lặp lại.

---

### 5.3 Cạm bẫy 3: Zero-Padding và Sự cố Lập trình Raw Sockets

- **Bản chất kỹ thuật**:
  - Theo chuẩn RFC 894 và IEEE 802.3, phần tải trọng của khung Ethernet II tối thiểu phải đạt **46 bytes**.
  - Một gói tin TCP ACK thuần túy (không payload) chỉ có $20\text{B IP} + 20\text{B TCP} = 40 \text{ bytes}$. Card mạng (NIC) phần cứng sẽ tự động chèn thêm **6 bytes số 0 (padding)** để đạt đúng 46 bytes trước khi tính CRC-32 và phát lên đường dây.
  - Khi lập trình bắt gói tin tầng thấp (như dùng `AF_PACKET` raw sockets trong C/Go, hoặc eBPF XDP):
    * Một số lập trình viên đọc độ dài khung từ L2 (`frame_len`) thay vì đọc trường `Total Length` trong L3 IPv4 Header, dẫn tới việc đọc nhầm cả các byte padding rác của Ethernet vào buffer dữ liệu ứng dụng.
- **Thực tiễn sản xuất**:
  - Khi trích xuất payload từ gói tin thô, **luôn luôn tin cậy trường `Total Length` trong IPv4 Header** để xác định chính xác ranh giới kết thúc của dữ liệu, tuyệt đối không suy diễn kích thước dữ liệu dựa trên độ dài của khung Layer 2.

---

## 6. Câu Hỏi Củng Cố Kiến Thức (Active Recall Quiz)

### Câu 1: Cơ chế nào giúp tầng Network xác định được một gói tin IP nhận được cần phải giao nộp cho giao thức TCP thay vì UDP?
A. Giá trị trường EtherType trong Header của Ethernet II.  
B. Giá trị trường Protocol trong Header của IPv4.  
C. Giá trị trường Destination Port trong Header của L4.  
D. Mã kiểm tra toàn vẹn Frame Check Sequence (FCS).  

<details>
<summary>👉 Xem đáp án</summary>

**Đáp án đúng: B**

**Giải thích chi tiết**:
- Trường **Protocol** (8-bit) nằm trong IPv4 Header lưu trữ mã định danh của giao thức tầng trên. Khi Protocol = `6`, ngăn xếp IP hiểu rằng payload cần chuyển giao cho giao thức **TCP**. Khi Protocol = `17`, dữ liệu được chuyển cho **UDP**.
- Đáp án A sai vì EtherType (Layer 2) chỉ phân biệt các giao thức Layer 3 (như IPv4 `0x0800` vs IPv6 `0x86DD` vs ARP `0x0806`).
- Đáp án C sai vì Destination Port được dùng bởi TCP/UDP (Layer 4) để chuyển giao dữ liệu lên tiến trình ứng dụng (Layer 7).
- Đáp án D sai vì FCS là mã kiểm tra lỗi CRC-32 của tầng Data Link.
</details>

---

### Câu 2: Trong quá trình giải đóng gói (Decapsulation) tại máy nhận, điều gì xảy ra nếu giá trị CRC-32 tính toán trên khung Ethernet không trùng khớp với giá trị lưu trong trường FCS ở đuôi khung?
A. Khung tin bị card mạng (NIC) loại bỏ (drop) ngay lập tức mà không chuyển lên tầng trên.  
B. Card mạng gửi gói tin ICMP thông báo lỗi về máy gửi yêu cầu truyền lại.  
C. Tầng Network vẫn nhận gói tin và cố gắng sửa lỗi bit bằng thuật toán Hamming.  
D. Gói tin được chuyển lên tầng TCP để TCP tự xử lý việc phát hiện lỗi.  

<details>
<summary>👉 Xem đáp án</summary>

**Đáp án đúng: A**

**Giải thích chi tiết**:
- Mã **FCS (Frame Check Sequence)** sử dụng thuật toán CRC-32 để phát hiện bất kỳ sai hỏng bit nào xảy ra trên đường truyền vật lý.
- Nếu CRC không khớp, khung tin bị hỏng và tính toàn vẹn của địa chỉ MAC cũng như dữ liệu bên trong không còn đáng tin cậy. Card mạng (NIC) ở Layer 2 sẽ âm thầm loại bỏ (silent drop) khung tin đó ngay tại phần cứng.
- Layer 2 Ethernet không có cơ chế tự động gửi thông báo phản hồi (không có ICMP ở Layer 2, ICMP thuộc Layer 3). Trách nhiệm phát hiện mất mát và yêu cầu gửi lại sẽ do giao thức tin cậy ở tầng trên (như TCP với cơ chế timeout/retransmission) đảm nhận.
</details>

---

### Câu 3: Một thông điệp UDP có dung lượng dữ liệu người dùng (Application Payload) là 500 bytes. Giả sử gói tin được truyền qua mạng IPv4 và Ethernet II chuẩn (không có Options). Tổng dung lượng của khung tin này xuất hiện trên đường cáp vật lý (bao gồm cả FCS Trailer) là bao nhiêu bytes?
A. 528 bytes.  
B. 542 bytes.  
C. 546 bytes.  
D. 550 bytes.  

<details>
<summary>👉 Xem đáp án</summary>

**Đáp án đúng: C**

**Giải thích chi tiết các bước tính toán**:
1. Dữ liệu ứng dụng UDP: $500 \text{ bytes}$.
2. Bổ sung UDP Header (kích thước cố định 8 bytes):
   $$L_{\text{datagram}} = 500 + 8 = 508 \text{ bytes}$$
3. Bổ sung IPv4 Header tối thiểu (20 bytes):
   $$L_{\text{packet}} = 508 + 20 = 528 \text{ bytes}$$
4. Bổ sung Ethernet II Header (14 bytes) và FCS Trailer (4 bytes):
   $$L_{\text{frame}} = 528 + 14 + 4 = 546 \text{ bytes}$$
- Do $528 \text{ bytes} \ge 46 \text{ bytes}$ (payload tối thiểu của Ethernet), không cần đệm zero-padding.
- Tổng kích thước khung tin thực tế trên đường cáp là **$546 \text{ bytes}$**.
</details>

---

## 7. 📚 Nguồn Tài Liệu Chính Thống (Tier-1 Official References)

- [RFC 894 - Standard for the Transmission of IP Datagrams over Ethernet Networks](https://datatracker.ietf.org/doc/html/rfc894) - Chuẩn đặc tả kỹ thuật đóng gói datagram IP trong khung Ethernet II, cấu trúc trường EtherType và yêu cầu kích thước tối thiểu.
- [RFC 791 - Internet Protocol (IP) Specification](https://datatracker.ietf.org/doc/html/rfc791) - Chuẩn đặc tả giao thức IP, cấu trúc IPv4 Header và định nghĩa trường Protocol phân kênh.
- [RFC 9293 - Transmission Control Protocol (TCP) Specification](https://datatracker.ietf.org/doc/html/rfc9293) - Đặc tả toàn diện về giao thức TCP, cấu trúc phân đoạn Segment và định danh cổng Port.
- [RFC 768 - User Datagram Protocol (UDP)](https://datatracker.ietf.org/doc/html/rfc768) - Chuẩn đặc tả giao thức UDP và cấu trúc 8-byte header cố định.
- [RFC 2464 - Transmission of IPv6 Packets over Ethernet Networks](https://datatracker.ietf.org/doc/html/rfc2464) - Chuẩn quy định mã EtherType `0x86DD` cho IPv6 trên mạng Ethernet.
- [RFC 1812 - Requirements for IP Version 4 Routers](https://datatracker.ietf.org/doc/html/rfc1812) - Đặc tả quy trình tiếp nhận, kiểm tra tính hợp lệ và giải đóng gói gói tin tại tầng mạng.
- [ITU-T Recommendation X.200 (ISO/IEC 7498-1) - Open Systems Interconnection Basic Reference Model](https://www.itu.int/rec/T-REC-X.200-199407-I/en) - Định nghĩa nền tảng quốc tế về các khái niệm PDU (Protocol Data Unit), SDU (Service Data Unit) và PCI (Protocol Control Information).
- [tcpdump(1) Linux Manual Page](https://www.tcpdump.org/manpages/tcpdump.1.html) - Hướng dẫn chính thức cú pháp lệnh `tcpdump` và các cờ tham số phân tích khung tin mạng.
