export type Link = { label: string; href: string };

export interface Site {
  profile: {
    name: string;
    title: string;
    headline: string;
    subline: string;
    about: string;
    location: string;
    email: string;
  };
  links: { github: string; linkedin: string; x: string; email: string; resume: string | null };
  stats: { value: string; label: string }[];
  experience: {
    role: string;
    org: string;
    context?: string;
    location?: string;
    start: string;
    end: string;
    bullets: string[];
    links?: Link[];
  }[];
  openSource: {
    intro: string;
    items: { title: string; text: string; links: Link[] }[];
    links: Link[];
  };
  projects: {
    name: string;
    tagline: string;
    summary: string;
    details?: string;
    date: string;
    context?: string;
    tags: string[];
    links: Link[];
    /** GitHub repo slug for build-time enrichment (stars, language); optional */
    repo?: string;
  }[];
  skills: { group: string; items: string[] }[];
  education: { degree: string; school: string; date: string; detail?: string }[];
  certifications: { name: string; issuer: string; date: string }[];
  seo: { title: string; description: string; ogTitle: string; ogDescription: string; url: string };
}

const PR = (n: number): Link => ({ label: `#${n}`, href: `https://github.com/opencost/opencost/pull/${n}` });

export const site: Site = {
  profile: {
    name: "Sparsh Raj",
    title: "Backend & Platform Engineer",
    headline: "Backend & Platform Engineer",
    subline:
      "I build Java / Spring Boot microservices, Kafka event streams, and Kubernetes infrastructure on AWS, all as code. CKAD-certified and a CNCF contributor to OpenCost.",
    about:
      "I'm a backend and platform engineer. During the LFX Fall 2025 mentorship I started KubeModel, OpenCost's next-generation data model, in Go, and landed 14 merged PRs. For my MS capstone I built VibeVault: six Spring Boot 4 services on AWS EKS, coordinated through a Kafka Saga and provisioned with Terraform, with OIDC-based CI/CD so there are no static AWS keys. Before that I spent almost three years at Accenture automating Azure compliance remediation at scale.",
    location: "Bengaluru (preferred) · open to Hyderabad, Pune, or remote",
    email: "sparsh.raj30@gmail.com",
  },
  links: {
    github: "https://github.com/spa-raj",
    linkedin: "https://www.linkedin.com/in/spa-raj/",
    x: "https://x.com/spar_raj",
    email: "mailto:sparsh.raj30@gmail.com",
    // Leave this null until a resume PDF without the phone number exists (see product-spec section 7).
    resume: null,
  },
  stats: [
    { value: "14", label: "merged PRs to OpenCost (CNCF)" },
    { value: "99.3%", label: "search success at 27 ms p50 under k6 load" },
    { value: "CKAD", label: "Certified Kubernetes Application Developer" },
    { value: "4.0", label: "GPA, MS in Computer Science" },
  ],
  experience: [
    {
      role: "Open Source Contributor",
      org: "OpenCost (CNCF)",
      context: "Linux Foundation Mentorship Program (LFX, Fall 2025)",
      start: "Sep 2025",
      end: "Nov 2025",
      bullets: [
        "Started KubeModel (OpenCost's Data Model 2.0) in Go: a flat, UID-keyed package for core Kubernetes resources, with versioned binary codecs for storage.",
        "Added UID tracking across 61+ metric types and 30+ Prometheus queries, so resources that are recreated with a reused name no longer get the wrong cost attributed to them.",
        "14 merged PRs, including production bug fixes.",
      ],
      links: [{ label: "github.com/opencost/opencost", href: "https://github.com/opencost/opencost" }],
    },
    {
      role: "Cloud Engineer / Security Delivery Analyst",
      org: "Accenture",
      location: "Kolkata",
      start: "Mar 2022",
      end: "Dec 2024",
      bullets: [
        "Automated PCI-DSS, NIST, and CIS compliance remediation in PowerShell for thousands of non-compliant Azure resources, raising client compliance to 90%+.",
        "Built Azure DevOps CI/CD pipelines for policy deployment and Power BI dashboards for compliance monitoring.",
        "Led a 5-member team, trained 7 engineers, and received the Accenture ACE Extra Mile Award (FY24 Q3).",
      ],
    },
  ],
  openSource: {
    intro:
      "KubeModel is a new data model for tracking Kubernetes resources in OpenCost. It keys everything on stable UIDs, so cost data stays accurate when pods are recreated and names are reused.",
    items: [
      {
        title: "Started KubeModel in Go",
        text: "It's a flat, map-based structure keyed by UID, with versioned binary codecs for storage.",
        links: [PR(3472), PR(3443)],
      },
      {
        title: "Chose bingen over Protobuf",
        text: "Protobuf caps messages at 2 GiB and is built for the wire, not for storage.",
        links: [{ label: "bingen", href: "https://github.com/opencost/bingen" }],
      },
      {
        title: "Added UID tracking",
        text: "Across 61+ metric types and 30+ Prometheus queries for 10 Kubernetes resource kinds.",
        links: [PR(3366), PR(3384)],
      },
      {
        title: "Fixed production bugs",
        text: "AND-filter order, negative idle cost in promless mode, and GCP N4 pricing. Also wrote a 31-metric integration test suite that checks UID consistency across time windows.",
        links: [PR(3394), PR(3393), PR(3289)],
      },
      {
        title: "Wrote and presented",
        text: "Wrote the KubeModel blog post and presented the project poster at the LFX Mentorship Showcase, Open Source Summit India 2026 (Mumbai).",
        links: [{ label: "Introducing KubeModel", href: "https://www.opencost.io/blog/introducing-kubemodel" }],
      },
    ],
    links: [
      { label: "github.com/opencost/opencost", href: "https://github.com/opencost/opencost" },
      { label: "My merged PRs", href: "https://github.com/opencost/opencost/pulls?q=is%3Apr+author%3Aspa-raj+is%3Amerged" },
    ],
  },
  projects: [
    {
      name: "VibeVault",
      tagline: "Spring Boot microservices on AWS EKS",
      summary:
        "A 6-service e-commerce platform with a Kafka Saga for distributed transactions, fully provisioned with Terraform and deployed to EKS with OIDC CI/CD.",
      details:
        "6 services, 55 E2E tests, 114 PRs across 8 repos. Moved search over 2M products from MySQL LIKE (100% failure at 15 concurrent users) to OpenSearch, reaching 99.3% success at 27 ms p50.",
      date: "Feb 2026 – Mar 2026",
      context: "MS capstone",
      tags: ["Java 21", "Spring Boot 4", "Kafka (KRaft)", "AWS EKS", "Terraform", "OpenSearch", "Kong", "Helm"],
      links: [
        { label: "Repo", href: "https://github.com/spa-raj/vibevault" },
        { label: "Infra", href: "https://github.com/spa-raj/vibevault-infra" },
      ],
      repo: "spa-raj/vibevault",
    },
    {
      name: "CartIQ",
      tagline: "AI shopping assistant",
      summary:
        "A Spring Boot modular monolith that streams user events through Confluent Cloud Kafka and Flink for real-time personalization, plus a Gemini RAG chat. Deployed on Google Cloud Run.",
      date: "Dec 2025",
      context: "AI Partner Catalyst Hackathon (Confluent Challenge)",
      tags: ["Spring Boot", "Confluent Cloud Kafka", "Flink", "Gemini", "Vertex AI", "Cloud Run", "Next.js"],
      links: [
        { label: "Backend repo", href: "https://github.com/spa-raj/cartIQ-backend" },
        { label: "Frontend repo", href: "https://github.com/spa-raj/cartIQ-frontend" },
      ],
      repo: "spa-raj/cartIQ-backend",
    },
    {
      name: "PDF Whisperer",
      tagline: "RAG Q&A over PDFs",
      summary:
        "Answers questions using only the uploaded PDF and cites the pages. It runs Chroma vector search (top 25), then cross-encoder reranking (top 4), before the LLM sees anything, and keeps each user's session isolated.",
      date: "Nov 2026",
      tags: ["Python", "RAG", "Chroma", "Cross-encoder reranking", "Gradio"],
      links: [
        { label: "Live demo", href: "https://huggingface.co/spaces/spa-raj/pdf-whisperer" },
        { label: "Repo", href: "https://github.com/spa-raj/pdf-whisperer" },
      ],
      repo: "spa-raj/pdf-whisperer",
    },
    {
      name: "Family Lock",
      tagline: "Android device-owner app",
      summary:
        "An Android device-owner app that permanently blocks adult content through forced family DNS and blocking of VPN and bypass apps, with no off switch.",
      date: "",
      tags: ["Java", "Android"],
      links: [{ label: "Repo", href: "https://github.com/spa-raj/family-lock" }],
      repo: "spa-raj/family-lock",
    },
  ],
  skills: [
    { group: "Languages", items: ["Java (8 / 11 / 17 / 21)", "Go", "Python", "SQL", "Bash", "TypeScript"] },
    {
      group: "Backend",
      items: ["Spring Boot 4", "Spring Security", "JPA / Hibernate", "REST APIs", "Microservices", "Saga pattern", "Event-driven architecture", "OAuth2 / JWT"],
    },
    {
      group: "Platform & DevOps",
      items: ["Kubernetes (CKAD)", "Docker", "Helm", "Terraform", "Kong API Gateway", "GitHub Actions CI/CD (OIDC)", "Prometheus"],
    },
    {
      group: "Cloud",
      items: ["AWS (EKS, RDS, ECR, SES, OpenSearch, Secrets Manager + KMS, IAM OIDC)", "GCP (Cloud Run, Vertex AI)", "Azure (Policy, DevOps)"],
    },
    {
      group: "Data & Messaging",
      items: ["MySQL", "PostgreSQL", "MongoDB", "Redis", "OpenSearch / Elasticsearch", "Apache Kafka (KRaft)", "Confluent Cloud"],
    },
    {
      group: "Testing & AI",
      items: ["JUnit 5", "Mockito", "k6 load testing", "RAG pipelines (vector search + reranking)", "Gemini / OpenAI APIs", "Claude Code"],
    },
  ],
  education: [
    {
      degree: "MS in Computer Science",
      school: "Scaler Neovarsity – Woolf University",
      date: "Apr 2026",
      detail: "CGPA 4.0 · Coursework: DSA, System Design (HLD/LLD), Databases, Java, Spring Boot",
    },
    {
      degree: "B.Tech in Electrical and Electronics Engineering",
      school: "VIT Vellore",
      date: "Jul 2021",
      detail: "CGPA 8.66",
    },
  ],
  certifications: [
    { name: "CKAD: Certified Kubernetes Application Developer", issuer: "The Linux Foundation", date: "Nov 2026" },
  ],
  seo: {
    title: "Sparsh Raj | Backend & Platform Engineer",
    description:
      "Backend & platform engineer: Java/Spring Boot microservices, Kafka, Kubernetes on AWS. CKAD, OpenCost (CNCF) contributor with 14 merged PRs.",
    ogTitle: "Sparsh Raj, Backend & Platform Engineer",
    ogDescription:
      "Spring Boot microservices, Kafka, and Kubernetes on AWS, all as code. Started KubeModel for OpenCost (CNCF) and has 14 merged PRs.",
    url: "https://sparshraj.me/",
  },
};
