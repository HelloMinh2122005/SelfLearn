---
name: azure-curriculum-guide
description: >-
  Use this skill when teaching, explaining, designing lessons, or building hands-on labs for Microsoft Azure Cloud. Covers Azure fundamentals, administration (AZ-104), development (AZ-204), solution architecture (AZ-305), Azure Architecture Center patterns, and Azure CLI/Bicep IaC.
---

# Azure Curriculum Guide Skill

This skill provides a structured framework for teaching and learning Microsoft Azure, tightly aligned with official Microsoft Learn curricula, certification blueprints, and the Azure Well-Architected Framework.

---

## 1. When to Use This Skill
- The user asks to learn, review, or practice any topic related to Microsoft Azure.
- Structuring notes, study plans, or modules under the `azure/` directory.
- Providing architectural patterns, Bicep / ARM templates, or `az` CLI examples.
- Mapping learning progress to Microsoft credentials (AZ-900, AZ-104, AZ-204, AZ-305).

---

## 2. Core Learning Domains & Official Mapping

### Domain 1: Fundamentals & Governance (AZ-900 Foundation)
- **Core Concepts**: Cloud models (Public/Private/Hybrid, IaaS/PaaS/SaaS), Regions, Availability Zones, Geographies.
- **Identity & Access**: Microsoft Entra ID (formerly Azure AD), RBAC (Role-Based Access Control), PIM (Privileged Identity Management), Managed Identities.
- **Governance**: Azure Policy, Resource Groups, Subscriptions, Management Groups, Tags, Cost Management & Budgets.
- *Official Reference*: `https://learn.microsoft.com/credentials/certifications/azure-fundamentals/`

### Domain 2: Networking & Security (AZ-104 Core)
- **Virtual Networks**: VNet, Subnets, Private/Public IP, NSG (Network Security Groups), ASG (Application Security Groups).
- **Hybrid & Connectivity**: VNet Peering (Regional & Global), VPN Gateway, ExpressRoute, Azure Bastion.
- **Traffic Routing & Balancing**: Azure Load Balancer (L4), Azure Application Gateway (L7, WAF), Azure Front Door, Azure Traffic Manager.
- **Secure Endpoints**: Service Endpoints vs Private Endpoints (Azure Private Link).
- *Official Reference*: `https://learn.microsoft.com/azure/virtual-network/`

### Domain 3: Compute & Containers (AZ-104 & AZ-204)
- **Virtual Machines**: VM Scale Sets (VMSS), Disks (Standard/Premium SSD, Ultra Disk), Auto-scaling.
- **PaaS & Serverless**: Azure App Service, Azure Functions (Triggers, Bindings, Consumption vs Premium plan).
- **Containers**: Azure Container Instances (ACI), Azure Container Apps (ACA), Azure Kubernetes Service (AKS).
- *Official Reference*: `https://learn.microsoft.com/azure/app-service/`, `https://learn.microsoft.com/azure/aks/`

### Domain 4: Storage & Data Services (AZ-104 & AZ-204)
- **Azure Storage**: Blob Storage (Hot, Cool, Cold, Archive), Data Lake Storage Gen2, Azure Files, Table Storage, Queue Storage. Redundancy options (LRS, ZRS, GRS, GZRS).
- **Databases**: Azure SQL Database, Azure Database for PostgreSQL/MySQL, Azure Cosmos DB (Request Units, APIs, Consistency Levels).
- *Official Reference*: `https://learn.microsoft.com/azure/storage/`, `https://learn.microsoft.com/azure/cosmos-db/`

### Domain 5: Architecture & Design (AZ-305 & Well-Architected)
- **Microsoft Well-Architected Framework**:
  1. Reliability
  2. Security
  3. Cost Optimization
  4. Operational Excellence
  5. Performance Efficiency
- **Cloud Design Patterns**: Hub-Spoke network topology, CQRS, Circuit Breaker, Competing Consumers, Gateway Offloading.
- *Official Reference*: `https://learn.microsoft.com/azure/architecture/patterns/`, `https://learn.microsoft.com/azure/well-architected/`

---

## 3. Teaching & Output Guidelines for Azure Topics

1. **Always use modern naming**:
   - Use `Microsoft Entra ID` (never plain Azure Active Directory / AAD unless explaining history).
   - Use `Azure Container Apps` or `AKS` for modern container workloads.
2. **Command-line First (Azure CLI)**:
   - Provide comprehensive, production-ready `az` CLI snippets (do not include Bicep templates unless explicitly requested).
3. **Diagrams, Official Media & Real-World Analogies**:
   - Create clear Mermaid diagrams showing Subscription/Resource Group boundaries, VNets, Subnets, and Network Security Groups.
   - **Embed official Microsoft Learn diagrams and architecture media** via public CDN (`https://learn.microsoft.com/.../media/...`) or GitHub `MicrosoftDocs/azure-docs` to give students authoritative visual references.
   - Include intuitive real-world analogies (ví dụ đời sống thực tế dễ hiểu) to explain complex cloud resource concepts clearly.
4. **Mandatory Citations**:
   - Must include direct links to `learn.microsoft.com/azure/...`.
5. **Hierarchical 3-Tier Curriculum Directory Structure**:
   - Level 1: `<N> Domain <N> - <Domain Name>` (e.g., `1 Domain 1 - Manage Azure identities and governance`)
   - Level 2: `<N>_<M> <Topic Name>` (e.g., `1_1 Manage Microsoft Entra users and groups`)
   - Level 3: `<N>_<M>_<P> <Lesson Name>.md` (e.g., `1_1_1 Create users and groups.md`)
   - Standard lesson file structure:
     1. Core Concepts & Cloud Resources Deep Dive
     2. Intuitive Real-World Analogy (Ví dụ đời sống thực tế)
     3. Architecture, Data Flow & Official Diagrams (Mermaid + Official MS Learn Images)
     4. Hands-on Azure CLI (chỉ lệnh `az` CLI)
     5. Official Tier-1 References



