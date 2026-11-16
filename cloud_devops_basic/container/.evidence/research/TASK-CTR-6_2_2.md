# RESEARCH LEDGER: TASK-CTR-6_2_2 - Build Context and dockerignore

**Researcher**: main session (không dùng subagent); **Ngày**: 16-11-2026; **Status**: COMPLETE (chờ `evidence.py quotes`)

#### Claim Ledger
| ID | Lesson | Atomic claim | URL + section đã mở | Trích dẫn nguyên văn (≤ 300 ký tự) | Áp dụng cho (phiên bản/nền tảng) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| R2.1 | 6_2_2 | Build context là tập file mà quá trình build truy cập được. | https://docs.docker.com/build/concepts/context/ (What is a build context?) | "The build context is the set of files that your build can access." | Docker Build | VERIFIED |
| R2.2 | 6_2_2 | Đối số vị trí của lệnh build xác định context được dùng. | https://docs.docker.com/build/concepts/context/ | "The positional argument that you pass to the build command specifies the context that you want to use for the build" | Docker Build | VERIFIED |
| R2.3 | 6_2_2 | Build client tìm .dockerignore ở thư mục gốc của context; file khớp mẫu bị loại khỏi context trước khi gửi tới builder. | https://docs.docker.com/build/concepts/context/ (.dockerignore files) | "the build client looks for a file named .dockerignore in the root directory of the context. If this file exists, the files and directories that match patterns in the files are removed from the build context before it's sent to the builder." | Docker Build | VERIFIED |
| R2.4 | 6_2_2 | File ignore riêng cho Dockerfile (tên <Dockerfile>.dockerignore) được ưu tiên hơn .dockerignore ở gốc context. | https://docs.docker.com/build/concepts/context/ (Filename and location) | "A Dockerfile-specific ignore-file takes precedence over the .dockerignore file at the root of the build context if both exist." | Docker Build | VERIFIED |
| R2.5 | 6_2_2 | Cú pháp .dockerignore là danh sách mẫu mỗi dòng, giống file glob của shell Unix. | https://docs.docker.com/build/concepts/context/ (Syntax) | "The .dockerignore file is a newline-separated list of patterns similar to the file globs of Unix shells." | Docker Build | VERIFIED |
| R2.6 | 6_2_2 | Công cụ như Podman/Buildah tìm .containerignore hoặc .dockerignore trong thư mục gốc của context. | https://github.com/containers/common/blob/main/docs/containerignore.5.md | "Before container engines build an image, they look for a file named .containerignore or .dockerignore in the root context directory." | containers/common | VERIFIED |
| R2.7 | 6_2_2 | podman build --ignorefile chỉ định đường dẫn tới file .containerignore khác. | https://docs.podman.io/en/latest/markdown/podman-build.1.html (--ignorefile) | "Path to an alternative .containerignore file." | Podman | VERIFIED |
