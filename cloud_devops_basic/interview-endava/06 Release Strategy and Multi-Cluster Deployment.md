# 06. Release Strategy & Multi-Cluster Deployment

> Câu hỏi viết bằng tiếng Anh (như khi phỏng vấn), đáp án viết bằng tiếng Việt.

---

### 1. Explain the difference between Continuous Integration, Continuous Delivery and Continuous Deployment.
<details><summary>Đáp án</summary>

- **Continuous Integration**: dev merge vào nhánh chính thường xuyên. Mỗi lần merge đều được build và test tự động, phát hiện lỗi tích hợp sớm.
- **Continuous Delivery**: mọi thay đổi qua pipeline đều **sẵn sàng để release**. Việc đưa lên production vẫn có bước quyết định của con người.
- **Continuous Deployment**: thay đổi qua hết các bước kiểm tra sẽ **tự động lên production**, không cần người bấm.
</details>

### 2. What does "build once, deploy many" mean and why is it important?
<details><summary>Đáp án</summary>

Chỉ build **một artifact** (image, nhận diện bằng digest) duy nhất, rồi **đẩy chính artifact đó** qua dev, staging, prod. Mỗi môi trường chỉ khác **cấu hình** (values, ConfigMap, Secret). Lợi ích:
- Thứ được test ở staging **chính xác** là thứ lên prod.
- Không bị khác biệt do build lại (dependency đổi, base image đổi).
- Rollback nhanh vì artifact cũ vẫn còn.

Điều kiện: cấu hình phải được **tách ra khỏi image** (nguyên tắc 12-factor).
</details>

### 3. Why should image tags be immutable? How do you tag images?
<details><summary>Đáp án</summary>

Tag mutable (`latest`, `dev`, ghi đè `1.2`) khiến các node chạy những phiên bản khác nhau, rollback không chắc chắn, không truy ngược được commit. Nên:
- Tag theo **commit SHA** (`orders:3f2a1bc`) cho mọi build.
- Thêm tag **SemVer** (`orders:1.4.2`) khi release, không bao giờ ghi đè.
- Khi deploy có thể ghim theo **digest** (`orders@sha256:...`) để chắc chắn tuyệt đối.
- Bật chế độ tag bất biến ở registry nếu có hỗ trợ.
</details>

### 4. Compare Recreate, Rolling, Blue/Green and Canary deployments.
<details><summary>Đáp án</summary>

| Chiến lược | Cách làm | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **Recreate** | Tắt hết bản cũ rồi bật bản mới | Đơn giản, không có hai phiên bản chạy song song | Có downtime |
| **Rolling** | Thay dần từng Pod | Không downtime, mặc định của K8s | Hai phiên bản chạy song song; rollback cũng phải rolling |
| **Blue/Green** | Dựng đủ môi trường mới (green) song song, test xong thì **chuyển toàn bộ traffic** | Chuyển và rollback gần như tức thì | Tốn gấp đôi tài nguyên; DB dùng chung vẫn phải tương thích |
| **Canary** | Cho **một phần nhỏ traffic** (1%, 5%, 25%...) vào bản mới, theo dõi metric rồi tăng dần | Giới hạn phạm vi ảnh hưởng; dùng dữ liệu thật để quyết định | Phức tạp hơn, cần điều phối traffic và metric tốt |
</details>

### 5. How would you implement canary on Kubernetes?
<details><summary>Đáp án</summary>

- **Cách thủ công**: hai Deployment (`stable` và `canary`) có chung label mà Service chọn. Tỉ lệ traffic xấp xỉ tỉ lệ replica (ví dụ 9:1). Đơn giản nhưng không chính xác, và phụ thuộc số Pod.
- **Theo trọng số ở L7**: Gateway API `HTTPRoute` với `backendRefs` có `weight`, hoặc service mesh (Istio, Linkerd), hoặc ingress controller hỗ trợ canary.
- **Progressive delivery tự động**: **Argo Rollouts** hoặc **Flagger** tăng dần trọng số, tự **phân tích metric** (tỉ lệ lỗi, latency từ Prometheus) rồi promote hoặc tự rollback.
</details>

### 6. What metrics would you watch during a canary to decide promote or rollback?
<details><summary>Đáp án</summary>

- **Tỉ lệ lỗi** (5xx, exception) của canary so với stable.
- **Latency** p95/p99.
- **Saturation**: CPU, memory, restart, GC.
- **Metric nghiệp vụ**: đơn hàng thành công, consumer lag.
- So sánh **canary với baseline cùng thời điểm**, không so với số liệu hôm qua. Đặt ngưỡng và thời gian quan sát rõ ràng **trước khi** rollout.
</details>

### 7. What are feature flags and how do they relate to deployment strategies?
<details><summary>Đáp án</summary>

Feature flag **tách việc deploy code khỏi việc bật tính năng**. Code mới được deploy nhưng tính năng tắt, sau đó bật dần theo nhóm người dùng hoặc phần trăm, và tắt ngay khi có sự cố mà không cần redeploy. Kết hợp với trunk-based development để merge sớm mà không phát hành tính năng dở dang. Cần dọn dẹp flag cũ để tránh nợ kỹ thuật.
</details>

### 8. How do you handle database schema changes with zero-downtime rolling deployments?
<details><summary>Đáp án</summary>

Trong lúc rolling, **bản cũ và bản mới cùng chạy** trên một DB. Vì vậy thay đổi schema phải **tương thích ngược**, theo mẫu **expand/contract** (parallel change):
1. **Expand**: thêm cột hoặc bảng mới (nullable), code mới ghi cả hai nơi.
2. Migrate dữ liệu.
3. Chuyển hoàn toàn việc đọc sang cấu trúc mới.
4. **Contract**: ở một lần release **sau**, khi không còn bản cũ, mới xóa cột cũ.

Migration chạy bằng Job hoặc Helm hook `pre-upgrade`, hoặc bằng Flyway/Liquibase khi app khởi động (cẩn thận khi có nhiều replica chạy cùng lúc).
</details>

### 9. How do you handle backward compatibility of Kafka messages between microservice versions?
<details><summary>Đáp án</summary>

- Producer và consumer được deploy **độc lập**, nên message phải tương thích **hai chiều** trong giai đoạn chuyển tiếp.
- Chỉ thêm field tùy chọn có giá trị mặc định. Không đổi kiểu dữ liệu, không xóa field bắt buộc.
- Dùng schema có quy tắc tương thích (Avro hoặc Protobuf + Schema Registry với chế độ `BACKWARD`/`FORWARD`/`FULL`). Lưu ý Schema Registry là sản phẩm của Confluent hoặc bên thứ ba, không thuộc Apache Kafka.
- Với thay đổi lớn: tạo **topic mới** hoặc trường version, chạy song song rồi chuyển dần.
- Thứ tự deploy: thường deploy **consumer trước** (hiểu được định dạng mới), rồi mới tới producer.
</details>

### 10. In what order would you deploy dependent microservices? What if service A's new version requires service B's new API?
<details><summary>Đáp án</summary>

- Mục tiêu là **không cần thứ tự**: mỗi service tương thích ngược để deploy độc lập được (API có version, thêm field chứ không phá vỡ hợp đồng).
- Nếu bắt buộc: deploy **bên cung cấp (B)** trước với API mới, **vẫn giữ API cũ**. Sau đó deploy A. Khi không còn ai dùng API cũ thì gỡ đi.
- Dùng **contract test** để phát hiện thay đổi phá vỡ trước khi deploy.
- Nếu phải deploy "khóa cứng" nhiều service cùng lúc thì đó là dấu hiệu **monolith phân tán**, cần xem lại ranh giới service.
</details>

### 11. How would you automate deployments to multiple Kubernetes clusters (dev, staging, several prod regions)?
<details><summary>Đáp án</summary>

- **Một chart, nhiều file values** theo môi trường và cluster (`values-prod-eu.yaml`).
- Mỗi cluster có **credential hoặc agent riêng** và **environment riêng** trong GitLab (protected, có approval cho prod).
- Pipeline promote theo **đợt**: dev → staging (E2E) → prod cluster canary → các prod cluster còn lại. Mỗi đợt có smoke test và **cổng dựa trên metric**.
- `resource_group` cho từng cluster.
- Hoặc **GitOps**: CI cập nhật repo cấu hình. Flux/Argo CD (ví dụ `ApplicationSet` sinh ứng dụng cho nhiều cluster) tự đồng bộ. Promote = merge thay đổi tag sang thư mục hoặc nhánh của môi trường tiếp theo.
</details>

### 12. What is GitOps? What are its principles?
<details><summary>Đáp án</summary>

Bốn nguyên tắc theo OpenGitOps:
1. **Declarative**: trạng thái mong muốn được mô tả theo kiểu khai báo.
2. **Versioned and immutable**: lưu trong Git, có lịch sử.
3. **Pulled automatically**: agent trong cluster tự kéo về.
4. **Continuously reconciled**: liên tục so sánh và sửa drift.

Công cụ: **Flux**, **Argo CD**. Rollback = `git revert`.
</details>

### 13. What is configuration drift and how do you detect and prevent it?
<details><summary>Đáp án</summary>

Drift là khi trạng thái thực tế khác với cấu hình trong Git (do ai đó `kubectl edit`, hotfix tay). Cách phát hiện: `kubectl diff`, `helm diff`, hoặc GitOps controller báo `OutOfSync`. Cách ngăn:
- Hạn chế quyền ghi trực tiếp vào cluster prod (RBAC).
- Mọi thay đổi đi qua Git và pipeline.
- GitOps có bật self-heal.
</details>

### 14. Describe a good rollback strategy for microservices on Kubernetes.
<details><summary>Đáp án</summary>

- **Ưu tiên khôi phục dịch vụ**: rollback trước, điều tra sau.
- Có sẵn cơ chế: `helm rollback` hoặc chạy lại job deploy của phiên bản trước trong GitLab, hoặc `git revert` với GitOps.
- **Tự động**: `--rollback-on-failure`/`--atomic` khi Pod không lên. Progressive delivery tự rollback khi metric xấu.
- **Rollback được thì DB phải tương thích** (expand/contract). Migration phá hủy thì không quay lại được.
- Message Kafka đã được produce theo định dạng mới thì không thu hồi được, nên consumer cũ phải đọc được hoặc bỏ qua an toàn.
- Luyện rollback định kỳ, đừng để lần đầu tiên rollback là lúc đang có sự cố.
</details>

### 15. Roll forward vs roll back: when would you choose roll forward?
<details><summary>Đáp án</summary>

- **Roll back** khi bản cũ còn tương thích và lỗi nghiêm trọng. Đây là cách nhanh và an toàn nhất trong đa số trường hợp.
- **Roll forward** (vá rồi deploy bản mới hơn) khi:
  - Không rollback được: migration DB không đảo ngược được, định dạng dữ liệu đã thay đổi.
  - Lỗi rất nhỏ, sửa nhanh hơn rollback.
  - Bản cũ cũng có lỗi bảo mật.
- Roll forward đòi hỏi pipeline nhanh và tin cậy.
</details>

### 16. Trunk-based development vs GitFlow: which fits continuous delivery better?
<details><summary>Đáp án</summary>

- **Trunk-based**: nhánh ngắn hạn (vài giờ đến 1–2 ngày), merge vào `main` thường xuyên, dùng feature flag. Hợp với CI/CD và deploy thường xuyên.
- **GitFlow**: các nhánh `develop`, `release`, `hotfix` sống lâu. Hợp với phần mềm phát hành theo đợt hoặc hỗ trợ nhiều phiên bản song song, nhưng merge phức tạp và tích hợp chậm.
- Với microservices trên K8s và CD, trunk-based thường phù hợp hơn.
</details>

### 17. What are the DORA metrics?
<details><summary>Đáp án</summary>

Bốn chỉ số cổ điển:
- **Deployment frequency**: tần suất deploy.
- **Lead time for changes**: thời gian từ commit tới production.
- **Change failure rate**: tỉ lệ deploy gây sự cố.
- **Time to restore service**: thời gian khôi phục. Các báo cáo DORA gần đây gọi là *failed deployment recovery time*.

Hai chỉ số đầu đo **tốc độ**, hai chỉ số sau đo **độ ổn định**. Nghiên cứu của DORA cho thấy hai mặt này không đánh đổi nhau. Định nghĩa đã được tinh chỉnh qua các năm, nên đối chiếu dora.dev.
</details>

### 18. How do you make a deployment pipeline safe for production?
<details><summary>Đáp án</summary>

- Artifact bất biến, được ký. Quét bảo mật là **cổng chặn**.
- Promote qua các môi trường, có test tự động ở mỗi bước.
- Phê duyệt và protected environment. Deploy freeze vào giờ nhạy cảm.
- `resource_group` (không deploy chồng lên nhau).
- `--wait`, smoke test, quan sát metric sau deploy, rollback tự động.
- Rollout từng phần (canary, theo đợt cluster).
- Audit: ai deploy, deploy gì, khi nào (lịch sử environment trong GitLab).
- Credential ngắn hạn, quyền tối thiểu.
</details>

### 19. What is a smoke test and where does it fit in the pipeline?
<details><summary>Đáp án</summary>

Smoke test là bộ kiểm tra **nhanh, nông** ngay sau deploy để xác nhận hệ thống "sống": health endpoint, một vài API chính, kết nối được DB và Kafka. Chạy sau mỗi lần deploy (`helm test`, hoặc job `curl` trong pipeline). Fail thì rollback ngay. Smoke test không thay thế E2E.
</details>

### 20. What is a release strategy for a platform composed of many open-source components (Kafka, Cassandra, Elasticsearch)?
<details><summary>Đáp án</summary>

- **Ghim phiên bản** chart và image của từng thành phần. Nâng cấp có kế hoạch, đọc release notes và tài liệu upgrade (rolling upgrade, tương thích protocol hoặc định dạng dữ liệu).
- Kiểm tra tổ hợp phiên bản (bản nền tảng gồm tất cả các thành phần) ở môi trường thử trước.
- Thành phần có trạng thái: rolling **từng node một**, chờ cluster khỏe lại hẳn (Kafka không còn under-replicated, Cassandra mọi node `UN`, Elasticsearch `green`) rồi mới sang node tiếp theo. Dùng Operator nếu có.
- Backup hoặc snapshot trước khi nâng cấp. Có kế hoạch quay lại.
</details>

### 21. What is a deployment "environment promotion" and how would you implement it?
<details><summary>Đáp án</summary>

Promotion là đưa **cùng một phiên bản** đã qua kiểm tra ở môi trường trước sang môi trường kế tiếp. Có hai cách:
- **Push**: các job deploy nối tiếp trong cùng pipeline, dùng chung `image.tag=$CI_COMMIT_SHORT_SHA`, có job manual hoặc phê duyệt trước prod.
- **GitOps**: MR thay đổi tag trong `envs/staging/values.yaml` → `envs/prod/values.yaml`. Merge chính là quyết định promote, có review và lịch sử.
</details>

### 22. How do you deal with secrets and configuration that differ between clusters?
<details><summary>Đáp án</summary>

- Cấu hình không nhạy cảm: file values theo cluster, lưu trong Git.
- Secret: không lưu trong Git ở dạng rõ. Dùng **External Secrets Operator** kéo từ Vault hoặc cloud secret manager theo từng cluster, hoặc **SOPS / Sealed Secrets** (mã hóa, lưu được trong Git).
- Cùng tên key ở mọi môi trường, chỉ khác nguồn giá trị.
</details>

### 23. What does "shift-left" mean in a CI/CD context?
<details><summary>Đáp án</summary>

Đưa việc kiểm tra (test, bảo mật, chất lượng, kiểm tra hợp đồng API) về **sớm hơn** trong vòng đời: chạy ở MR, thậm chí ở máy dev (pre-commit), thay vì chỉ phát hiện ở staging hoặc prod. Lỗi phát hiện càng sớm thì càng rẻ và càng dễ sửa.
</details>

### 24. How do you release a hotfix while main contains unreleased changes?
<details><summary>Đáp án</summary>

- Với trunk-based + feature flag: các thay đổi chưa phát hành đang bị tắt bằng flag, nên **sửa trên main rồi deploy bình thường**.
- Nếu không: tạo nhánh từ **tag đang chạy trên prod** (`v1.4.2`), sửa, tag `v1.4.3`, build và deploy. Sau đó **đưa bản sửa về main** (cherry-pick hoặc merge) để không bị mất ở lần release sau.
</details>

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [Kubernetes Deployments: strategy](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#strategy): Recreate và RollingUpdate.
- [Gateway API: HTTP traffic splitting](https://gateway-api.sigs.k8s.io/guides/traffic-splitting/): chia traffic theo trọng số cho canary.
- [Argo Rollouts](https://argo-rollouts.readthedocs.io/en/stable/): canary và blue/green có phân tích metric.
- [Flux documentation](https://fluxcd.io/flux/): GitOps với Flux.
- [OpenGitOps Principles](https://opengitops.dev/): bốn nguyên tắc GitOps.
- [GitLab Environments and deployments](https://docs.gitlab.com/ci/environments/): lịch sử deploy và rollback.
- [DORA metrics (dora.dev)](https://dora.dev/guides/dora-metrics-four-keys/): định nghĩa các chỉ số DORA.
- [The Twelve-Factor App: Config](https://12factor.net/config): tách cấu hình khỏi code.
- [Martin Fowler: Parallel Change](https://martinfowler.com/bliki/ParallelChange.html) *(Tier 3, minh họa mẫu expand/contract)*.
