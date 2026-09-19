---
name: aws-curriculum-guide
description: >-
  Use this skill when teaching, explaining, designing lessons, or building hands-on labs for Amazon Web Services (AWS). Covers AWS fundamentals, Solutions Architect (SAA-C03), Developer (DVA-C02), AWS Well-Architected Framework, AWS Whitepapers, and AWS CLI v2 / CDK / Terraform.
---

# AWS Curriculum Guide Skill

This skill provides a structured framework for teaching and learning Amazon Web Services (AWS), aligned with official AWS Documentation, certification exam guides, and the AWS Well-Architected Framework.

---

## 1. When to Use This Skill
- The user asks to learn, review, or practice any topic related to AWS Cloud.
- Structuring notes, study plans, or modules under the `aws/` directory.
- Providing architectural patterns, CloudFormation / CDK / Terraform code, or `aws` CLI v2 examples.
- Mapping learning progress to AWS certifications (CLF-C02, SAA-C03, DVA-C02, SAP-C02).

---

## 2. Core Learning Domains & Official Mapping

### Domain 1: IAM & Security Foundations
- **Identity & Access Management (IAM)**: Users, Groups, Roles, Policies (Identity-based, Resource-based, SCPs, Permission Boundaries), MFA.
- **AWS Organizations**: Multi-account strategy, SCPs (Service Control Policies), AWS Control Tower.
- **Security & Compliance**: AWS KMS (Envelope Encryption, Customer Managed vs AWS Managed keys), AWS Secrets Manager, AWS CloudTrail, Amazon GuardDuty.
- *Official Reference*: `https://docs.aws.amazon.com/IAM/latest/UserGuide/`

### Domain 2: Networking & Content Delivery (VPC Core)
- **Amazon VPC**: Subnets (Public vs Private), Route Tables, Internet Gateway (IGW), NAT Gateway, Security Groups vs Network ACLs (NACLs).
- **Hybrid & Peering**: VPC Peering, AWS Transit Gateway, AWS Direct Connect, Site-to-Site VPN.
- **Traffic Routing**: Application Load Balancer (ALB), Network Load Balancer (NLB), Amazon Route 53 (Routing policies: Weighted, Latency, Failover, Geolocation).
- **Edge & Content**: Amazon CloudFront, AWS WAF, AWS Shield.
- **Private Connectivity**: VPC Endpoints (Interface Endpoints via AWS PrivateLink vs Gateway Endpoints for S3/DynamoDB).
- *Official Reference*: `https://docs.aws.amazon.com/vpc/latest/userguide/`

### Domain 3: Compute & Serverless
- **Amazon EC2**: Instance types, Purchasing options (On-Demand, Spot, Savings Plans, Reserved), Auto Scaling Groups (ASG), Launch Templates.
- **Containers**: Amazon ECS (EC2 launch type vs AWS Fargate), Amazon ECR, Amazon EKS.
- **Serverless**: AWS Lambda (Execution model, Cold starts, Concurrency, Event Source Mappings), Amazon API Gateway (REST vs HTTP APIs).
- *Official Reference*: `https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/`, `https://docs.aws.amazon.com/lambda/latest/dg/`

### Domain 4: Storage & Databases
- **Storage**: Amazon S3 (Storage classes: Standard, Intelligent-Tiering, Glacier Flexible/Deep Archive, Lifecycle policies, S3 Bucket Policies, CORS), Amazon EBS (gp3, io2), Amazon EFS.
- **Databases**: Amazon RDS (Multi-AZ vs Read Replicas), Amazon Aurora (Aurora Serverless, Global Database), Amazon DynamoDB (Partition key, Sort key, GSI, LSI, WCU/RCU, On-demand vs Provisioned capacity).
- *Official Reference*: `https://docs.aws.amazon.com/s3/`, `https://docs.aws.amazon.com/amazondynamodb/`

### Domain 5: Messaging & Event-Driven Architecture
- **Messaging**: Amazon SQS (Standard vs FIFO, Visibility Timeout, Dead-Letter Queues), Amazon SNS (Pub/Sub fan-out pattern), Amazon EventBridge (Event Buses, Rules, Schema Registry).
- **AWS Step Functions**: State machines for distributed transaction orchestration (Saga pattern).
- *Official Reference*: `https://docs.aws.amazon.com/sqs/`, `https://docs.aws.amazon.com/eventbridge/`

### Domain 6: AWS Well-Architected Framework (6 Pillars)
1. **Operational Excellence**
2. **Security**
3. **Reliability**
4. **Performance Efficiency**
5. **Cost Optimization**
6. **Sustainability**
- *Official Reference*: `https://aws.amazon.com/architecture/well-architected/`

---

## 3. Teaching & Output Guidelines for AWS Topics

1. **Version Accuracy**:
   - Always assume AWS CLI v2 (`aws --version`).
   - Use modern AWS SDK v3 for JavaScript/TypeScript or latest Boto3 for Python.
2. **Infrastructure-as-Code First**:
   - Provide AWS CDK (TypeScript/Python) or Terraform / CloudFormation snippets alongside CLI.
3. **Cost Awareness**:
   - Always warn about services that incur immediate costs (e.g. NAT Gateway hourly charges, idle ALB, provisioned IOPS).
4. **Mandatory Citations**:
   - Include direct links to `docs.aws.amazon.com/...`.
