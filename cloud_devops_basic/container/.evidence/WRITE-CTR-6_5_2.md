# Evidence Index: WRITE-CTR-6_5_2

- **Task ID**: WRITE-CTR-6_5_2
- **Assignee**: writer-2
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_5 Helm Package Management/6_5_2 Chart Structure.md`
- **Topic Title**: 6_5_2 Chart Structure
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_5-R1.md`
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_5-R2.md`

## Claim IDs Used
- **R1 Claims**:
  - `R1.17`: Helm reserves the use of charts/, crds/, and templates/ directories and standard file names within a chart.
  - `R1.18`: The Chart.yaml file is mandatory for all charts and must specify the chart API version field.
  - `R1.19`: The version field in Chart.yaml dictates the chart package name and must match package name versioning.
  - `R1.20`: appVersion represents the contained application version, is informational, and does not affect chart version calculations.
  - `R1.21`: Wrapping appVersion in quotes is strongly recommended to prevent YAML parsers from misinterpreting version numbers.
  - `R1.22`: The chart type field distinguishes between application charts (the default standard chart) and library charts.
  - `R1.23`: Library charts provide utilities or functions, are not installable standalone, and generally do not contain resource objects.
  - `R1.24`: An application chart can function as a library chart by explicitly setting type to library in its Chart.yaml.
  - `R1.25`: values.schema.json imposes a JSON Schema definition onto chart values to validate user-supplied configurations.
  - `R1.26`: Schema validation runs automatically whenever helm install, upgrade, template, or lint commands are executed.
  - `R1.27`: JSON Schema validation is applied to the final merged .Values object rather than just the raw values.yaml file.
  - `R1.28`: Parent chart configurations cannot circumvent subchart schemas because the final .Values is checked against all subchart schemas.
  - `R1.29`: CRDs must be placed in the crds/ directory and cannot be templated, requiring plain YAML documents.
  - `R1.30`: When installing a chart, Helm uploads CRDs and pauses until the API server makes them available before rendering templates.
  - `R1.31`: CRDs are never reinstalled or installed during upgrade or rollback operations, and Helm never deletes CRDs.
  - `R1.32`: The .helmignore file defines files to exclude from charts and must reside in the chart root directory next to Chart.yaml.
  - `R1.33`: .helmignore relies on Go filepath.Match and does not support recursive double-asterisk matching.

- **R2 Claims**:
  - `R2.18`: The Chart.yaml file is required for a Helm chart.
  - `R2.19`: The apiVersion field must be v2 for Helm charts that require at least Helm 3.
  - `R2.20`: The name field in Chart.yaml is required and specifies the chart name.
  - `R2.21`: The version field in Chart.yaml is required and must follow SemVer 2.
  - `R2.22`: The kubeVersion field in Chart.yaml optionally specifies a SemVer range of compatible Kubernetes versions.
  - `R2.23`: The description field in Chart.yaml provides a single-sentence project description.
  - `R2.24`: Chart types can be either application or library, with application being the default.
  - `R2.25`: The appVersion field in Chart.yaml is optional and specifies the application version without needing to be SemVer.
  - `R2.26`: Wrapping appVersion in quotes in Chart.yaml avoids YAML parser float or scientific notation issues.
  - `R2.27`: The deprecated field in Chart.yaml is an optional boolean used to mark a chart as deprecated.
  - `R2.28`: values.schema.json provides an optional JSON Schema for imposing structure on values.yaml.
  - `R2.29`: values.schema.json uses the JSON Schema Draft 7 standard.
  - `R2.30`: Schema validation runs automatically on helm install, upgrade, lint, and template commands.
  - `R2.31`: helm create NAME scaffolds a chart directory along with standard files and directories.
  - `R2.32`: The crds directory in a chart holds CRDs that are installed without templating during helm install.
  - `R2.33`: Any unknown Chart.yaml fields are silently dropped and not passed to templates.
