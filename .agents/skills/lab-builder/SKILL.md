---
name: lab-builder
description: >-
  Use this skill when designing, scaffolding, or implementing reproducible hands-on coding labs, mini-projects, or infrastructure exercises in the SelfLearn workspace. Ensures step-by-step guidance, acceptance criteria, self-verification scripts, and cleanup commands.
---

# Hands-on Lab Builder Skill

This skill standardizes the creation of practical, self-contained learning labs across Azure, AWS, and Java modules.

---

## 1. When to Use This Skill
- The user asks for a practice exercise, coding challenge, or lab to apply theoretical knowledge.
- Creating a new subfolder under `azure/labs/`, `aws/labs/`, or `java/labs/`.
- Scaffolding mini-projects with reproducible setup (Docker Compose, Terraform, Maven/Gradle, Makefile).

---

## 2. Standard Lab Directory Structure

Each lab must be placed inside its relevant domain's `labs/` directory:

```text
<domain>/labs/lab-<index>-<short-slug>/
├── README.md               # Lab instructions, architecture, steps, and verification
├── setup/                  # Prerequisites or starter code (e.g., pom.xml, terraform files)
├── solution/               # Complete reference implementation (optional or separate branch/folder)
└── scripts/
    ├── verify.sh           # Automated script to check if the lab goals are completed
    └── cleanup.sh          # Crucial for Cloud: teardown all created cloud resources to prevent costs!
```

---

## 3. Lab `README.md` Template

Every lab's `README.md` must adhere to this structure:

```markdown
# Lab <Index>: <Lab Title>

## 🎯 Objective
A concise statement of what the learner will build, configure, and understand upon completing this lab.

## ⏱️ Estimated Time & Cost
- **Estimated Time**: 30 - 45 minutes.
- **Estimated Cost**: Free tier eligible / ~$0.10 (explicit warning of chargeable resources).

## 📋 Prerequisites
- Required tools: (e.g. `az cli >= 2.50`, `Docker`, `JDK 21`).
- Permissions/Accounts needed.

## 🏗️ Architecture Diagram
\`\`\`mermaid
graph LR
   ...
\`\`\`

## 📝 Step-by-Step Instructions
### Step 1: Environment Setup & Resource Group
...
### Step 2: Implementation / Deployment
...
### Step 3: Verification & Testing
...

## 🧪 Acceptance Criteria & Automated Verification
How the learner knows they succeeded:
- Run `./scripts/verify.sh`
- Expected output:
  \`\`\`text
  [PASS] Resource Group exists
  [PASS] Private Endpoint connected
  [PASS] HTTP Status 200 OK returned
  \`\`\`

## 🧹 Teardown & Cost Cleanup (CRITICAL)
Always provide explicit teardown instructions so the learner doesn't incur unexpected charges:
\`\`\`bash
# Azure:
az group delete --name rg-selflearn-lab --yes --no-wait

# AWS:
aws cloudformation delete-stack --stack-name selflearn-lab-stack
\`\`\`

## 📚 Official References
- Direct documentation links for all services used in this lab.
```

---

## 4. Quality Rules for Lab Generation
1. **Always Include Cleanup**: For cloud labs (Azure/AWS), failing to provide cleanup commands is unacceptable.
2. **Deterministic & Testable**: Provide concrete assertions (e.g. `curl -f http://...`, `mvn test`, `az network vnet show ...`).
3. **Least Privilege**: In cloud labs, always create scoped resource groups or IAM roles rather than asking the user to run as root/owner.
