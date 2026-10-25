# Buy-01 – Endpoints & Kafka Topics

Derived from the project subject. Items marked **(optional)** are optional in the subject; items marked **(derived)** are not named explicitly but are required by the subject's rules (e.g. gateway, actuator, avatar delegation).

---

## 1. Architecture Summary

| Component | Role |
|---|---|
| **Discovery Service** | Service registry (e.g. Eureka) |
| **API Gateway** | Single entry point: routing, CORS, JWT validation & propagation, optional rate limiting |
| **User Service** | Auth, profiles, roles (CLIENT, SELLER, ADMIN optional) |
| **Product Service** | Product CRUD, image URL references, ownership enforcement |
| **Media Service** | Image upload/download, validation (image/*, ≤ 2 MB), object storage |
| **Kafka** | Async events (optional but recommended) |
| **MongoDB** | Persistence (images themselves live in object storage, not in DB) |

---

## 2. REST Endpoints

### 2.1 User Service

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register with role `CLIENT` or `SELLER` |
| POST | `/auth/login` | Public | Authenticate, returns JWT / OAuth2 token |
| GET | `/me` | Authenticated | Get current user profile |
| PUT | `/me` | Authenticated | Update profile (seller may upload/update avatar → delegated to Media Service) |

### 2.2 Product Service

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/products/{lastId}` | Public | List products |
| GET | `/products/{id}` | Public | Get a single product |
| POST | `/products` | SELLER | Create product (with `imageUrls[]`) |
| PUT | `/products/{id}` | SELLER (owner only) | Update product (`sellerId == auth.subject`) |
| DELETE | `/products/{id}` | SELLER (owner only) | Delete product |
| GET | `/products/owned` | SELLER | List products owned by the authenticated seller |

### 2.3 Media Service

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/media/images` | SELLER | Upload image; validates MIME `image/*`, content sniffing, ≤ 2 MB |
| GET | `/media/images/{id}` | Public (serve image) | Serve image with proper caching headers |
| DELETE | `/media/images/{id}` **(optional)** | SELLER (owner only) | Delete image; seller must own the media |

### 2.4 Gateway & Discovery **(derived)**

| Component | Path | Description |
|---|---|---|
| Gateway | `/auth/**` → User Service | Route (optional rate limiting) |
| Gateway | `/me/**` → User Service | Route |
| Gateway | `/products/**` → Product Service | Route |
| Gateway | `/media/**` → Media Service | Route (optional rate limiting) |
| Discovery | `/` (dashboard), `/actuator/health` | Registry UI / health |

### 2.5 Error Codes (all services)

| Code | Meaning |
|---|---|
| 400 | Invalid input / file type / file too large |
| 401 | Unauthenticated |
| 403 | Unauthorized (wrong role / not owner) |
| 404 | Not found (product/media missing or not owned) |
| 5xx | Must be avoided via global exception handlers |

---

## 3. Kafka Topics & Consumers

The subject names two events: `PRODUCT_CREATED` and `IMAGE_UPLOADED`. They are suggested for **audit, cache invalidation, thumbnails**. Kafka is **optional but recommended**. The subject does not name consumers explicitly, so the consumers below are derived from the stated use cases.

| Topic (event) | Producer | Consumers | Purpose |
|---|---|---|---|
| `PRODUCT_CREATED` | Product Service | **Audit consumer** (audit log); **Cache invalidation consumer** (e.g. product list cache / gateway cache) | Audit trail and cache invalidation when a product is created |
| `IMAGE_UPLOADED` | Media Service | **Audit consumer**; **Thumbnail generator** (Media Service worker); **Cache invalidation consumer** | Audit, thumbnail generation, cache invalidation after an upload |

### Suggested consumer-to-service mapping

| Consumer | Hosted in | Listens to |
|---|---|---|
| Audit consumer | Dedicated audit module or User Service | `PRODUCT_CREATED`, `IMAGE_UPLOADED` |
| Cache invalidation consumer | Product Service / Gateway | `PRODUCT_CREATED`, `IMAGE_UPLOADED` |
| Thumbnail generator | Media Service | `IMAGE_UPLOADED` |

---

## 4. Frontend (Angular) → Endpoint Usage

| Page / Feature | Endpoints used |
|---|---|
| Sign-up / Sign-in | `POST /auth/register`, `POST /auth/login` |
| Profile / avatar (seller) | `GET /me`, `PUT /me`, `POST /media/images` |
| Public product listing | `GET /products`, `GET /products/{id}`, `GET /media/images/{id}` |
| Seller dashboard | `POST /products`, `PUT /products/{id}`, `DELETE /products/{id}` |
| Media management | `POST /media/images`, `GET /media/images/{id}`, `DELETE /media/images/{id}` (optional) |

---

## 5. Key Rules to Remember

- Public: only product `GET`s (and image serving). All writes need auth + role check.
- Uploads: `image/*` only, max **2 MB**, validated by MIME **and** content sniffing.
- Ownership: `sellerId == auth.subject` in Product and Media services.
- Passwords: BCrypt hash + salt, never exposed.
- HTTPS end-to-end, CORS enforced at the gateway.
- Every service exposes `/actuator/health`.
