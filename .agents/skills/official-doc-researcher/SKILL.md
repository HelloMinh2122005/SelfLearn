---
name: official-doc-researcher
description: >-
  Use this skill whenever looking up technical specifications, cloud service features, CLI command syntax, API limits, or library documentation. It enforces searching authoritative official sources (Microsoft Learn, AWS Docs, Oracle Java SE, OpenJDK, Spring.io) and formatting strict citations.
---

# Official Doc Researcher Skill

This skill guides the agent to look up, verify, and cite authoritative documentation to guarantee 100% truthfulness and eliminate hallucinations.

---

## 1. When to Use This Skill
- The user asks about any cloud service (Azure, AWS), Java language feature, or framework.
- The user requests CLI command syntax, configuration parameters, quotas/limits, or code examples.
- The agent needs to verify whether a feature is in GA (General Availability) or Preview.
- The agent needs to retrieve direct documentation links for citations.

---

## 2. Authoritative Domain Mapping

When querying search engines or looking up docs, restrict or prioritize these official domains:

| Topic / Ecosystem | Target Domains | Search Query Pattern Example |
| :--- | :--- | :--- |
| **Azure Services** | `learn.microsoft.com/azure` | `site:learn.microsoft.com/azure "azure blob storage" access tiers` |
| **Azure Architecture** | `learn.microsoft.com/azure/architecture` | `site:learn.microsoft.com/azure/architecture hub-spoke network` |
| **Azure CLI** | `learn.microsoft.com/cli/azure` | `site:learn.microsoft.com/cli/azure az vm create parameters` |
| **AWS Documentation** | `docs.aws.amazon.com` | `site:docs.aws.amazon.com "Amazon S3" storage classes` |
| **AWS Architecture** | `aws.amazon.com/architecture` | `site:aws.amazon.com/architecture well-architected framework reliability` |
| **AWS CLI** | `awscli.amazonaws.com` | `site:awscli.amazonaws.com aws s3 sync` |
| **Java SE Specs & API** | `docs.oracle.com/en/java/javase` | `site:docs.oracle.com/en/java/javase/21 VirtualThread api` |
| **OpenJDK Features/JEPs**| `openjdk.org/jeps` | `site:openjdk.org/jeps 444 virtual threads` |
| **Spring Framework / Boot**| `docs.spring.io` | `site:docs.spring.io/spring-boot/docs "spring boot 3" security configuration` |
| **Jakarta EE** | `jakarta.ee/specifications` | `site:jakarta.ee persistence specification` |
| **React (Core & Hooks)** | `react.dev` | `site:react.dev/learn "render and commit"` |
| **Vite Tooling** | `vite.dev` | `site:vite.dev/guide "why vite"` |
| **MDN Web Docs (Web Standards)** | `developer.mozilla.org` | `site:developer.mozilla.org/en-US/docs/Web/JavaScript EventLoop` |
| **Vitest** | `vitest.dev` | `site:vitest.dev/guide component testing` |
| **React Router** | `reactrouter.com` | `site:reactrouter.com createBrowserRouter` |

---

## 3. Workflow Steps

### Step 1: Formulate Targeted Search Query
Construct a query combining the exact service/feature name with the authoritative domain filter:
- Use `search_web(query='site:learn.microsoft.com/azure <specific_topic>')` for Azure.
- Use `search_web(query='site:docs.aws.amazon.com <specific_topic>')` for AWS.
- Use `search_web(query='site:docs.oracle.com/en/java/javase/21 <topic>')` for Java 21.
- Use `search_web(query='site:react.dev/learn <topic>')` for React.
- Use `search_web(query='site:vite.dev/guide <topic>')` for Vite.

### Step 2: Read & Verify via Official URL
- If the snippet in search results is insufficient or needs deep verification, call `read_url_content(Url='<official_url>')` to inspect the exact section, parameter descriptions, or code snippet.
- Verify constraints: quotas, supported regions, deprecated parameters, and minimum version requirements.

### Step 3: Synthesize with Strict Truthfulness
- Present facts directly backed by the retrieved documentation.
- If there is ambiguity or conflicting information across versions, explicitly state the distinction.
- Include the exact URL link in the response.

### Step 4: Add Official Citations
Always conclude the explanation with:
```markdown
## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [Official Page Title](Exact_URL) - Brief description of what is referenced.
```
