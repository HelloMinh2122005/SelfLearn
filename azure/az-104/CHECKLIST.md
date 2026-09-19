# 📋 Official Study Guide & Checklist: Exam AZ-104 (Microsoft Azure Administrator)

> **Cập nhật chính thức theo đề cương Microsoft Learn (Áp dụng từ ngày 17/04/2026)**  
> **Cấp độ**: Associate | **Thời gian thi**: 100 phút | **Điểm đạt chuẩn**: 700 / 1000  
> **Chứng chỉ nhận được**: [Microsoft Certified: Azure Administrator Associate](https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/)

---

## 📊 Bảng Theo Dõi Tiến Độ Toàn Bộ 5 Miền Kỹ Năng (82 Mục Đo Lường)

| Miền kỹ năng (Domain) | Trọng số đề thi | Số mục kỹ năng | Tiến độ hoàn thành |
| :--- | :---: | :---: | :---: |
| **Domain 1**: Manage Azure identities and governance | **20–25%** | 15 mục | `[ ] 0 / 15` |
| **Domain 2**: Implement and manage storage | **15–20%** | 17 mục | `[ ] 0 / 17` |
| **Domain 3**: Deploy and manage Azure compute resources | **20–25%** | 24 mục | `[ ] 0 / 24` |
| **Domain 4**: Implement and manage virtual networking | **15–20%** | 13 mục | `[ ] 0 / 13` |
| **Domain 5**: Monitor and maintain Azure resources | **10–15%** | 13 mục | `[ ] 0 / 13` |
| **TỔNG CỘNG** | **100%** | **82 mục** | **`0%`** |

---

## 🔗 Chuỗi 6 Learning Paths Chính Thức Trên Microsoft Learn

1. 🧭 [AZ-104: Prerequisites for Azure administrators](https://learn.microsoft.com/en-us/training/paths/az-104-prerequisites/) *(Khóa học nền tảng kiến trúc, CLI & PowerShell)*
2. 🔑 [AZ-104: Manage identities and governance in Azure](https://learn.microsoft.com/en-us/training/paths/az-104-manage-identities-governance/)
3. 💾 [AZ-104: Implement and manage storage in Azure](https://learn.microsoft.com/en-us/training/paths/az-104-implement-manage-storage/)
4. ⚙️ [AZ-104: Deploy and manage Azure compute resources](https://learn.microsoft.com/en-us/training/paths/az-104-deploy-manage-compute-resources/)
5. 🌐 [AZ-104: Configure and manage virtual networks for Azure administrators](https://learn.microsoft.com/en-us/training/paths/az-104-configure-manage-virtual-networks/)
6. 📈 [AZ-104: Monitor and back up Azure resources](https://learn.microsoft.com/en-us/training/paths/az-104-monitor-back-up-resources/)

---

## 🎯 Chi Tiết 1:1 Toàn Bộ 82 Tiêu Chí Đo Lường (Skills Measured)

---

### Domain 1: Manage Azure identities and governance (20–25%)

#### 1.1 Manage Microsoft Entra users and groups
- [ ] **Create users and groups**: Tạo tài khoản người dùng nội bộ, nhóm bảo mật (Security groups) và nhóm cộng tác (Microsoft 365 groups).
- [ ] **Manage user and group properties**: Cập nhật thông tin profile, Job info, Contact info, cấu hình thành viên Assigned vs Dynamic user/device membership rules.
- [ ] **Manage licenses in Microsoft Entra ID**: Gán bản quyền trực tiếp cho user và quản lý phân bổ bản quyền tự động thông qua nhóm (Group-based licensing).
- [ ] **Manage external users**: Mời người dùng khách (Guest users), cấu hình Microsoft Entra B2B Collaboration và thiết lập giới hạn External collaboration.
- [ ] **Configure self-service password reset (SSPR)**: Thiết lập chính sách đặt lại mật khẩu tự phục vụ, cấu hình số lượng phương thức xác thực và kích hoạt Password writeback về on-premises AD.

#### 1.2 Manage access to Azure resources
- [ ] **Manage built-in Azure roles**: Nắm vững quyền hạn của các vai trò cốt lõi (`Owner`, `Contributor`, `Reader`, `User Access Administrator`) và các vai trò chuyên biệt (`Virtual Machine Contributor`, `Storage Blob Data Contributor`,...).
- [ ] **Assign roles at different scopes**: Thực hiện gán quyền RBAC chuẩn theo thứ bậc phạm vi: `Management group` $\rightarrow$ `Subscription` $\rightarrow$ `Resource group` $\rightarrow$ `Resource`.
- [ ] **Interpret access assignments**: Đọc hiểu bảng phân bổ quyền hiệu dụng (Effective Access), hiểu cơ chế kế thừa quyền từ cấp cha và nguyên tắc Deny Assignments luôn được ưu tiên cao nhất.

#### 1.3 Manage Azure subscriptions and governance
- [ ] **Implement and manage Azure Policy**: Tạo và gán định nghĩa chính sách (Policy definitions), nhóm chính sách (Initiative definitions / Policy Sets), hiểu rõ các hiệu ứng: `Audit`, `Deny`, `DeployIfNotExists`, `Modify`, `Disabled`.
- [ ] **Configure resource locks**: Thiết lập khóa tài nguyên cấp độ `ReadOnly` và `CanNotDelete`; hiểu rõ quyền hạn can thiệp và mức độ kế thừa xuống tài nguyên con.
- [ ] **Apply and manage tags on resources**: Đặt nhãn phân loại tài nguyên (phục vụ quản lý chi phí, phòng ban) và sử dụng Azure Policy để tự động kế thừa tag từ Resource Group xuống Resource.
- [ ] **Manage resource groups**: Tạo mới, xóa, gắn khóa và di chuyển tài nguyên giữa các Resource Group hoặc giữa các Subscriptions.
- [ ] **Manage subscriptions**: Quản lý hạn ngạch tài nguyên (Quotas), chuyển nhượng quyền sở hữu Subscription, cấu hình chi tiêu cho Subscription.
- [ ] **Manage costs by using alerts, budgets, and Azure Advisor recommendations**: Tạo ngân sách chi phí (Cost Budgets), thiết lập ngưỡng cảnh báo (Cost Alerts theo % ngân sách), tối ưu hóa chi tiêu theo khuyến nghị của Azure Advisor.
- [ ] **Configure management groups**: Thiết kế và tổ chức cây phân cấp Management Groups (tối đa 6 tầng sâu bên dưới Root Management Group) để quản trị chính sách và quyền truy cập tập trung.

---

### Domain 2: Implement and manage storage (15–20%)

#### 2.1 Configure access to storage
- [ ] **Configure Azure Storage firewalls and virtual networks**: Cấu hình tường lửa Storage, cho phép kết nối từ dải Public IP tĩnh, cấp quyền cho các dịch vụ Microsoft đáng tin cậy (Trusted Microsoft Services) và tích hợp Virtual Network.
- [ ] **Create and use shared access signature (SAS) tokens**: Phân biệt và tạo 3 loại SAS: `Account SAS`, `Service SAS`, `User Delegation SAS` (ký bằng Microsoft Entra ID - bảo mật nhất); cấu hình thời hạn hiệu lực, phạm vi quyền (Read, Write, List, Delete) và giới hạn IP.
- [ ] **Configure stored access policies**: Thiết lập chính sách truy cập lưu trữ trên Blob Container hoặc File Share để quản lý tập trung và thu hồi nhanh SAS token mà không cần đổi Access Key.
- [ ] **Manage access keys**: Quản lý cặp khóa truy cập chính và phụ (`Key1`, `Key2`), thực hiện quy trình luân chuyển khóa (Key Rotation) định kỳ không làm gián đoạn ứng dụng.
- [ ] **Configure identity-based access for Azure Files**: Cấu hình xác thực người dùng cho Azure Files thông qua Active Directory Domain Services (AD DS) hoặc Microsoft Entra Kerberos cho tài khoản Hybrid.

#### 2.2 Configure and manage storage accounts
- [ ] **Create and configure storage accounts**: Chọn đúng loại tài khoản lưu trữ: Standard General-purpose v2, Premium Block Blobs, Premium File Shares, cấu hình Secure Transfer Required (HTTPS), TLS version tối thiểu (TLS 1.2).
- [ ] **Configure Azure Storage redundancy**: Nắm vững cơ chế sao lưu dữ liệu:
  - LRS (Locally-redundant storage - 3 bản sao trong 1 datacenter).
  - ZRS (Zone-redundant storage - 3 Availability Zones trong 1 Region).
  - GRS / RA-GRS (Geo-redundant storage & Read-access GRS tới secondary region).
  - GZRS / RA-GZRS (Geo-zone-redundant storage & Read-access GZRS).
- [ ] **Configure object replication**: Thiết lập quy tắc sao chép tự động bất đồng bộ các khối block blob giữa container nguồn và container đích ở các Storage Account khác nhau.
- [ ] **Configure storage account encryption**: Cấu hình mã hóa dữ liệu tĩnh (Encryption at Rest) với khóa do Microsoft quản lý (Platform-Managed Keys - PMK) hoặc khóa do khách hàng tự quản lý (Customer-Managed Keys - CMK) lưu trong Azure Key Vault.
- [ ] **Manage data by using Azure Storage Explorer and AzCopy**: Sử dụng công cụ đồ họa Azure Storage Explorer và câu lệnh CLI `azcopy copy`, `azcopy sync` để di chuyển dữ liệu lớn.

#### 2.3 Configure Azure Files and Azure Blob Storage
- [ ] **Create and configure a file share in Azure Files**: Tạo Azure File Share, thiết lập dung lượng giới hạn (Quota), chọn giao thức truy cập SMB hoặc NFS.
- [ ] **Create and configure a container in Azure Blob Storage**: Khởi tạo container, cấu hình mức độ truy cập công khai (Public access level: Private, Blob, Container).
- [ ] **Configure storage tiers**: Thiết lập các tầng lưu trữ tối ưu chi phí: `Hot` (truy xuất thường xuyên), `Cool` (lưu trữ tối thiểu 30 ngày), `Cold` (lưu trữ tối thiểu 90 ngày), `Archive` (lưu trữ offline tối thiểu 180 ngày, độ trễ rehydrate vài giờ).
- [ ] **Configure soft delete for blobs and containers**: Bật tính năng xóa mềm (Soft delete) và đặt thời gian lưu giữ dữ liệu (Retention period tính theo số ngày) để phòng tránh xóa nhầm dữ liệu.
- [ ] **Configure snapshots and soft delete for Azure Files**: Tạo bản chụp nhanh (Share Snapshots) và bật tính năng Soft Delete cho Azure File Share.
- [ ] **Configure blob lifecycle management**: Viết quy tắc tự động hóa vòng đời dữ liệu (chuyển tầng Hot sang Cool/Cold/Archive hoặc xóa tự động sau số ngày xác định từ ngày chỉnh sửa hoặc ngày tạo).
- [ ] **Configure blob versioning**: Kích hoạt quản lý phiên bản Blob để tự động lưu lại trạng thái trước đó của blob khi có thao tác ghi đè hoặc sửa đổi.

---

### Domain 3: Deploy and manage Azure compute resources (20–25%)

#### 3.1 Automate deployment of resources by using Azure Resource Manager (ARM) templates or Bicep files
- [ ] **Interpret an Azure Resource Manager template or a Bicep file**: Đọc hiểu cấu trúc thành phần của file ARM JSON (`schema`, `parameters`, `variables`, `resources`, `outputs`) và cú pháp Bicep tương đương.
- [ ] **Modify an existing Azure Resource Manager template**: Chỉnh sửa các giá trị tham số, biến số và định nghĩa tài nguyên trong ARM template JSON có sẵn.
- [ ] **Modify an existing Bicep file**: Chỉnh sửa khai báo tài nguyên, quan hệ phụ thuộc (`dependsOn`), và các modules trong file Bicep.
- [ ] **Deploy resources by using an Azure Resource Manager template or a Bicep file**: Thực thi triển khai template qua cổng Azure Portal, Azure CLI (`az deployment group create`) hoặc Azure PowerShell (`New-AzResourceGroupDeployment`).
- [ ] **Export a deployment as an Azure Resource Manager template or convert an Azure Resource Manager template to a Bicep file**: Xuất cấu hình Resource Group thành file ARM template và dịch ngược ARM JSON thành Bicep qua lệnh `az bicep decompile`.

#### 3.2 Create and configure virtual machines
- [ ] **Create a virtual machine**: Khởi tạo Azure VM (chọn OS image, VM size, Authentication type: SSH Key vs Password, mạng VNet/Subnet).
- [ ] **Configure encryption at host for Azure virtual machines**: Bật tính năng mã hóa toàn bộ dữ liệu tạm (Temp disk) và các file cache trên chính máy chủ vật lý lưu trữ VM.
- [ ] **Move a virtual machine to another resource group, subscription, or region**: Di chuyển máy ảo và card mạng/đĩa đi kèm sang Resource Group khác, Subscription khác hoặc dùng Azure Resource Mover để chuyển Region.
- [ ] **Manage virtual machine sizes**: Thay đổi cấu hình phần cứng (Resize VM) và nhận biết tác động (yêu cầu VM reboot).
- [ ] **Manage virtual machine disks**: Gắn thêm Data Disk mới, mở rộng kích thước đĩa (Expand disk - yêu cầu deallocate VM nếu đĩa đang chạy) và thiết lập Host Caching (None, Read-only, Read-write).
- [ ] **Deploy virtual machines to availability zones and availability sets**: Phân bổ máy ảo vào Availability Zones (chống lỗi cấp Data center) hoặc Availability Sets (cấu hình Fault Domains và Update Domains).
- [ ] **Deploy and configure an Azure Virtual Machine Scale Sets**: Khởi tạo VMSS, chọn chế độ điều phối Flexible hoặc Uniform, cấu hình cơ chế tự động mở rộng/thu hẹp instance (Autoscale rules dựa theo CPU/RAM hoặc lịch trình).

#### 3.3 Provision and manage containers in the Azure portal
- [ ] **Create and manage an Azure Container Registry**: Tạo ACR (Basic, Standard, Premium), kích hoạt Admin User, quản lý repository và phân quyền truy cập ACR qua Entra ID.
- [ ] **Provision a container by using Azure Container Instances**: Khởi tạo container đơn lẻ nhanh chóng với ACI: cấu hình Restart Policy (Always, OnFailure, Never), Environment Variables, gán Volume mount từ Azure File Share.
- [ ] **Provision a container by using Azure Container Apps**: Khởi tạo containerized microservices với Azure Container Apps: cấu hình Container App Environment, Ingress (HTTP traffic từ ngoài hoặc nội bộ), Secrets và Revisions.
- [ ] **Manage sizing and scaling for containers, including Azure Container Instances and Azure Container Apps**: Cấu hình số lõi CPU, dung lượng RAM cho ACI; thiết lập quy tắc tự động co giãn theo số lượng HTTP request hoặc Event-driven (KEDA) cho Azure Container Apps.

#### 3.4 Create and configure Azure App Service
- [ ] **Provision an App Service plan**: Tạo App Service Plan, phân biệt rõ các gói tính năng và tài nguyên giữa Free/Shared, Basic, Standard, Premium và Isolated.
- [ ] **Configure scaling for an App Service plan**: Cấu hình Scale-up (nâng hạng phần cứng) và Scale-out (tăng số lượng instances theo CPU percentage hoặc Memory percentage).
- [ ] **Create an App Service**: Tạo Web App trên nền tảng Windows/Linux với các Runtime stack (Node.js, .NET, Java, Python).
- [ ] **Configure certificates and Transport Layer Security (TLS) for an App Service**: Thiết lập phiên bản TLS tối thiểu (TLS 1.2), tạo và gán miễn phí chứng chỉ App Service Managed Certificate, hoặc tải lên Custom PFX Certificate.
- [ ] **Map an existing custom DNS name to an App Service**: Cấu hình Custom Domain, tạo bản ghi `CNAME` hoặc bản ghi `A` kèm bản ghi xác minh quyền sở hữu `TXT` (asuid).
- [ ] **Configure backup for an App Service**: Thiết lập lịch tự động sao lưu Web App và cơ sở dữ liệu liên quan vào Storage Account (yêu cầu gói Standard trở lên).
- [ ] **Configure networking settings for an App Service**: Cấu hình VNet Integration để gọi tài nguyên trong mạng nội bộ và cấu hình Access Restrictions / Private Endpoints để giới hạn truy cập vào Web App.
- [ ] **Configure deployment slots for an App Service**: Tạo các môi trường triển khai (ví dụ `staging`), thực hiện tính năng hoán đổi môi trường (**Swap Slots**) không gây gián đoạn dịch vụ và cấu hình Slot Settings.

---

### Domain 4: Implement and manage virtual networking (15–20%)

#### 4.1 Configure and manage virtual networks in Azure
- [ ] **Create and configure virtual networks and subnets**: Thiết lập mạng ảo VNet, quy hoạch dải địa chỉ IPv4 CIDR, phân chia Subnets (ghi nhớ: Azure bảo lưu 5 địa chỉ IP trong mỗi subnet).
- [ ] **Create and configure virtual network peering**: Thiết lập kết nối Peering giữa 2 VNet trong cùng Region (Regional Peering) hoặc khác Region (Global Peering); cấu hình Allow Forwarded Traffic và Gateway Transit.
- [ ] **Configure public IP addresses**: Tạo địa chỉ Public IP (SKU Standard vs Basic, chế độ gán tĩnh Static vs động Dynamic).
- [ ] **Configure user-defined routes**: Tạo bảng định tuyến tùy chỉnh (Route Tables) và các tuyến đường UDR, chỉ định loại Next Hop (`VirtualAppliance`, `VirtualNetworkGateway`, `VnetLocal`, `Internet`, `None`).
- [ ] **Troubleshoot network connectivity**: Chẩn đoán nguyên nhân mất kết nối do xung đột dải IP, sai bảng định tuyến hoặc luật chặn tường lửa.

#### 4.2 Configure secure access to virtual networks
- [ ] **Create and configure network security groups (NSGs) and application security groups**: Tạo NSG, hiểu thứ tự ưu tiên luật (Priority 100 - 4096), nắm vững các Default Rules; tạo Application Security Groups (ASGs) để nhóm các máy ảo cùng chức năng logic.
- [ ] **Evaluate effective security rules in NSGs**: Sử dụng công cụ chẩn đoán Effective Security Rules để tính toán luật ưu tiên thực tế áp dụng lên card mạng NIC của máy ảo.
- [ ] **Implement Azure Bastion**: Triển khai Azure Bastion trên subnet chuyên dụng `AzureBastionSubnet` để quản trị an toàn máy ảo qua RDP/SSH bằng giao thức HTTPS trên trình duyệt mà không cần Public IP trên máy ảo.
- [ ] **Configure service endpoints for Azure platform as a service (PaaS)**: Bật Service Endpoints trên subnet để định tuyến lưu lượng trực tiếp qua hạ tầng mạng riêng của Microsoft tới dịch vụ PaaS (Storage, SQL,...).
- [ ] **Configure private endpoints for Azure PaaS**: Triển khai Azure Private Link / Private Endpoint để cấp phát một Private IP cục bộ từ Subnet cho dịch vụ PaaS, vô hiệu hóa hoàn toàn truy cập public.

#### 4.3 Configure name resolution and load balancing
- [ ] **Configure Azure DNS**: Quản lý bản ghi DNS công khai trên Azure Public DNS Zones và thiết lập Azure Private DNS Zones liên kết với các VNets kèm tính năng tự động đăng ký tên máy ảo (Auto-registration).
- [ ] **Configure an internal or public load balancer**: Triển khai Azure Load Balancer (Layer 4): thiết lập Frontend IP (Public hoặc Private), cấu hình Backend Pools, Health Probes (TCP/HTTP/HTTPS) và Load Balancing Rules.
- [ ] **Troubleshoot load balancing**: Khắc phục sự cố khi backend pool báo trạng thái Unhealthy hoặc khi máy khách không kết nối được qua các cổng cân bằng tải.

---

### Domain 5: Monitor and maintain Azure resources (10–15%)

#### 5.1 Monitor resources in Azure
- [ ] **Interpret metrics in Azure Monitor**: Khai thác biểu đồ Metrics Explorer, theo dõi mức độ tải CPU, Memory, Disk I/O, Network Throughput theo thời gian thực.
- [ ] **Configure log settings in Azure Monitor**: Cấu hình Diagnostic Settings để truyền tải Resource Logs và Metrics tới Log Analytics Workspace, Event Hub hoặc Storage Account.
- [ ] **Query and analyze logs in Azure Monitor**: Viết các câu lệnh truy vấn log bằng ngôn ngữ Kusto Query Language (KQL) trên Log Analytics (các toán tử cơ bản: `where`, `summarize`, `project`, `render`).
- [ ] **Set up alert rules, action groups, and alert processing rules in Azure Monitor**: Tạo quy tắc cảnh báo (Alert Rules dựa trên Metric hoặc Log query), gắn nhóm hành động (Action Groups - Email, SMS, Webhook, Automation Runbook) và tạo Alert Processing Rules để tắt cảnh báo khi bảo trì hệ thống.
- [ ] **Configure and interpret monitoring of virtual machines, storage accounts, and networks by using Azure Monitor Insights**: Kích hoạt và theo dõi chuyên sâu qua VM Insights (Map dependency, hiệu năng máy ảo), Storage Insights và Network Insights.
- [ ] **Use Azure Network Watcher and Connection monitor**: Sử dụng bộ công cụ Network Watcher:
  - *IP Flow Verify*: Kiểm tra gói tin có bị chặn bởi NSG hay không.
  - *Next Hop*: Kiểm tra gói tin mạng được định tuyến đi đâu.
  - *Connection Monitor*: Giám sát độ trễ và khả năng tiếp cận giữa nguồn và đích.
  - *Packet Capture*: Ghi lại luồng gói tin thực tế trên VM để phân tích wireshark.

#### 5.2 Implement backup and recovery
- [ ] **Create a Recovery Services vault**: Tạo Recovery Services vault để bảo vệ máy ảo Azure VM, SQL Server in Azure VM và quản lý Azure Site Recovery.
- [ ] **Create an Azure Backup vault**: Tạo Azure Backup vault để bảo vệ dữ liệu đám mây mới: Azure Blobs, Azure Disks, Azure PostgreSQL Flexible Server.
- [ ] **Create and configure a backup policy**: Thiết lập chính sách sao lưu định kỳ: thời gian chạy backup, số ngày lưu giữ bản sao (Daily, Weekly, Monthly, Yearly retention), và cơ chế Instant Restore.
- [ ] **Perform backup and restore operations by using Azure Backup**: Kích hoạt sao lưu tức thì (Backup now), thực hiện khôi phục máy ảo (Create VM mới, Restore Disks, hoặc khôi phục từng tệp tin qua File Recovery).
- [ ] **Configure Azure Site Recovery for Azure resources**: Cấu hình sao chép máy ảo (Replication) giữa hai vùng Azure, chọn Target Region, VNet đích, Cache Storage Account và Recovery Plan.
- [ ] **Perform a failover to a secondary region by using Site Recovery**: Thực hiện diễn tập phục hồi thảm họa không ảnh hưởng sản xuất (**Test Failover**), và thực hiện chuyển vùng chính thức (**Planned / Unplanned Failover**) kèm thao tác Failback.
- [ ] **Configure and interpret reports and alerts for backups**: Tích hợp dữ liệu vào Log Analytics để xem báo cáo Backup Reports và theo dõi cảnh báo sự cố sao lưu thông qua Azure Monitor Alerts.

---

## 🛠️ Danh Sách 10 Bài Lab Cần Tự Tay Thực Hành (Hands-on Labs)

- [ ] **Lab 01**: Tạo User/Group trong Entra ID, cấu hình Dynamic Group và gán quyền RBAC `Virtual Machine Contributor` tại scope Resource Group.
- [ ] **Lab 02**: Tạo Azure Policy cấm tạo VM kích thước lớn (ví dụ chỉ cho phép dòng B-series) và kiểm chứng khi tạo VM vi phạm policy.
- [ ] **Lab 03**: Tạo Storage Account, cấu hình Blob Lifecycle Management tự động chuyển blob sau 30 ngày sang Cool Tier và sau 90 ngày sang Archive.
- [ ] **Lab 04**: Cấu hình Shared Access Signature (SAS) có thời hạn 30 phút, giới hạn IP truy cập và dùng `AzCopy` để đồng bộ dữ liệu.
- [ ] **Lab 05**: Triển khai một máy ảo Windows/Linux bằng file Bicep từ terminal bằng `az deployment group create`.
- [ ] **Lab 06**: Tạo Virtual Machine Scale Set (VMSS), cấu hình quy tắc Auto-scale tăng thêm 1 instance khi CPU vượt quá 75% trong 5 phút.
- [ ] **Lab 07**: Triển khai Azure Container Apps chạy một image web tĩnh, cấu hình Revisions và Ingress công khai.
- [ ] **Lab 08**: Tạo 2 VNet ở 2 Region khác nhau, thiết lập Global VNet Peering và kiểm tra kết nối ping/curl giữa 2 máy ảo nội bộ.
- [ ] **Lab 09**: Tạo Public Load Balancer cân bằng tải traffic HTTP cho 2 VMs thuộc Backend Pool và kiểm tra Health Probe.
- [ ] **Lab 10**: Tạo Recovery Services Vault, bật Backup cho 1 Azure VM và thực hành tính năng File Recovery để lấy lại 1 file bị xóa.

---

## 🚀 Công Cụ Ôn Thi & Đánh Giá Năng Lực Trực Tiếp Của Microsoft

- [ ] **Đề thi thử chính thức (Free Practice Assessment)**: Làm bài test 50 câu tại [AZ-104 Official Practice Assessment](https://learn.microsoft.com/en-us/credentials/certifications/exams/az-104/practice/assessment?assessment-type=practice&assessmentId=21&practice-assessment-type=certification) (đạt liên tục >85% trước khi thi thật).
- [ ] **Trải nghiệm giao diện thi thật (Exam Sandbox)**: Khám phá các dạng câu hỏi kéo thả, drop-down, case study tại [Microsoft Exam Sandbox](https://go.microsoft.com/fwlink/?linkid=2226877).
- [ ] **Video chiến thuật làm bài**: Xem video hướng dẫn từ chuyên gia Microsoft tại [Exam AZ-104 Prep Videos (Exam Readiness Zone)](https://aka.ms/AZ104-ExamPrep).

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)

- [Study guide for Exam AZ-104: Microsoft Azure Administrator](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104) - Đề cương kỹ năng đo lường chính thức chi tiết nhất từ Microsoft Learn.
- [Exam AZ-104: Microsoft Azure Administrator Overview](https://learn.microsoft.com/en-us/credentials/certifications/exams/az-104/) - Trang tổng quan kỳ thi, đăng ký và tài liệu chuẩn bị.
- [AZ-104: Prerequisites for Azure administrators](https://learn.microsoft.com/en-us/training/paths/az-104-prerequisites/) - Khóa học nền tảng cho quản trị viên Azure.
- [AZ-104: Manage identities and governance in Azure](https://learn.microsoft.com/en-us/training/paths/az-104-manage-identities-governance/) - Tài liệu chính thức về Microsoft Entra ID, RBAC và Azure Policy.
- [AZ-104: Implement and manage storage in Azure](https://learn.microsoft.com/en-us/training/paths/az-104-implement-manage-storage/) - Tài liệu chính thức về Blob Storage, Azure Files và bảo mật lưu trữ.
- [AZ-104: Deploy and manage Azure compute resources](https://learn.microsoft.com/en-us/training/paths/az-104-deploy-manage-compute-resources/) - Tài liệu chính thức về VMs, Bicep, Container Instances, Container Apps và App Service.
- [AZ-104: Configure and manage virtual networks for Azure administrators](https://learn.microsoft.com/en-us/training/paths/az-104-configure-manage-virtual-networks/) - Tài liệu chính thức về VNet, Peering, NSG/ASG, Load Balancer và Bastion.
- [AZ-104: Monitor and back up Azure resources](https://learn.microsoft.com/en-us/training/paths/az-104-monitor-back-up-resources/) - Tài liệu chính thức về Azure Monitor, Network Watcher, Backup và Site Recovery.
