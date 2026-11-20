# 1. Tạo cluster kind
kind create cluster --name helm-lab
kubectl cluster-info --context kind-helm-lab
kubectl get nodes

# 2. Kiểm tra chart trước khi cài (không cần cluster)
helm lint ./web-app
helm template my-web ./web-app            # xem manifest sau khi render

# 3. Dry-run trên cluster (validate với API server, chưa tạo gì)
helm install my-web ./web-app --dry-run --debug

# 4. Cài thật
helm install my-web ./web-app --namespace demo --create-namespace

# 5. Kiểm tra
helm list -n demo
helm status my-web -n demo
kubectl get deploy,po,svc -n demo
kubectl rollout status deploy/my-web-web-app -n demo

# 6. Truy cập app (Service là ClusterIP, ingress tắt mặc định)
kubectl port-forward svc/my-web-web-app 8080:80 -n demo
# mở terminal khác: curl -I http://localhost:8080

# 7. Chạy test hook (templates/tests/test-connection.yaml)
helm test my-web -n demo

# 8. Cập nhật và rollback
helm upgrade my-web ./web-app -n demo --set replicaCount=3
helm history my-web -n demo
helm rollback my-web 1 -n demo

# 9. Dọn dẹp
helm uninstall my-web -n demo
kind delete cluster --name helm-lab
