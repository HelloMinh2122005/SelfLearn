# Evidence Index: WRITE-CTR-6_5_1

- **Task ID**: WRITE-CTR-6_5_1
- **Assignee**: writer-1
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_5 Helm Package Management/6_5_1 Helm Core Concepts.md`
- **Topic Title**: 6_5_1 Helm Core Concepts
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_5-R1.md`
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_5-R2.md`

## Claim IDs Used
- **R1 Claims**:
  - `R1.1`: Helm acts as the package manager for Kubernetes to define, install, and upgrade complex containerized applications.
  - `R1.2`: A Helm chart packages related Kubernetes resource manifests into a versioned, shareable deployable unit.
  - `R1.3`: A chart contains all resource definitions necessary to run an application or service inside Kubernetes.
  - `R1.4`: A release represents a specific running instance of a chart combined with configuration inside a Kubernetes cluster.
  - `R1.5`: Installing the same chart multiple times into a cluster creates distinct releases with unique release names.
  - `R1.6`: To create a release, Helm merges a packaged chart with values configuration typically provided via values.yaml.
  - `R1.7`: The Helm client CLI manages local chart development, repositories, and passes charts to the Helm library.
  - `R1.8`: The Helm library provides standalone execution logic that installs, upgrades, and uninstalls charts via the Kubernetes API server.
  - `R1.9`: Helm stores release metadata directly in Kubernetes Secrets within the cluster without requiring an external database.
  - `R1.10`: Tiller was completely removed in Helm 3 to eliminate complex in-cluster operator permissions and security vulnerabilities.
  - `R1.11`: With Tiller removed, Helm client operations rely strictly on the user's existing kubeconfig file and Kubernetes RBAC permissions.
  - `R1.12`: Helm 3 scopes release information to the specific namespace of the release rather than a centralized Tiller namespace.
  - `R1.13`: Secrets are the default release storage driver starting in Helm 3, replacing the ConfigMaps default used in Helm 2.
  - `R1.14`: Helm 3 introduced a three-way strategic merge patch evaluating old manifest, cluster live state, and new manifest.
  - `R1.15`: Helm 4 shifts default object management for new chart installations from client-side patching to Server-Side Apply.
  - `R1.16`: Helm encodes release metadata as a base64-encoded gzipped JSON string when persisting release objects to storage.

- **R2 Claims**:
  - `R2.1`: Helm v4.0.0 was officially released on Wednesday, November 12, 2025 at KubeCon + CloudNativeCon.
  - `R2.2`: Helm 3 bug fixes end on September 9th, 2026.
  - `R2.3`: Helm 3 final feature release on September 9th, 2026 is limited to Kubernetes client library updates with no new features backported.
  - `R2.4`: Helm 3 security fixes end on February 10th, 2027.
  - `R2.5`: After February 10th, 2027, no further Helm 3 releases of any kind will be issued.
  - `R2.6`: The default helm version output displays Version, GitCommit, GitTreeState, and GoVersion.
  - `R2.7`: The helm version --short flag prints only the version number.
  - `R2.8`: The helm version --template flag specifies a Go template format string.
  - `R2.9`: In helm version --template, .Version contains the semantic version of Helm.
  - `R2.10`: The HELM_DRIVER environment variable configures the release storage backend to configmap, secret, or sql.
  - `R2.11`: Release Secrets can be queried across all namespaces using the label owner=helm.
  - `R2.12`: Helm Secrets storage driver internally filters releases using the label selector owner=helm.
  - `R2.13`: Helm storage type constant identifying release objects in Kubernetes is sh.helm.release.v1.
  - `R2.14`: Helm generates storage keys using the format <helm_storage_type>.<release_name>.v<release_version>.
  - `R2.15`: By default, helm uninstall removes all release resources and release history.
  - `R2.16`: The helm list command lists all deployed releases.
  - `R2.17`: Helm SQL backend supports only PostgreSQL.
