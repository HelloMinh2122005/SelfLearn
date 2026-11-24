# 05. GitLab CI/CD

> Câu hỏi viết bằng tiếng Anh (như khi phỏng vấn), đáp án viết bằng tiếng Việt.

---

### 1. Explain the basic building blocks of GitLab CI: pipeline, stage, job, runner.
<details><summary>Đáp án</summary>

- **Pipeline**: toàn bộ quy trình được kích hoạt bởi một sự kiện (push, MR, tag, lịch, API), định nghĩa trong `.gitlab-ci.yml`.
- **Stage**: nhóm job. Mặc định các stage chạy **tuần tự**, các job cùng stage chạy **song song**. Stage mặc định: `.pre`, `build`, `test`, `deploy`, `.post`.
- **Job**: đơn vị công việc có `script`, chạy trên runner.
- **Runner**: agent nhận job từ GitLab và thực thi bằng một **executor**.
</details>

### 2. What are GitLab Runner executors? Compare shell, docker and kubernetes.
<details><summary>Đáp án</summary>

- **shell**: chạy trực tiếp trên máy của runner. Đơn giản nhưng môi trường không sạch, các job ảnh hưởng lẫn nhau.
- **docker**: mỗi job chạy trong container từ `image:`. Môi trường sạch, tái lập được.
- **kubernetes**: mỗi job là **một Pod** trong cluster (container build, helper, services). Tự scale theo số job, rất hợp với nền tảng chạy trên K8s.
- Ngoài ra có `docker-autoscaler`, `instance`, `ssh`, `virtualbox`...
- Job chọn runner qua **`tags`**.
</details>

### 3. Artifacts vs cache: what's the difference?
<details><summary>Đáp án</summary>

| | Artifacts | Cache |
|---|---|---|
| Mục đích | **Kết quả** của job truyền cho job sau hoặc cho người dùng tải (jar, report) | **Tăng tốc** bằng cách tái dùng dependency (`.m2`, `node_modules`) |
| Đảm bảo | Có, được upload lên GitLab | **Best-effort**, có thể không có |
| Phạm vi | Trong pipeline, job sau tự tải về (điều chỉnh bằng `dependencies` hoặc `needs`) | Giữa các pipeline, theo `key` |
| Hết hạn | `expire_in` | Theo chính sách của runner hoặc storage |

Không dùng cache để truyền file build giữa các job, vì cache không chắc chắn có.
</details>

### 4. How do you cache Maven dependencies effectively?
<details><summary>Đáp án</summary>

```yaml
variables:
  MAVEN_OPTS: "-Dmaven.repo.local=$CI_PROJECT_DIR/.m2/repository"
cache:
  key:
    files: [pom.xml]
  paths: [.m2/repository]
```
Cache chỉ lưu được đường dẫn **bên trong thư mục project**, nên phải đổi `maven.repo.local`. Key theo `pom.xml` giúp cache tự làm mới khi dependency đổi.
</details>

### 5. Explain `needs` and the DAG. Why use it?
<details><summary>Đáp án</summary>

`needs` cho phép job chạy **ngay khi các job nó phụ thuộc xong**, không chờ cả stage trước hoàn tất. Pipeline trở thành **đồ thị có hướng không chu trình (DAG)**. Ví dụ: `test-service-a` chỉ cần `build-service-a`. `needs: []` cho job chạy ngay từ đầu. `needs` cũng quyết định job tải artifact của job nào. Kết quả là pipeline monorepo nhiều service nhanh hơn rõ rệt.
</details>

### 6. `rules` vs `only/except`. How are rules evaluated?
<details><summary>Đáp án</summary>

- `only/except` là cú pháp cũ, **không còn được phát triển**. Nên dùng `rules`.
- `rules` là **danh sách điều kiện được xét theo thứ tự, rule đầu tiên khớp sẽ thắng**. Mỗi rule có `if`, `changes`, `exists` và kết quả `when` (`on_success`, `manual`, `delayed`, `never`), `allow_failure`, `variables`.
- Không rule nào khớp thì job **không được thêm vào** pipeline.
```yaml
deploy-prod:
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/
      when: manual
    - when: never
```
</details>

### 7. What is `workflow:rules` and why do we need it?
<details><summary>Đáp án</summary>

`workflow:rules` quyết định **có tạo pipeline hay không** (áp dụng cho cả pipeline, không phải từng job). Ứng dụng phổ biến là tránh **pipeline trùng**: push lên nhánh đang có MR sẽ sinh cả branch pipeline lẫn MR pipeline.
```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH && $CI_OPEN_MERGE_REQUESTS
      when: never
    - if: $CI_COMMIT_BRANCH
    - if: $CI_COMMIT_TAG
```
</details>

### 8. How would you only run a service's pipeline jobs when that service's code changed (monorepo)?
<details><summary>Đáp án</summary>

```yaml
build-orders:
  rules:
    - changes:
        paths: [services/orders/**/*, libs/common/**/*]
```
Hoặc dùng **parent-child pipeline**: pipeline cha dùng `rules:changes` để `trigger` pipeline con của từng service. Lưu ý: với pipeline không có commit để so sánh (ví dụ pipeline đầu tiên của nhánh mới, pipeline theo lịch), `changes` có thể luôn đúng. Dùng `changes:compare_to` để chỉ định nhánh so sánh.
</details>

### 9. Name important predefined CI/CD variables.
<details><summary>Đáp án</summary>

- `CI_COMMIT_SHA`, `CI_COMMIT_SHORT_SHA`: hay dùng làm tag image.
- `CI_COMMIT_BRANCH`, `CI_COMMIT_TAG`, `CI_COMMIT_REF_NAME`, `CI_COMMIT_REF_SLUG` (dạng an toàn cho URL/DNS, dùng đặt tên namespace của review app).
- `CI_DEFAULT_BRANCH`, `CI_PIPELINE_SOURCE` (`push`, `merge_request_event`, `schedule`, `web`, `trigger`...).
- `CI_MERGE_REQUEST_IID`, `CI_PROJECT_DIR`, `CI_PIPELINE_ID`, `CI_JOB_ID`.
- `CI_REGISTRY`, `CI_REGISTRY_IMAGE`, `CI_REGISTRY_USER`, `CI_REGISTRY_PASSWORD`, `CI_JOB_TOKEN`.
- `CI_ENVIRONMENT_NAME`.
</details>

### 10. How do you handle secrets in GitLab CI?
<details><summary>Đáp án</summary>

- Lưu trong **CI/CD variables** của project hoặc group (không trong `.gitlab-ci.yml`), bật:
  - **Masked** (che trong log). Có tùy chọn "masked and hidden" để không xem lại được trên UI.
  - **Protected** (chỉ đưa vào job chạy trên **protected branch hoặc tag**).
- Kiểu **File** cho kubeconfig hoặc cert: biến chứa đường dẫn tới file tạm.
- Biến theo **environment scope** (`production` khác `staging`).
- Tốt hơn: lấy secret động từ **Vault** hoặc cloud secret manager bằng **OIDC `id_tokens`**, không lưu secret dài hạn trong GitLab.
- Không bật `CI_DEBUG_TRACE` trên job có secret, vì nó in ra tất cả biến.
- Masking không hoàn hảo: secret bị biến đổi (base64, cắt chuỗi) vẫn có thể lộ.
</details>

### 11. What are protected branches, protected tags and protected environments?
<details><summary>Đáp án</summary>

- **Protected branch/tag**: hạn chế ai được push hoặc merge, hoặc tạo tag. Chỉ pipeline trên ref này mới nhận được **protected variables**.
- **Protected environment**: hạn chế ai được chạy job deploy vào môi trường đó (ví dụ `production`), có thể yêu cầu **deployment approval**.
- Kết hợp lại để chỉ người hoặc nhánh được phép mới deploy được production.
</details>

### 12. Explain the `environment` keyword. What are review apps?
<details><summary>Đáp án</summary>

`environment:` gắn job deploy với một môi trường (`name`, `url`, `deployment_tier`, `on_stop`, `auto_stop_in`). GitLab ghi **lịch sử deployment**, cho phép rollback (chạy lại job deploy cũ) và hiển thị phiên bản đang chạy.

**Review apps**: môi trường động cho mỗi MR, ví dụ `name: review/$CI_COMMIT_REF_SLUG`, deploy vào namespace riêng. Job `on_stop` gỡ môi trường khi MR đóng, `auto_stop_in` tự dọn sau một khoảng thời gian.
</details>

### 13. What is `resource_group` and why is it important for deployments?
<details><summary>Đáp án</summary>

`resource_group: production` đảm bảo **chỉ một job** thuộc nhóm đó chạy tại một thời điểm, kể cả từ các pipeline khác nhau. Job khác phải xếp hàng chờ. Nhờ vậy tránh được việc **hai lần deploy chồng lên nhau** vào cùng cluster hoặc release (dẫn tới Helm `another operation in progress`, hoặc phiên bản cũ ghi đè phiên bản mới).
</details>

### 14. How do you prevent an older pipeline from deploying over a newer one?
<details><summary>Đáp án</summary>

- `resource_group` để tuần tự hóa.
- Bật cài đặt **"Prevent outdated deployment jobs"** của project: GitLab chặn job deploy cũ hơn deployment gần nhất.
- `interruptible: true` cho các job build/test để pipeline cũ tự hủy khi có commit mới. **Không** đặt cho job deploy.
</details>

### 15. Explain `extends`, YAML anchors, `!reference` and `include`.
<details><summary>Đáp án</summary>

- `extends: .base-job`: kế thừa cấu hình từ job ẩn (tên bắt đầu bằng `.`), merge sâu. Hoạt động được qua các file `include`.
- **Anchors** (`&x`, `<<: *x`): tính năng của YAML, **chỉ trong cùng một file**.
- `!reference [.setup, script]`: tái dùng **một phần** (ví dụ chỉ phần `script`) của job khác.
- `include`: nạp cấu hình từ `local` (file trong repo), `project` (repo khác), `remote` (URL), `template` (template của GitLab), `component` (CI/CD component).
- Dùng các cơ chế này để chuẩn hóa pipeline cho hàng chục microservice.
</details>

### 16. What are CI/CD components and the CI/CD Catalog?
<details><summary>Đáp án</summary>

**Component** là một khối cấu hình pipeline tái sử dụng, **có version** và **tham số `inputs`** khai báo kiểu rõ ràng (`spec:inputs`). Component được include bằng `include: component: $CI_SERVER_FQDN/group/repo/component@1.2.0`. **CI/CD Catalog** là nơi tìm và chia sẻ component. Đây là cách hiện đại hơn so với `include: project` thuần, vì có version và input rõ ràng.
</details>

### 17. Parent-child pipelines vs multi-project pipelines.
<details><summary>Đáp án</summary>

- **Parent-child**: pipeline cha `trigger: include: path/child.yml` sinh pipeline con **cùng project**. Dùng cho monorepo, hoặc **sinh YAML động** (job tạo file YAML làm artifact rồi trigger nó).
- **Multi-project**: `trigger: project: group/other-repo` kích hoạt pipeline ở **project khác**, ví dụ service build xong thì trigger repo e2e-tests hoặc repo deploy.
- `strategy: depend` khiến job trigger chờ pipeline downstream và lấy trạng thái của nó.
</details>

### 18. What is the difference between branch pipelines, merge request pipelines, merged results pipelines and merge trains?
<details><summary>Đáp án</summary>

- **Branch pipeline**: chạy trên commit của nhánh.
- **MR pipeline**: chạy với ngữ cảnh MR (`merge_request_event`), có biến MR.
- **Merged results pipeline**: chạy trên **kết quả merge tạm** giữa nhánh nguồn và nhánh đích, phát hiện lỗi chỉ xuất hiện sau khi merge.
- **Merge train**: xếp hàng các MR. Mỗi MR được test trên kết quả merge của các MR đứng trước, bảo đảm nhánh chính luôn xanh khi có nhiều người merge liên tục.
</details>

### 19. How do you build Docker images inside GitLab CI? Compare Docker-in-Docker, socket binding and daemonless builders.
<details><summary>Đáp án</summary>

- **Docker-in-Docker** (`services: docker:dind`): cần runner **privileged**, đây là rủi ro bảo mật. Cache layer mất sau mỗi job nếu không cấu hình thêm.
- **Bind `/var/run/docker.sock`**: dùng Docker daemon của host. Job có **quyền gần như root trên host**, và các job dùng chung daemon. Không dùng được trên node K8s chạy containerd.
- **Daemonless, rootless**: Buildah, BuildKit rootless. **Kaniko**: repo gốc `GoogleContainerTools/kaniko` đã được **archive từ 06/2025**, không còn bảo trì, chỉ còn các fork cộng đồng (ví dụ Chainguard). Hệ thống mới nên chọn Buildah hoặc BuildKit, hoặc fork có người bảo trì.
- Tối ưu: dùng `--cache-from` hoặc cache từ registry.
</details>

### 20. Write a minimal pipeline for a Java microservice: build, test, image, deploy with Helm.
<details><summary>Đáp án</summary>

```yaml
stages: [build, test, package, deploy]

variables:
  MAVEN_OPTS: "-Dmaven.repo.local=$CI_PROJECT_DIR/.m2/repository"
  IMAGE: "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA"

default:
  cache:
    key: { files: [pom.xml] }
    paths: [.m2/repository]

build:
  stage: build
  image: maven:3.9-eclipse-temurin-21
  script: mvn -B -DskipTests package
  artifacts: { paths: [target/*.jar], expire_in: 1 day }

unit-test:
  stage: test
  image: maven:3.9-eclipse-temurin-21
  script: mvn -B verify
  artifacts:
    when: always
    reports: { junit: target/surefire-reports/TEST-*.xml }

image:
  stage: package
  image: quay.io/buildah/stable
  script:
    - buildah login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
    - buildah bud -t "$IMAGE" .
    - buildah push "$IMAGE"

deploy-staging:
  stage: deploy
  image: alpine/helm:<pinned-version>
  environment: { name: staging }
  resource_group: staging
  script:
    - helm upgrade --install orders ./chart -n staging
        -f chart/values-staging.yaml --set image.tag=$CI_COMMIT_SHORT_SHA --wait --timeout 10m
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```
Ghi chú: tag image `alpine/helm` cần ghim phiên bản thật. Ví dụ dùng Buildah vì chạy được không cần privileged, nhưng tùy cấu hình runner.
</details>

### 21. How do you make a slow pipeline faster?
<details><summary>Đáp án</summary>

- Dùng **`needs`** (DAG) thay vì chờ từng stage.
- **Cache** dependency đúng key. Không dùng artifact cho dependency.
- Chia nhỏ test bằng `parallel` hoặc `parallel:matrix`.
- Chỉ chạy job liên quan (`rules:changes`) trong monorepo.
- **Image CI dựng sẵn** công cụ (không `apt-get install` trong mỗi job).
- Tối ưu Dockerfile (thứ tự layer, multi-stage, cache registry).
- Clone nông (`GIT_DEPTH`), `GIT_STRATEGY: fetch`.
- `interruptible` để hủy pipeline lỗi thời.
- Đủ runner, đặt runner gần registry và repo dependency.
</details>

### 22. What are `before_script` and `after_script`? What is special about `after_script`?
<details><summary>Đáp án</summary>

- `before_script` chạy trước `script` trong **cùng shell**.
- `after_script` chạy **sau, kể cả khi job fail**, trong **một shell riêng**: biến export trong `script` không còn, và lỗi trong `after_script` không làm đổi trạng thái job.
- Dùng `after_script` để thu thập log hoặc chẩn đoán (`kubectl describe`, `helm status`) khi deploy fail, hoặc dọn dẹp.
</details>

### 23. Explain `allow_failure`, `retry`, `timeout` and `when: manual`.
<details><summary>Đáp án</summary>

- `allow_failure: true`: job fail nhưng pipeline vẫn tiếp tục và có cảnh báo. Dùng cho kiểm tra chưa bắt buộc.
- `retry: { max: 2, when: [runner_system_failure, stuck_or_timeout_failure] }`: **chỉ retry lỗi hạ tầng**, không retry để che giấu test flaky.
- `timeout`: thời gian tối đa của job.
- `when: manual`: cần người bấm để chạy. Dùng làm cổng phê duyệt deploy production.
</details>

### 24. What are `services` in a job? Give a testing example.
<details><summary>Đáp án</summary>

`services:` chạy thêm container phụ cùng job, truy cập qua alias hoặc hostname. Ví dụ integration test cần PostgreSQL hoặc Kafka:
```yaml
integration-test:
  image: maven:3.9-eclipse-temurin-21
  services:
    - name: postgres:16
      alias: db
  variables:
    POSTGRES_PASSWORD: test
    SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/postgres
  script: mvn -B verify -Pintegration
```
Một lựa chọn khác là **Testcontainers**, nhưng cần môi trường container trong job (Docker daemon hoặc tương đương).
</details>

### 25. How do you publish test and coverage results in GitLab?
<details><summary>Đáp án</summary>

- `artifacts:reports:junit`: GitLab hiển thị test pass/fail ngay trong MR.
- `coverage: '/Total.*?([0-9]{1,3})%/'`: regex lấy phần trăm coverage từ log.
- `artifacts:reports:coverage_report` (định dạng Cobertura hoặc JaCoCo) để hiện coverage theo dòng trong diff của MR.
- Dùng `artifacts:when: always` để vẫn upload report khi test fail.
</details>

### 26. How does GitLab connect to Kubernetes clusters for deployment?
<details><summary>Đáp án</summary>

- **GitLab agent for Kubernetes** (`agentk` cài trong cluster, **kết nối chủ động ra ngoài** tới GitLab, nên cluster không cần mở API ra internet). Có hai workflow:
  - **CI/CD workflow**: job chọn context `path/to/agent-project:agent-name` rồi chạy `kubectl` hoặc `helm` như bình thường.
  - **GitOps workflow**: GitLab khuyến nghị dùng **Flux**.
- Cách truyền thống: lưu kubeconfig hoặc token ServiceAccount trong biến kiểu File (protected, có scope theo môi trường).
- Tích hợp cũ dựa trên certificate đã bị deprecated.
</details>

### 27. Push-based deployment (CI runs `helm upgrade`) vs pull-based GitOps (Flux/Argo CD).
<details><summary>Đáp án</summary>

- **Push**: pipeline có credential vào cluster và trực tiếp deploy. Đơn giản, thấy ngay kết quả trong pipeline. Nhược điểm: CI giữ quyền vào cluster, và nếu ai sửa tay trong cluster thì không tự phát hiện drift.
- **Pull (GitOps)**: CI chỉ build image và cập nhật **repo cấu hình** (tag image trong values). Controller trong cluster tự kéo về và reconcile. Ưu điểm: Git là nguồn sự thật, audit dễ, tự sửa drift, CI không cần quyền vào cluster, dễ quản lý nhiều cluster. Nhược điểm: thêm hạ tầng, trạng thái deploy không nằm trực tiếp trong pipeline.
</details>

### 28. What is `CI_JOB_TOKEN` and how is it used?
<details><summary>Đáp án</summary>

Token tự sinh cho **mỗi job**, hết hạn khi job xong, mang quyền của người kích hoạt pipeline (bị giới hạn). Dùng để pull hoặc push Container Registry, Package Registry, clone repo khác, gọi một số API. Truy cập tới project khác phải được project đó cho phép trong danh sách **job token allowlist**. Nên dùng thay cho token cá nhân lưu trong biến.
</details>

### 29. How would you design the pipeline for 20 microservices deployed to several Kubernetes clusters?
<details><summary>Đáp án</summary>

- **Template chung** (CI/CD component hoặc `include` từ repo template, có version): build → unit test → quét bảo mật → build image (tag theo SHA) → push → deploy dev → integration/contract test → staging → E2E → **phê duyệt thủ công** → prod.
- Mỗi service một repo hoặc một thư mục, pipeline riêng, deploy **độc lập**.
- **Build once, deploy many**: cùng một image digest được đẩy qua các môi trường, chỉ values thay đổi.
- Mỗi cluster hoặc môi trường: `environment` + `resource_group` + biến hoặc agent riêng, protected.
- Rollout prod theo **đợt cluster** (canary cluster → các cluster còn lại), kèm smoke test và rollback tự động.
- Hoặc chuyển phần deploy sang GitOps (Flux/Argo CD) cho đa cluster.
</details>

### 30. How do you debug a GitLab CI job that works locally but fails in CI?
<details><summary>Đáp án</summary>

- So sánh **môi trường**: image, phiên bản công cụ, biến môi trường (biến protected không có trên nhánh không protected là nguyên nhân rất phổ biến), thư mục làm việc, user.
- Mạng: runner có ra được registry, Maven Central, proxy không.
- Tài nguyên: runner thiếu memory thì Maven hoặc JVM bị kill.
- Cache hoặc artifact không tồn tại như mình tưởng.
- Chạy lại bằng đúng image đó ở local (`docker run -it <image> sh`).
- Thêm `set -x` (cẩn thận lộ secret), hoặc dùng **debug terminal** nếu runner hỗ trợ.
- Kiểm tra cú pháp bằng **Pipeline Editor / CI Lint**.
</details>

### 31. What is the difference between `dependencies` and `needs` regarding artifacts?
<details><summary>Đáp án</summary>

- Mặc định job tải **artifact của mọi job ở các stage trước**.
- `dependencies: [build]` giới hạn chỉ tải từ `build`. `dependencies: []` thì không tải gì (tiết kiệm thời gian).
- Với `needs`, job tải artifact từ các job trong `needs` (có thể tắt bằng `needs: [{ job: build, artifacts: false }]`).
</details>

### 32. How do you implement a production deployment approval and a deploy freeze?
<details><summary>Đáp án</summary>

- **Approval**: protected environment `production` có cấu hình **deployment approvals** (số người duyệt, nhóm duyệt). Job deploy chờ duyệt. Hoặc đơn giản hơn: dùng `when: manual` và chỉ cho phép một số người chạy.
- **Deploy freeze**: cấu hình khung thời gian cấm deploy theo cron trong Settings, GitLab cung cấp biến `$CI_DEPLOY_FREEZE`. Thêm rule:
```yaml
rules:
  - if: $CI_DEPLOY_FREEZE
    when: never
```
</details>

### 33. How would you version and release a service with semantic versioning in GitLab?
<details><summary>Đáp án</summary>

- Tag Git `v1.4.2` kích hoạt pipeline release: build, tag image `1.4.2` (vẫn giữ tag SHA), đóng gói chart, tạo **GitLab Release** (keyword `release:` hoặc `glab release create`) kèm changelog.
- Quy ước commit (Conventional Commits) để tự tính version và sinh changelog.
- **Không ghi đè** tag image đã phát hành.
</details>

### 34. What is the purpose of `parallel:matrix`?
<details><summary>Đáp án</summary>

Sinh nhiều bản sao của một job với các tổ hợp biến khác nhau, chạy song song:
```yaml
deploy:
  parallel:
    matrix:
      - CLUSTER: [eu-1, eu-2, us-1]
  environment: { name: prod/$CLUSTER }
  script: ./deploy.sh "$CLUSTER"
```
Hay dùng để deploy nhiều cluster hoặc test nhiều phiên bản JDK. Muốn deploy prod theo đợt có kiểm soát thì nên tách thành các job tuần tự.
</details>

### 35. Explain GitLab Container Registry naming and cleanup policies.
<details><summary>Đáp án</summary>

- Image nằm ở `$CI_REGISTRY_IMAGE` (`registry.gitlab.com/group/project`), có thể thêm path con (`$CI_REGISTRY_IMAGE/orders`).
- Image tag theo SHA cho mỗi commit làm registry phình nhanh. Cấu hình **cleanup policy**: giữ N tag mới nhất, giữ tag khớp regex (ví dụ `v.*`), xóa tag cũ hơn X ngày.
- Đừng để policy xóa mất tag đang chạy trên production.
</details>

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [CI/CD YAML syntax reference](https://docs.gitlab.com/ci/yaml/): mọi keyword (`rules`, `needs`, `environment`, `resource_group`, `parallel`, `release`).
- [GitLab Runner executors](https://docs.gitlab.com/runner/executors/): so sánh executor.
- [Caching in GitLab CI/CD](https://docs.gitlab.com/ci/caching/): cache và artifact.
- [Predefined CI/CD variables](https://docs.gitlab.com/ci/variables/predefined_variables/): biến có sẵn.
- [CI/CD variables (masked, protected)](https://docs.gitlab.com/ci/variables/): quản lý biến và secret.
- [Merge request pipelines](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/) và [Merge trains](https://docs.gitlab.com/ci/pipelines/merge_trains/): các loại pipeline.
- [Downstream pipelines](https://docs.gitlab.com/ci/pipelines/downstream_pipelines/): parent-child và multi-project.
- [CI/CD components](https://docs.gitlab.com/ci/components/): component và catalog.
- [Environments](https://docs.gitlab.com/ci/environments/) và [Protected environments](https://docs.gitlab.com/ci/environments/protected_environments/): môi trường và phê duyệt.
- [Resource group](https://docs.gitlab.com/ci/resource_groups/): tuần tự hóa job deploy.
- [GitLab agent for Kubernetes](https://docs.gitlab.com/user/clusters/agent/): kết nối cluster.
- [Use Docker to build Docker images](https://docs.gitlab.com/ci/docker/using_docker_build/): DinD, socket binding.
- [Unit test reports](https://docs.gitlab.com/ci/testing/unit_test_reports/): JUnit report.
