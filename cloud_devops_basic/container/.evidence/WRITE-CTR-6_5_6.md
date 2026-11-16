# Evidence Index: WRITE-CTR-6_5_6

- **Task ID**: WRITE-CTR-6_5_6
- **Assignee**: writer-2
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_5 Helm Package Management/6_5_6 Validating Charts Before Deploy.md`
- **Topic Title**: 6_5_6 Validating Charts Before Deploy
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_5-R1.md`
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_5-R2.md`

## Claim IDs Used
- **R1 Claims**:
  - `R1.25`: values.schema.json imposes a JSON Schema definition onto chart values to validate user-supplied configurations.
  - `R1.81`: helm lint examines a chart directory and runs tests to verify whether the chart is structurally well-formed.
  - `R1.82`: helm lint outputs ERROR messages for fatal installation issues and WARNING messages for convention violations.
  - `R1.83`: The --strict flag causes helm lint to fail command execution if any lint warnings are detected.
  - `R1.84`: The --with-subcharts flag directs helm lint to recursively lint all dependent subcharts.
  - `R1.85`: helm template renders chart templates locally without connecting to a cluster and displays generated manifests.
  - `R1.86`: helm template fakes in-cluster values locally and bypasses server-side API validity testing.
  - `R1.87`: --disable-openapi-validation prevents validating rendered manifests against the Kubernetes OpenAPI Schema.
  - `R1.88`: Dry-run supports client-only simulation without connections or server-side simulation validating against the cluster.
  - `R1.89`: The --show-only flag filters template rendering to output only manifests produced from specified template files.
  - `R1.90`: Kubernetes API definitions are formally specified using OpenAPI specifications tracked in the main Kubernetes repository.
  - `R1.91`: Manifest validation tooling converts OpenAPI schemas into JSON Schemas to validate manifests efficiently.
  - `R1.92`: Kubeconform validates manifests against OpenAPI specifications without evaluating controller-specific runtime checks.
  - `R1.93`: Kubeconform supports configurable remote or local schema locations for validating CRDs and enabling offline validation.
  - `R1.94`: The helm-diff plugin generates differences between the latest deployed release and proposed template manifests.
  - `R1.95`: helm-diff can compare two deployed revisions of a release to visualize differences between historical versions.

- **R2 Claims**:
  - `R2.28`: values.schema.json provides an optional JSON Schema for imposing structure on values.yaml.
  - `R2.29`: values.schema.json uses the JSON Schema Draft 7 standard.
  - `R2.92`: The helm lint command examines a chart for possible syntax, structural, and semantic issues.
  - `R2.93`: The helm lint --strict flag causes the command to fail on lint warnings.
  - `R2.94`: The helm lint --with-subcharts flag enables linting of dependent subcharts.
  - `R2.95`: The helm lint --kube-version flag specifies the target Kubernetes version for capability and deprecation checks.
  - `R2.96`: helm lint emits [ERROR] messages for install failures and [WARNING] messages for convention breaks.
  - `R2.97`: The helm template command locally renders chart templates and prints manifests to stdout.
  - `R2.98`: The --dry-run flag on helm template accepts client or server, defaulting to client.
  - `R2.99`: The helm template --include-crds flag includes Custom Resource Definitions in the templated output.
  - `R2.100`: The helm template --output-dir flag writes rendered templates into files on disk instead of stdout.
  - `R2.101`: Helm commands support --dry-run=server to validate operations against the live Kubernetes API server without persisting changes.
  - `R2.102`: Kubeconform validates Kubernetes manifests using the syntax kubeconform [OPTION]... [FILE OR FOLDER]....
  - `R2.103`: The kubeconform -strict flag disallows properties not in the schema and rejects duplicated keys.
  - `R2.104`: Kubeconform defaults -schema-location to the official yannh/kubernetes-json-schema repository.
  - `R2.105`: Kubeconform prints a validation summary report when the -summary flag is provided.
  - `R2.106`: The helm-diff plugin is installed via helm plugin install https://github.com/databus23/helm-diff.
  - `R2.107`: helm diff upgrade displays what a helm upgrade will change between current cluster state and proposed chart values.
  - `R2.108`: helm diff revision compares manifests of a release between the latest revision and a specified revision.
  - `R2.109`: helm diff revision can compare manifests between two specific historical revisions.
