# 🧩 MicroOS — Kubernetes Microservices Demo

> A full-stack food ordering application built with a microservices architecture, containerized with Docker, orchestrated on Kubernetes (Minikube), and automated with a Jenkins CI/CD pipeline.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Services](#-services)
  - [Auth Service](#-auth-service)
  - [User Service](#-user-service)
  - [Order Service](#-order-service)
  - [Frontend](#-frontend)
- [Kubernetes Infrastructure](#-kubernetes-infrastructure)
  - [Deployments](#deployments)
  - [Services & Networking](#services--networking)
  - [Ingress Routing](#ingress-routing)
- [CI/CD Pipeline (Jenkins)](#-cicd-pipeline-jenkins)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Local Development Setup](#-local-development-setup)
- [Security Notes](#-security-notes)

---

## 🌐 Project Overview

**MicroOS** is a Kubernetes-native demo application that simulates a food ordering platform. It is designed to demonstrate core microservices principles:

- **Independent services** — each backend service (Auth, User, Order) is developed, containerized, and deployed independently.
- **Centralized routing** — a single Ingress controller acts as the gateway and routes traffic to the correct backend based on the URL path.
- **Automated delivery** — a Jenkins pipeline (running inside the cluster) automatically builds Docker images and deploys them to Kubernetes on every push.
- **Minimal frontend** — a Next.js frontend talks to all three backend services through relative API paths routed via the Ingress.

---

## 🏗 Architecture

### High-Level System Architecture

```
                         ┌──────────────────────────────────────────────────┐
                         │                  Minikube Cluster                │
                         │                                                  │
  User / Browser         │   ┌─────────────────────────────────────────┐   │
       │                 │   │           Ingress Controller             │   │
       │  myapp.local    │   │         (nginx / host: myapp.local)      │   │
       └────────────────►│   └────┬──────────┬──────────┬──────────┬───┘   │
                         │        │          │          │          │        │
                         │        ▼          ▼          ▼          ▼        │
                         │  /api/auth  /api/users /api/orders    /          │
                         │        │          │          │          │        │
                         │   ┌────┴───┐ ┌───┴───┐ ┌───┴────┐ ┌──┴──────┐  │
                         │   │  Auth  │ │ User  │ │ Order  │ │Frontend │  │
                         │   │Service │ │Service│ │Service │ │Service  │  │
                         │   │:3001   │ │:3002  │ │:3003   │ │:3000    │  │
                         │   └────────┘ └───────┘ └────────┘ └─────────┘  │
                         │                                                  │
                         └──────────────────────────────────────────────────┘
```

### CI/CD Pipeline Flow

```
  Developer pushes code
          │
          ▼
   GitHub Repository
          │
          │  Webhook trigger
          ▼
   Jenkins (in-cluster)
          │
          ├──► Build Auth Service Docker image
          ├──► Build User Service Docker image
          ├──► Build Order Service Docker image
          ├──► Build Frontend Docker image
          │
          ▼
   Push all images to Docker Hub
          │
          ▼
   kubectl apply -f k8s/
          │
          ├──► Rolling update: auth-deployment
          ├──► Rolling update: user-deployment
          ├──► Rolling update: order-deployment
          └──► Rolling update: frontend-deployment
```

### Ingress Routing Map

```
myapp.local
├── /api/auth    ──► auth-service:3001
├── /api/users   ──► user-service:3002
├── /api/orders  ──► order-service:3003
└── /            ──► frontend-service:3000
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (React, TypeScript) |
| Backend Services | Node.js + Express.js |
| Containerization | Docker |
| Orchestration | Kubernetes (Minikube) |
| CI/CD | Jenkins (deployed in-cluster) |
| Image Registry | Docker Hub (`manoharn0441`) |
| Ingress | Kubernetes Nginx Ingress |
| HTTP Client (FE) | Axios |
| UI Animations | Framer Motion |

---

## 📁 Project Structure

```
microos/
├── auth-service/
│   ├── index.js            # Express app — login endpoint
│   ├── package.json
│   └── Dockerfile
│
├── user-service/
│   ├── index.js            # Express app — user CRUD
│   ├── package.json
│   └── Dockerfile
│
├── order-service/
│   ├── index.js            # Express app — order CRUD
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── app/
│   │   └── page.tsx        # Main Next.js page
│   ├── .env.local          # Environment variable config
│   └── Dockerfile
│
├── k8s/
│   ├── auth-deployment.yaml
│   ├── auth-service.yaml
│   ├── user-deployment.yaml
│   ├── user-service.yaml
│   ├── order-deployment.yaml
│   ├── order-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── frontend-ingress.yaml
│   ├── jenkins-setup.yaml      # Namespace + PVC
│   ├── jenkins-deployment.yaml # Jenkins pod + service
│   └── jenkins-rbac.yaml       # ServiceAccount + ClusterRoleBinding
│
├── Jenkinsfile                  # Declarative CI/CD pipeline
└── kubeconfig-final.yaml        # Kubeconfig for Minikube access
```

---

## ⚙️ Services

### 🔐 Auth Service

**Port:** `3001`  
**Docker Image:** `manoharn0441/auth-service:latest`  
**Kubernetes Replicas:** 2

A lightweight Express.js service responsible for authenticating users.

**Endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check — returns `{ status: "OK" }` |
| `GET` | `/` | Root — confirms service is running |
| `POST` | `/api/auth/login` | Authenticates a user with username + password |

**Login Logic:**
- Accepts `{ username, password }` in the request body.
- Returns a token (`abc123`) on success.
- Returns `401 Unauthorized` on failure.

> ⚠️ **Note:** Credentials are currently hardcoded (`admin` / `1234`) and the token is a static string. See [Security Notes](#-security-notes).

---

### 👤 User Service

**Port:** `3002`  
**Docker Image:** `manoharn0441/user-service:latest`  
**Kubernetes Replicas:** 2

Manages users. Pre-seeded with one user (`{ id: 1, name: "Manohar" }`) stored in-memory.

**Endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check — returns `{ status: "OK" }` |
| `GET` | `/` | Root — confirms service is running |
| `GET` | `/api/users` | Returns the list of all users |
| `POST` | `/api/users` | Adds a new user — accepts any JSON body |

> ⚠️ **Note:** Data is stored in-memory and is lost on pod restart. No database is connected.

---

### 📦 Order Service

**Port:** `3003`  
**Docker Image:** `manoharn0441/order-service:latest`  
**Kubernetes Replicas:** 2

Handles order creation and retrieval. Orders stored in-memory.

**Endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check — returns `{ status: "OK" }` |
| `GET` | `/` | Root — confirms service is running |
| `GET` | `/api/orders` | Returns the list of all orders |
| `POST` | `/api/orders` | Creates a new order — accepts `{ id, user, items }` |

> ⚠️ **Note:** Data is stored in-memory and is lost on pod restart.

---

### 🖥 Frontend

**Port:** `3000`  
**Docker Image:** `manoharn0441/frontend:latest`  
**Kubernetes Replicas:** 1  
**Framework:** Next.js 14 (App Router)

A dark-themed UI built in TypeScript + Tailwind CSS with Framer Motion animations.

**Features:**
- 🟢 **Live Cluster Status panel** — polls auth, users, and orders every 5 seconds and shows UP / DOWN / CHECKING status per service.
- 🛒 **Food Menu Modal** — lists Burger (₹120), Pizza (₹250), Pasta (₹180).
- 🧺 **Cart Modal** — allows quantity adjustment, shows running total, lets user place or clear the order.
- 👤 **User context** — fetches the user list on load and sets the first user as the active user.
- 📡 **All API calls are relative** (`/api/...`) — routed through the Ingress, no hardcoded backend URLs.

**Environment Variables (`.env.local`):**

```env
NEXT_PUBLIC_AUTH_URL=/api/auth
NEXT_PUBLIC_USERS_URL=/api/users
NEXT_PUBLIC_ORDERS_URL=/api/orders
```

---

## ☸️ Kubernetes Infrastructure

### Deployments

| Deployment | Image | Replicas | Container Port |
|---|---|---|---|
| `auth-deployment` | `manoharn0441/auth-service:latest` | 2 | 3001 |
| `user-deployment` | `manoharn0441/user-service:latest` | 2 | 3002 |
| `order-deployment` | `manoharn0441/order-service:latest` | 2 | 3003 |
| `frontend-deployment` | `manoharn0441/frontend:latest` | 1 | 3000 |
| `jenkins` (namespace: `jenkins`) | `jenkins/jenkins:lts` | 1 | 8080, 50000 |

All application deployments use `imagePullPolicy: Always` to ensure the latest image is pulled on every pod restart.

---

### Services & Networking

All backend services are exposed as `NodePort` for direct Minikube access during development.

| Service | Type | Port | NodePort |
|---|---|---|---|
| `auth-service` | NodePort | 3001 | 30007 |
| `user-service` | NodePort | 3002 | 30008 |
| `order-service` | NodePort | 3003 | 30009 |
| `frontend-service` | NodePort | 3000 | 30010 |
| `jenkins-service` (ns: `jenkins`) | NodePort | 8080 | 32000 |

---

### Ingress Routing

The `frontend-ingress` resource is the single entry point for all traffic to the application via the host `myapp.local`.

```yaml
# Routing rules (frontend-ingress.yaml)
host: myapp.local
  /api/auth    → auth-service:3001
  /api/users   → user-service:3002
  /api/orders  → order-service:3003
  /            → frontend-service:3000
```

To access the app locally, add this to your `/etc/hosts` (or `C:\Windows\System32\drivers\etc\hosts` on Windows):

```
<minikube-ip>  myapp.local
```

Get your Minikube IP with:
```bash
minikube ip
```

---

### Jenkins Infrastructure

Jenkins runs inside the cluster in its own namespace (`jenkins`) with the following setup:

```
jenkins (namespace)
├── Namespace          — jenkins-setup.yaml
├── PersistentVolumeClaim (5Gi) — jenkins-setup.yaml
├── Deployment         — jenkins-deployment.yaml
│     └── Pod: jenkins/jenkins:lts
│           ├── Port 8080 (UI)
│           └── Port 50000 (Agent)
├── Service (NodePort 32000) — jenkins-deployment.yaml
└── RBAC               — jenkins-rbac.yaml
      ├── ServiceAccount: jenkins-admin
      └── ClusterRoleBinding → cluster-admin
```

> ⚠️ Jenkins is bound to `cluster-admin`. This grants full cluster access. See [Security Notes](#-security-notes).

---

## 🔄 CI/CD Pipeline (Jenkins)

The `Jenkinsfile` defines a declarative pipeline that is triggered automatically via a **GitHub webhook** on every push.

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────┐
│                    Jenkins Pipeline                     │
│                                                         │
│  Stage 1: Test          ── Echo webhook confirmation    │
│                                                         │
│  Stage 2: Test Docker   ── Verify Docker is available   │
│                                                         │
│  Stage 3: Build Auth    ── docker build auth-service    │
│                                                         │
│  Stage 4: Build User    ── docker build user-service    │
│                                                         │
│  Stage 5: Build Order   ── docker build order-service   │
│                                                         │
│  Stage 6: Build Frontend── docker build frontend        │
│                                                         │
│  Stage 7: Push Images   ── docker push all 4 images     │
│           (uses 'docker-creds' Jenkins credential)      │
│                                                         │
│  Stage 8: Deploy to K8s ── kubectl apply -f k8s/        │
│           (runs in lachlanevenson/k8s-kubectl container) │
│           (uses 'kubeconfig' Jenkins file credential)   │
│           ├── set image auth-deployment                 │
│           ├── set image user-deployment                 │
│           ├── set image order-deployment                │
│           ├── set image frontend-deployment             │
│           └── rollout status (wait for all to be ready) │
│                                                         │
│  Post: Always           ── docker logout                │
└─────────────────────────────────────────────────────────┘
```

### Environment Variables (Jenkinsfile)

| Variable | Value | Description |
|---|---|---|
| `DOCKER_HUB` | `manoharn0441` | Docker Hub username |
| `IMAGE_TAG` | `${BUILD_NUMBER}` | Unique tag per build using Jenkins build number |

### Required Jenkins Credentials

You must configure these in **Jenkins → Manage Jenkins → Credentials**:

| Credential ID | Type | Purpose |
|---|---|---|
| `docker-creds` | Username + Password | Docker Hub login for pushing images |
| `kubeconfig` | Secret File | Kubeconfig file for `kubectl` to access the cluster |

---

## 🌍 Environment Variables

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_AUTH_URL=/api/auth
NEXT_PUBLIC_USERS_URL=/api/users
NEXT_PUBLIC_ORDERS_URL=/api/orders
```

All values are relative paths — traffic is routed through the Kubernetes Ingress. Do not use absolute URLs (like `http://localhost:3001`) in production; the Ingress handles all routing.

---

## 📡 API Reference

### Auth Service (`/api/auth`)

#### `POST /api/auth/login`

**Request:**
```json
{
  "username": "admin",
  "password": "1234"
}
```

**Response (200 OK):**
```json
{
  "message": "Login Successful",
  "token": "abc123"
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Invalid Credentials"
}
```

---

### User Service (`/api/users`)

#### `GET /api/users`

**Response (200 OK):**
```json
[
  { "id": 1, "name": "Manohar" }
]
```

#### `POST /api/users`

**Request:**
```json
{
  "id": 2,
  "name": "Alice"
}
```

**Response (200 OK):**
```json
{
  "message": "User added",
  "user": { "id": 2, "name": "Alice" }
}
```

---

### Order Service (`/api/orders`)

#### `GET /api/orders`

**Response (200 OK):**
```json
[
  {
    "id": "1712345678901",
    "user": { "id": 1, "name": "Manohar" },
    "items": [
      { "id": "1", "name": "Burger", "price": 120, "quantity": 2 }
    ]
  }
]
```

#### `POST /api/orders`

**Request:**
```json
{
  "id": "1712345678901",
  "user": { "id": 1, "name": "Manohar" },
  "items": [
    { "id": "1", "name": "Burger", "price": 120, "quantity": 2 }
  ]
}
```

**Response (200 OK):**
```json
{
  "message": "Order created",
  "order": { ... }
}
```

---

## 🚀 Local Development Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Node.js 18+](https://nodejs.org/)

---

### Step 1 — Start Minikube

```bash
minikube start
minikube addons enable ingress
```

### Step 2 — Deploy Jenkins

```bash
kubectl apply -f k8s/jenkins-setup.yaml
kubectl apply -f k8s/jenkins-rbac.yaml
kubectl apply -f k8s/jenkins-deployment.yaml
```

Access Jenkins at `http://<minikube-ip>:32000`

Get the initial admin password:
```bash
kubectl exec -n jenkins <jenkins-pod-name> -- cat /var/jenkins_home/secrets/initialAdminPassword
```

### Step 3 — Configure Jenkins Credentials

In Jenkins UI:
1. Go to **Manage Jenkins → Credentials → Global → Add Credentials**
2. Add `docker-creds` (Username + Password for Docker Hub)
3. Add `kubeconfig` (Secret File — upload `kubeconfig-final.yaml`)

### Step 4 — Deploy Application Manually (first time)

```bash
kubectl apply -f k8s/auth-deployment.yaml
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/user-deployment.yaml
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/order-deployment.yaml
kubectl apply -f k8s/order-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/frontend-ingress.yaml
```

Or apply everything at once:
```bash
kubectl apply -f k8s/
```

### Step 5 — Add Hosts Entry

Get Minikube IP:
```bash
minikube ip
```

Add to `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
```
<minikube-ip>  myapp.local
```

### Step 6 — Access the App

| Service | URL |
|---|---|
| Frontend | http://myapp.local |
| Auth Service (direct) | http://`<minikube-ip>`:30007 |
| User Service (direct) | http://`<minikube-ip>`:30008 |
| Order Service (direct) | http://`<minikube-ip>`:30009 |
| Jenkins | http://`<minikube-ip>`:32000 |

### Step 7 — Verify All Pods Are Running

```bash
kubectl get pods
kubectl get pods -n jenkins
kubectl get ingress
```

---

### Running Services Locally (Without Kubernetes)

Each service can be run independently for development:

```bash
# Auth Service
cd auth-service && npm install && npm start     # → http://localhost:3001

# User Service
cd user-service && npm install && npm start     # → http://localhost:3002

# Order Service
cd order-service && npm install && npm start    # → http://localhost:3003

# Frontend
cd frontend && npm install && npm run dev       # → http://localhost:3000
```

---

## 🔒 Security Notes

The following are known issues in the current demo setup that should be addressed before any production or public deployment:

| # | Issue | Location | Recommended Fix |
|---|---|---|---|
| 1 | **Hardcoded credentials** | `auth-service/index.js` | Use environment variables + a real user database with hashed passwords |
| 2 | **Static JWT token** | `auth-service/index.js` | Issue real signed JWTs using `jsonwebtoken` with expiry |
| 3 | **In-memory data storage** | All backend services | Integrate a persistent database (e.g., PostgreSQL, MongoDB) |
| 4 | **TLS verification disabled** | `kubeconfig-final.yaml` (`insecure-skip-tls-verify: true`) | Use a valid certificate authority |
| 5 | **Jenkins has `cluster-admin`** | `jenkins-rbac.yaml` | Scope RBAC to only the permissions Jenkins actually needs |
| 6 | **Kubeconfig contains raw private key** | `kubeconfig-final.yaml` | Rotate credentials; never commit kubeconfig to version control |
| 7 | **No auth on backend routes** | All services | Add middleware to validate JWT on protected routes |
| 8 | **No resource limits on pods** | All deployment YAMLs | Add `resources.requests` and `resources.limits` to all containers |

---

## 📌 Key Design Decisions

- **Path-based Ingress routing** is used instead of subdomain routing to keep the local dev setup simple (single `/etc/hosts` entry).
- **`imagePullPolicy: Always`** is set on all deployments so that re-deploying with the same `latest` tag always pulls the freshest image.
- **Jenkins runs inside Kubernetes** (not externally) so it can access the cluster API directly via the in-cluster ServiceAccount.
- **Build number as image tag** (`IMAGE_TAG = "${BUILD_NUMBER}"`) ensures every build produces a uniquely tagged image, making rollbacks possible via `kubectl set image`.
- **Frontend uses relative API paths** so the same build works in both local (via Ingress) and any future deployment without changing URLs.

---

## 👤 Author

**Manohar** — `manoharn0441` on Docker Hub

---

*This project is a learning/demo project showcasing Kubernetes microservices, Docker, and Jenkins CI/CD end-to-end.*
