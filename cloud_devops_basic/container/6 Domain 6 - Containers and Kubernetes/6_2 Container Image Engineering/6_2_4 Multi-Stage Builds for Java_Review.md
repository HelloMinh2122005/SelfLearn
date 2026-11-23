# Ôn Tập: 6_2_4 Multi-Stage Builds for Java

### Câu Hỏi 1: Multi-stage build trong Dockerfile hoạt động theo nguyên tắc nào?

<details>
<summary>Đáp án</summary>

Trong multi-stage build, một Dockerfile có **nhiều lệnh `FROM`**. Mỗi lệnh `FROM` có thể sử dụng một base image khác nhau và bắt đầu một **stage mới**. Người dùng chọn lọc chép artifact cần thiết từ stage này sang stage khác, bỏ lại mọi thứ không muốn đưa vào image cuối cùng.
</details>

### Câu Hỏi 2: Lợi ích chính của multi-stage build là gì?

<details>
<summary>Đáp án</summary>

Multi-stage build mang lại hai lợi ích chính:
- **Giảm kích thước image cuối** nhờ tách biệt môi trường/quá trình build khỏi sản phẩm chạy cuối cùng.
- **Image cuối sạch và gọn hơn** vì không chứa công cụ build (như Maven, JDK) hay mã nguồn (source code) ở trong image runtime.
</details>

### Câu Hỏi 3: Khi áp dụng multi-stage build cho ứng dụng Java (dùng Maven), hai stage cơ bản thường được phân chia như thế nào?

<details>
<summary>Đáp án</summary>

- **Stage 1 (build)**: Dùng base image có **Maven + JDK** (ví dụ `maven:3.9-eclipse-temurin-21`) để tải dependency và biên dịch mã nguồn thành file `.jar`.
- **Stage 2 (runtime)**: Dùng base image chỉ có **JRE** (ví dụ `eclipse-temurin:21-jre`) và chỉ chép đúng file `.jar` vừa build sang để chạy ứng dụng, không mang theo Maven, JDK hay mã nguồn.
</details>

### Câu Hỏi 4: Cách đặt tên cho một stage và chép artifact từ stage đó sang stage khác trong Dockerfile là gì?

<details>
<summary>Đáp án</summary>

1. Đặt tên cho stage bằng từ khóa `AS <tên>` ở lệnh `FROM`, ví dụ: `FROM docker.io/library/maven:3.9-eclipse-temurin-21 AS build`.
2. Dùng lệnh `COPY --from=<tên stage> <src> <dest>` ở stage sau để chép artifact, ví dụ: `COPY --from=build /src/target/hello-svc.jar /app/hello-svc.jar`.

Ngoài build stage, `COPY` cũng có thể lấy nguồn từ build context, named context hoặc một image khác.
</details>

### Câu Hỏi 5: Cờ `--target <stage>` khi chạy lệnh build dùng để làm gì và hữu ích trong những tình huống nào?

<details>
<summary>Đáp án</summary>

`docker build --target <stage>` (hoặc `podman build --target <stage>`) yêu cầu trình build **dừng lại ở stage được chỉ định** thay vì chạy hết Dockerfile.

Tình huống áp dụng thực tế:
- **Debug** một stage cụ thể (hoặc giữ một stage/tag có công cụ debug khi image runtime dùng distroless).
- **Chạy stage kiểm thử (test)** riêng trong CI mà không cần dựng image runtime cuối cùng.
- **So sánh kích thước** giữa image chỉ có stage build (`--target build`) và image runtime đầy đủ.
</details>

### Câu Hỏi 6: Làm thế nào để build và so sánh kích thước giữa image cuối (runtime) và image dừng ở stage `build` bằng Podman/Docker?

<details>
<summary>Đáp án</summary>

Chạy lần lượt hai lệnh build (một lệnh build toàn bộ, một lệnh dùng `--target build`), sau đó liệt kê kích thước image:

```bash
podman build -t hello-svc:full .                       # image cuối (stage runtime)
podman build --target build -t hello-svc:buildonly .   # dừng ở stage build
podman images | grep hello-svc                         # so sánh kích thước hai image
```

*(Nếu dùng Docker thì thay `podman` bằng `docker`.)*
</details>

### Câu Hỏi 7: Ngoài việc dùng JRE thay cho JDK, bài học nhắc đến những lựa chọn runtime nhỏ hơn nào cho Java và đặc điểm của chúng là gì?

<details>
<summary>Đáp án</summary>

Bài học giới thiệu 3 lựa chọn runtime nhỏ hơn:
- **JRE (thay vì JDK)**: Image chạy không cần compiler hay công cụ build như Maven.
- **`jlink`**: Lắp ráp và tối ưu một tập module cùng các phụ thuộc thành một **custom runtime image** (dùng cho ứng dụng cần phân tích module / module analysis).
- **Distroless**: Image tối giản chỉ chứa ứng dụng và phụ thuộc runtime, **không có package manager, shell hay các chương trình khác** của một bản phân phối chuẩn.
</details>

### Câu Hỏi 8: Sử dụng base image Distroless gặp phải cạm bẫy gì khi vận hành và cách khắc phục thực tiễn là gì?

<details>
<summary>Đáp án</summary>

- **Cạm bẫy**: Vì Distroless không có shell hay package manager, việc debug bằng cách `exec` vào shell bên trong container sẽ rất khó khăn.
- **Cách khắc phục thực tiễn**: Giữ một stage hoặc tag riêng có chứa công cụ debug (dùng `--target` để build khi cần), hoặc sử dụng cơ chế debug của Kubernetes (được đề cập ở bài 6_8).
</details>

### Câu Hỏi 9: Tùy chọn `-XX:MaxRAMPercentage` của JVM hoạt động thế nào trong container và tại sao cần đặt tường minh giá trị này?

<details>
<summary>Đáp án</summary>

- `-XX:MaxRAMPercentage` đặt kích thước **heap tối đa** của JVM theo phần trăm RAM, với giá trị **mặc định là 25%**.
- **Tại sao cần quan tâm và đặt tường minh**:
  - Nếu container có giới hạn bộ nhớ nhỏ, mức mặc định 25% có thể làm heap quá bé (dễ dẫn tới `OutOfMemoryError` của JVM).
  - Nếu đặt quá cao, container có thể bị **OOM kill** ở cấp kernel, vì heap không phải toàn bộ bộ nhớ mà JVM sử dụng.
- Trong Dockerfile mẫu, giá trị này được truyền qua biến môi trường `JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"` và cần đo đạc, kiểm chứng thực tế.
</details>

### Câu Hỏi 10: Tại sao trong stage build của Dockerfile mẫu lại `COPY pom.xml .` và tải dependency trước khi `COPY src ./src`?

<details>
<summary>Đáp án</summary>

Vì cơ chế layer caching: khi một layer thay đổi thì mọi layer phía sau nó đều phải build lại.

Nếu tách thành hai bước:
1. `COPY pom.xml .` rồi `RUN mvn -B -q dependency:go-offline`
2. `COPY src ./src` rồi `RUN mvn -B -q package`

Thì khi bạn chỉ sửa mã nguồn trong `src` mà không đổi `pom.xml`, Docker/Podman sẽ tái sử dụng cache của bước tải dependency, tránh phải tải lại toàn bộ thư viện mỗi lần build.
</details>

### Câu Hỏi 11: Trong Dockerfile multi-stage mẫu cho `hello-svc`, stage runtime áp dụng những thiết lập nào để chạy ứng dụng an toàn và đúng chuẩn?

<details>
<summary>Đáp án</summary>

Ở stage runtime (`FROM docker.io/library/eclipse-temurin:21-jre`), Dockerfile thiết lập:
- Chuyển sang user không phải root bằng `USER 10001:10001`.
- Khai báo thư mục làm việc `WORKDIR /app`, biến môi trường `PORT=8080`, `JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"`, và cổng `EXPOSE 8080`.
- Khởi chạy file `.jar` bằng `ENTRYPOINT` dạng exec form: `ENTRYPOINT ["java", "-jar", "/app/hello-svc.jar"]`.
</details>
