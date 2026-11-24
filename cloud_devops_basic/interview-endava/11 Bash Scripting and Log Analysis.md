# 11. Bash Scripting & Log Analysis

> Câu hỏi viết bằng tiếng Anh (như khi phỏng vấn), đáp án viết bằng tiếng Việt. Phần C là bài viết code. Hãy tự viết trước rồi mới mở đáp án.

---

## A. Bash Fundamentals

### 1. What does `set -euo pipefail` do? What are the pitfalls of `set -e`?
<details><summary>Đáp án</summary>

- `-e`: thoát ngay khi một lệnh trả về khác 0.
- `-u`: báo lỗi khi dùng biến **chưa được gán**.
- `-o pipefail`: pipeline trả về lỗi nếu **bất kỳ lệnh nào** trong pipe lỗi. Mặc định chỉ xét lệnh cuối.
- Cạm bẫy của `-e`:
  - **Không** có tác dụng với lệnh nằm trong điều kiện `if`, `while`, `&&`, `||`.
  - Lỗi bên trong `$(...)` dùng trong `local var=$(cmd)` bị che vì `local` trả về 0.
  - `grep` không tìm thấy gì trả về 1 làm script thoát ngoài ý muốn (dùng `grep ... || true`).
</details>

### 2. Explain `$?`, `$#`, `$@`, `$*`, `$0`, `$$`, `$!`.
<details><summary>Đáp án</summary>

- `$?`: exit code của lệnh vừa chạy.
- `$#`: số tham số.
- `$0`: tên script.
- `$$`: PID của shell hiện tại.
- `$!`: PID của tiến trình nền vừa chạy.
- `"$@"`: **mỗi tham số là một từ riêng**, giữ nguyên khoảng trắng bên trong.
- `"$*"`: **gộp mọi tham số thành một chuỗi**.
- Gần như luôn dùng `"$@"` khi chuyển tiếp tham số.
</details>

### 3. Why should you quote variables? Single vs double quotes.
<details><summary>Đáp án</summary>

Không bọc nháy thì biến bị **word splitting** (tách theo khoảng trắng) và **globbing** (`*` bị mở rộng thành tên file). `rm $file` với `file="my log.txt"` sẽ xóa nhầm hai file. Luôn viết `"$var"`.
- **Nháy đơn**: chuỗi giữ nguyên, không thay biến.
- **Nháy kép**: thay `$var`, `$(...)`, nhưng không tách từ.
</details>

### 4. `[ ]` vs `[[ ]]` vs `(( ))`.
<details><summary>Đáp án</summary>

- `[ ]` (hay `test`): chuẩn POSIX, phải bọc nháy cẩn thận, dùng `-eq`, `-lt` để so số.
- `[[ ]]`: từ khóa của Bash. An toàn hơn (không bị tách từ), hỗ trợ `&&`, `||`, so khớp mẫu `==` và **regex** `=~`.
- `(( ))`: **phép toán số học** (`(( count > 5 ))`, `(( i++ ))`).
</details>

### 5. Explain redirections: `>`, `>>`, `2>`, `2>&1`, `&>`, and why order matters.
<details><summary>Đáp án</summary>

- `>`: ghi đè stdout ra file. `>>`: nối thêm. `2>`: stderr. `&>` (Bash): cả stdout và stderr.
- `cmd > out.log 2>&1`: stdout vào file, **sau đó** stderr trỏ tới **nơi stdout đang trỏ** (file). Kết quả: cả hai vào file.
- `cmd 2>&1 > out.log`: stderr trỏ tới stdout **lúc đó** (terminal), sau đó mới đổi stdout sang file. Kết quả: stderr vẫn ra terminal.
- `/dev/null` để bỏ output.
</details>

### 6. What does `PIPESTATUS` contain?
<details><summary>Đáp án</summary>

Mảng exit code của **từng lệnh** trong pipeline vừa chạy. Ví dụ `curl ... | jq ...; echo "${PIPESTATUS[@]}"` cho biết `curl` hay `jq` bị lỗi.
</details>

### 7. Explain parameter expansion: `${var:-default}`, `${var:?msg}`, `${var#pattern}`, `${var%pattern}`, `${var//a/b}`, `${#var}`.
<details><summary>Đáp án</summary>

```bash
env=${1:-dev}                    # mặc định "dev" nếu rỗng hoặc chưa gán
: "${KUBECONFIG:?KUBECONFIG must be set}"   # dừng kèm thông báo nếu thiếu
file=/var/log/app/api.log
echo "${file##*/}"               # api.log   (xóa tiền tố dài nhất khớp */)
echo "${file%/*}"                # /var/log/app (xóa hậu tố ngắn nhất khớp /*)
echo "${file%.log}.gz"           # /var/log/app/api.gz
tag=feature/ABC-1
echo "${tag//\//-}"              # feature-ABC-1
echo "${#tag}"                   # độ dài chuỗi
```
</details>

### 8. `$(...)` vs backticks. What is a subshell?
<details><summary>Đáp án</summary>

- `$(...)` và backtick đều là **command substitution**. `$(...)` lồng nhau được và dễ đọc, nên dùng nó.
- **Subshell** `( ... )` chạy trong process con: biến hoặc `cd` thay đổi bên trong **không ảnh hưởng** shell cha.
- `{ ...; }` nhóm lệnh trong **cùng shell**.
- Lưu ý: vế phải của pipe (`cmd | while read ...`) chạy trong subshell, nên biến gán trong vòng lặp bị mất sau khi vòng lặp kết thúc.
</details>

### 9. How do you read a file line by line safely?
<details><summary>Đáp án</summary>

```bash
while IFS= read -r line; do
  printf '%s\n' "$line"
done < input.txt
```
- `IFS=` giữ khoảng trắng đầu và cuối dòng.
- `-r` không diễn giải dấu `\`.
- Redirect `< file` (thay vì `cat file | while`) để vòng lặp chạy trong shell hiện tại.
</details>

### 10. How do you use `trap` for cleanup?
<details><summary>Đáp án</summary>

```bash
tmpdir=$(mktemp -d)
cleanup() { rm -rf "$tmpdir"; }
trap cleanup EXIT              # luôn chạy khi script kết thúc (bình thường hoặc lỗi)
trap 'echo "interrupted"; exit 130' INT TERM
```
</details>

### 11. What is the difference between `source script.sh` and `./script.sh`?
<details><summary>Đáp án</summary>

- `./script.sh`: chạy trong **process mới**. Biến và `cd` không ảnh hưởng shell hiện tại. Cần quyền `x` và shebang.
- `source script.sh` (hoặc `. script.sh`): chạy **trong shell hiện tại**, nên biến và hàm còn lại sau khi chạy. Dùng để nạp biến môi trường hoặc thư viện hàm.
</details>

### 12. Why use `#!/usr/bin/env bash` instead of `#!/bin/bash`?
<details><summary>Đáp án</summary>

`env` tìm `bash` theo `PATH`, nên chạy được khi bash không nằm ở `/bin/bash` (macOS dùng Homebrew, NixOS, một số image tối giản). Ngược lại, `#!/bin/bash` cố định và rõ ràng hơn trên các server đã biết trước. Lưu ý: image Alpine mặc định không có bash, chỉ có `sh` (BusyBox).
</details>

### 13. How do functions return values in Bash?
<details><summary>Đáp án</summary>

- `return N` chỉ trả **exit status** (0–255).
- Muốn trả dữ liệu thì **in ra stdout** và lấy bằng `$(...)`: `result=$(get_version)`.
- Biến trong hàm mặc định là **toàn cục**, nên khai báo `local` để tránh ghi đè.
</details>

### 14. What are arrays and associative arrays in Bash?
<details><summary>Đáp án</summary>

```bash
clusters=(dev staging prod-eu)
for c in "${clusters[@]}"; do echo "$c"; done
echo "${#clusters[@]}"           # số phần tử

declare -A replicas=([dev]=1 [prod]=3)
echo "${replicas[prod]}"
for k in "${!replicas[@]}"; do echo "$k=${replicas[$k]}"; done
```
Associative array cần Bash 4 trở lên.
</details>

### 15. `find -exec` vs `xargs`. Why use `-print0` / `-0`?
<details><summary>Đáp án</summary>

- `find . -name '*.log' -exec gzip {} +`: `+` gom nhiều file vào một lần gọi lệnh. `\;` thì mỗi file một lần gọi.
- `find ... -print0 | xargs -0 rm`: phân tách bằng ký tự NUL nên an toàn với tên file có khoảng trắng hoặc xuống dòng.
- `xargs -P 4` chạy song song.
</details>

### 16. How do you make a script idempotent and safe to re-run in CI?
<details><summary>Đáp án</summary>

- Dùng lệnh mang tính khai báo hoặc "tạo nếu chưa có": `mkdir -p`, `kubectl apply`, `helm upgrade --install`, `kubectl create ns x --dry-run=client -o yaml | kubectl apply -f -`.
- Kiểm tra trạng thái trước khi hành động.
- `set -euo pipefail`, `trap` dọn dẹp, kiểm tra biến bắt buộc (`${VAR:?}`).
- Không phụ thuộc thư mục hiện tại: `cd "$(dirname "$0")"`.
- Chạy `shellcheck` trong CI.
</details>

### 17. What is ShellCheck?
<details><summary>Đáp án</summary>

Công cụ phân tích tĩnh cho script shell. Nó phát hiện thiếu nháy, `$?` dùng sai, so sánh sai kiểu, lệnh không tồn tại, cú pháp không theo POSIX, và các cạm bẫy phổ biến. Nên chạy trong pipeline (`shellcheck scripts/*.sh`).
</details>

### 18. Why can `set -x` be dangerous in CI?
<details><summary>Đáp án</summary>

`set -x` in **mọi lệnh sau khi đã thay biến**, kể cả token, mật khẩu (ví dụ `curl -H "Authorization: Bearer xxx"`). Masking của GitLab có thể không che được nếu giá trị bị biến đổi. Chỉ bật `set -x` ở đoạn cần debug, `set +x` trước các lệnh có secret.
</details>

## B. Text Processing Tools

### 19. Explain the common `grep` options you use for log analysis.
<details><summary>Đáp án</summary>

- `-i`: không phân biệt hoa thường.
- `-v`: đảo ngược (dòng không khớp).
- `-c`: đếm.
- `-n`: số dòng.
- `-o`: chỉ in phần khớp.
- `-E`: regex mở rộng.
- `-F`: chuỗi cố định (nhanh, không cần escape).
- `-r`: đệ quy.
- `-l`: chỉ in tên file.
- **`-A N` / `-B N` / `-C N`**: in N dòng sau, trước, hoặc quanh dòng khớp. Rất hữu ích để thấy stack trace hoặc bối cảnh.
- `zgrep`: tìm trong file `.gz`.
</details>

### 20. Explain basic `awk` and `sed` usage.
<details><summary>Đáp án</summary>

```bash
awk '{print $1, $9}' access.log                  # cột 1 và 9 (phân tách bằng khoảng trắng)
awk -F',' '$3 > 500 {print $1}' data.csv         # phân tách bằng dấu phẩy, lọc theo điều kiện
awk '{sum += $10} END {print sum}' access.log    # cộng dồn
sed -n '100,200p' app.log                        # in dòng 100–200
sed -i 's/old/new/g' config.yaml                 # thay thế ngay trong file (GNU sed)
sed -E 's/password=[^ ]+/password=***/g'         # che dữ liệu nhạy cảm
```
</details>

### 21. What does `sort | uniq -c | sort -nr` do?
<details><summary>Đáp án</summary>

Mẫu kinh điển để **đếm tần suất**:
1. `sort` gom các dòng giống nhau lại cạnh nhau. `uniq` chỉ gộp các dòng **liền kề**, nên phải sort trước.
2. `uniq -c` đếm số lần xuất hiện.
3. `sort -nr` sắp xếp theo số, giảm dần.

Thêm `| head` để lấy top N.
</details>

### 22. How do you process JSON and YAML on the command line?
<details><summary>Đáp án</summary>

```bash
kubectl get pods -o json | jq -r '.items[] | select(.status.phase!="Running") | .metadata.name'
jq -r 'select(.level=="ERROR") | .message' app.json.log
yq '.image.tag' values.yaml
yq -i '.image.tag = "abc123"' values-prod.yaml      # yq v4 (mikefarah)
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}'
```
</details>

## C. Hands-on Tasks (write the command / script)

### 23. Show the top 10 most frequent ERROR messages in `app.log`.
<details><summary>Đáp án</summary>

```bash
grep 'ERROR' app.log \
  | sed -E 's/^[0-9-]+[T ][0-9:.,]+Z? *//' \
  | sed -E 's/[0-9a-f]{8}-[0-9a-f-]{27}/<uuid>/g; s/[0-9]+/<n>/g' \
  | sort | uniq -c | sort -nr | head -10
```
Bỏ timestamp và chuẩn hóa ID hoặc số để các lỗi cùng loại được gộp lại. Định dạng timestamp tùy log thực tế.
</details>

### 24. From an nginx access log, count requests per HTTP status code and list the top 5 IPs that received 5xx.
<details><summary>Đáp án</summary>

```bash
awk '{print $9}' access.log | sort | uniq -c | sort -nr
awk '$9 ~ /^5/ {print $1}' access.log | sort | uniq -c | sort -nr | head -5
```
Với log format mặc định "combined", `$1` là IP client, `$9` là status. Format tùy chỉnh thì cột sẽ khác.
</details>

### 25. Extract log lines between two timestamps.
<details><summary>Đáp án</summary>

```bash
awk '$0 >= "2026-11-24 10:00" && $0 < "2026-11-24 10:15"' app.log
# hoặc khi timestamp theo định dạng ISO, so sánh chuỗi theo thứ tự từ điển là đúng thứ tự thời gian
sed -n '/2026-11-24 10:00/,/2026-11-24 10:15/p' app.log   # cần có dòng khớp chính xác
journalctl -u api --since "2026-11-24 10:00" --until "2026-11-24 10:15"
kubectl logs deploy/api --since-time=2026-11-24T10:00:00Z
```
</details>

### 26. Print each Java exception with 20 lines of stack trace, and count exceptions by type.
<details><summary>Đáp án</summary>

```bash
grep -n -A 20 'Exception' app.log | less
grep -oE '[a-zA-Z0-9_.]+(Exception|Error)\b' app.log | sort | uniq -c | sort -nr
grep -A 50 'Exception' app.log | grep 'Caused by' | sort | uniq -c | sort -nr   # nguyên nhân gốc
```
</details>

### 27. Count JSON log entries by level and show the latest 5 errors with their trace IDs.
<details><summary>Đáp án</summary>

```bash
jq -r '.level' app.json.log | sort | uniq -c
jq -c 'select(.level=="ERROR") | {ts: .timestamp, trace: .traceId, msg: .message}' app.json.log | tail -5
```
Nếu file lẫn dòng không phải JSON thì thêm `jq -R 'fromjson? // empty'`.
</details>

### 28. Write a function that retries a command with exponential backoff.
<details><summary>Đáp án</summary>

```bash
retry() {
  local max=$1; shift
  local delay=2 n=1
  until "$@"; do
    if (( n >= max )); then
      echo "Command failed after $n attempts: $*" >&2
      return 1
    fi
    echo "Attempt $n failed, retrying in ${delay}s..." >&2
    sleep "$delay"
    (( n++ , delay *= 2 ))
  done
}
retry 5 curl -fsS http://orders:8080/actuator/health
```
</details>

### 29. Write a smoke-test script for CI: call a health endpoint; if it fails, roll back the Helm release and fail the job.
<details><summary>Đáp án</summary>

```bash
#!/usr/bin/env bash
set -euo pipefail
: "${RELEASE:?}" "${NAMESPACE:?}" "${URL:?}"

for i in {1..10}; do
  if curl -fsS --max-time 5 "$URL" >/dev/null; then
    echo "Smoke test passed"; exit 0
  fi
  echo "Health check failed ($i/10)"; sleep 6
done

echo "Smoke test failed, rolling back $RELEASE" >&2
kubectl -n "$NAMESPACE" get pods -l "app.kubernetes.io/instance=$RELEASE" -o wide || true
helm history "$RELEASE" -n "$NAMESPACE" --max 5 || true
helm rollback "$RELEASE" -n "$NAMESPACE" --wait
exit 1
```
`curl -f` trả lỗi khi gặp mã HTTP 4xx/5xx. `-sS` tắt thanh tiến trình nhưng vẫn in lỗi.
</details>

### 30. Wait until all Pods of a deployment are ready, with a timeout.
<details><summary>Đáp án</summary>

```bash
kubectl rollout status deployment/orders -n staging --timeout=300s
# hoặc
kubectl wait --for=condition=Ready pod -l app=orders -n staging --timeout=300s
```
Không cần tự viết vòng lặp, vì cả hai lệnh đều trả về exit code khác 0 khi hết thời gian chờ.
</details>

### 31. Alert when any filesystem is above 80% usage.
<details><summary>Đáp án</summary>

```bash
df -P -x tmpfs -x devtmpfs | awk 'NR>1 {gsub("%","",$5); if ($5+0 > 80) print $6" is "$5"% full"}'
```
`-P` cho định dạng POSIX một dòng một filesystem, tránh việc tên thiết bị dài làm xuống dòng.
</details>

### 32. Delete files older than 7 days in `/var/log/app` but only `*.log.gz`.
<details><summary>Đáp án</summary>

```bash
find /var/log/app -type f -name '*.log.gz' -mtime +7 -print          # xem trước
find /var/log/app -type f -name '*.log.gz' -mtime +7 -delete
```
Luôn chạy `-print` trước khi `-delete`.
</details>

### 33. List all Pods across namespaces that are not Running or have restarted more than 3 times.
<details><summary>Đáp án</summary>

```bash
kubectl get pods -A --field-selector=status.phase!=Running
kubectl get pods -A --no-headers | awk '$5+0 > 3 {print $1"/"$2" restarts="$5}'
# với jq, chính xác hơn:
kubectl get pods -A -o json | jq -r '.items[]
  | select(([.status.containerStatuses[]?.restartCount] | add // 0) > 3)
  | "\(.metadata.namespace)/\(.metadata.name)"'
```
Cột RESTARTS có thể ở dạng `5 (2m ago)`, nên `$5+0` chỉ lấy phần số.
</details>

### 34. Find which process is using the most memory and show its open network connections.
<details><summary>Đáp án</summary>

```bash
ps aux --sort=-rss | head -5
pid=$(ps -eo pid --sort=-rss --no-headers | head -1 | tr -d ' ')
ss -tnp | grep "pid=$pid,"
```
</details>

### 35. Tail logs from all Pods of an app and highlight errors in real time.
<details><summary>Đáp án</summary>

```bash
kubectl logs -f -l app=orders -n prod --all-containers --prefix --max-log-requests=10 \
  | grep --line-buffered -E 'ERROR|WARN|Exception'
```
`--line-buffered` để `grep` in ngay từng dòng khi đọc từ pipe.
</details>

### 36. Describe how you approach analyzing a large log to find the root cause of an incident.
<details><summary>Đáp án</summary>

1. **Khoanh thời gian**: lúc bắt đầu sự cố (từ alert hoặc metric). Lấy log quanh mốc đó.
2. **Khoanh phạm vi**: service, Pod, node, phiên bản nào. Có trùng thời điểm deploy hoặc thay đổi cấu hình không.
3. **Tìm lỗi đầu tiên**, không phải lỗi nhiều nhất. Lỗi gốc thường xuất hiện trước, các lỗi sau là hệ quả.
4. **Gom nhóm và đếm** loại lỗi (`sort | uniq -c`), so sánh với khoảng thời gian bình thường.
5. **Lần theo request** bằng trace ID hoặc correlation ID qua các service.
6. **Lập giả thuyết và kiểm chứng** bằng metric hoặc dữ liệu khác (CPU, GC, consumer lag, kết nối DB).
7. Ghi lại timeline và nguyên nhân gốc, kèm hành động phòng ngừa (alert, test, tự động hóa).
</details>

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [GNU Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html): cú pháp, expansion, redirection.
- [Bash Manual: The Set Builtin](https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html): `set -e`, `-u`, `-o pipefail`, `-x`.
- [Bash Manual: Shell Parameter Expansion](https://www.gnu.org/software/bash/manual/html_node/Shell-Parameter-Expansion.html): `${var:-}`, `${var#}`, `${var%}`.
- [Bash Manual: Redirections](https://www.gnu.org/software/bash/manual/html_node/Redirections.html): thứ tự redirect.
- [GNU grep manual](https://www.gnu.org/software/grep/manual/grep.html), [GNU sed manual](https://www.gnu.org/software/sed/manual/sed.html), [GNU awk manual](https://www.gnu.org/software/gawk/manual/gawk.html): công cụ xử lý văn bản.
- [GNU findutils: find](https://www.gnu.org/software/findutils/manual/html_mono/find.html): `-exec`, `-print0`, `-delete`.
- [jq Manual](https://jqlang.org/manual/): xử lý JSON.
- [ShellCheck](https://www.shellcheck.net/): phân tích tĩnh script shell.
- [kubectl reference: logs](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_logs/) và [JSONPath support](https://kubernetes.io/docs/reference/kubectl/jsonpath/): truy vấn output của kubectl.
- [Nginx: log_format (combined)](https://nginx.org/en/docs/http/ngx_http_log_module.html#log_format): định dạng access log.
