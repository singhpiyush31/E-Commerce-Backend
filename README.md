# E-Commerce Backend

A REST API for a small e-commerce store, built with Node.js, Express 5 and MongoDB. It provides user registration and login, role-based access for admins, a product catalogue organised by category, a per-user shopping cart, and order placement with automatic stock tracking.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Server](#running-the-server)
- [Authentication & Roles](#authentication--roles)
- [API Reference](#api-reference)
  - [Auth](#auth--auth)
  - [Categories](#categories--category)
  - [Products](#products--product)
  - [Cart](#cart--cart)
  - [Orders](#orders--order)
- [Pagination, Filtering & Sorting](#pagination-filtering--sorting)
- [Business Rules](#business-rules)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Project Structure](#project-structure)
- [Example Walkthrough](#example-walkthrough)

## Features

- **Authentication** — register, login, logout, and fetch the current user. Passwords are hashed with bcrypt; sessions use a JWT stored in an HTTP cookie.
- **Roles** — two roles, `User` and `Admin`. Admin accounts are created by supplying a server-side secret at registration.
- **Categories** — admins create, update and delete categories; anyone can list them. Deletion is blocked while products still reference the category.
- **Products** — admins manage products; the public catalogue supports text search, brand/category/price/stock filters, sorting and pagination. Products can be deactivated without deleting them.
- **Cart** — one cart per user. Add, update quantity, remove single items, or clear. Every mutation is validated against live stock.
- **Orders** — checkout converts the cart into an order, snapshots product names and prices, decrements stock, and clears the cart. Users can view and cancel their own orders; admins can list every order and advance its status. Cancelling restores stock.

## Tech Stack

| Layer      | Choice                              |
| ---------- | ----------------------------------- |
| Runtime    | Node.js (CommonJS modules)          |
| Framework  | Express 5                           |
| Database   | MongoDB with Mongoose 9             |
| Auth       | `jsonwebtoken` + `cookie-parser`    |
| Hashing    | `bcrypt`                            |
| Config     | `dotenv`                            |

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A MongoDB instance — local (`mongod`) or a hosted cluster such as MongoDB Atlas

### Installation

```bash
git clone https://github.com/singhpiyush31/E-Commerce-Backend.git
cd E-Commerce-Backend
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URL=mongodb://localhost:27017/ecommerce
JWT_SECRET=replace-with-a-long-random-string
ADMIN_SECRET=replace-with-another-secret
```

| Variable       | Required | Default | Description                                                                                          |
| -------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `PORT`         | No       | `3000`  | Port the HTTP server listens on.                                                                     |
| `MONGO_URL`    | Yes      | —       | MongoDB connection string.                                                                           |
| `JWT_SECRET`   | Yes      | —       | Secret used to sign and verify login tokens. Changing it invalidates all existing sessions.          |
| `ADMIN_SECRET` | No       | —       | When set, a registration request whose `adminSecret` matches this value is given the `Admin` role.  |

> `.env` is git-ignored. Never commit real secrets.

### Running the Server

```bash
node app.js
```

The process connects to MongoDB first and only starts listening once that succeeds. On success you'll see:

```
Database connected successfully!
Server is listening on the 3000
```

If the connection fails, the error is logged and the server does not start.

## Authentication & Roles

1. `POST /auth/login` verifies the credentials and responds with a `Set-Cookie: token=<jwt>` header. The token is valid for **7 days**.
2. Send that cookie on subsequent requests. Tools like Postman, Insomnia and browsers do this automatically; with `curl`, use `-c cookies.txt` on login and `-b cookies.txt` afterwards.
3. `POST /auth/logout` clears the cookie.

Every protected route runs through the `userAuth` middleware, which:

- reads the `token` cookie — missing → **401**
- verifies the JWT signature and expiry — invalid → **401**
- loads the user from the database — not found → **401**
- attaches the user document to `req.user`

Admin routes additionally pass through `isAdmin`, which returns **403** unless `req.user.role === "Admin"`.

**Creating an admin:** register normally but include `"adminSecret": "<value of ADMIN_SECRET>"` in the body. If the secret matches, the account is created with `role: "Admin"`; otherwise it silently gets `role: "User"`.

Access levels used throughout this document:

| Label  | Meaning                                    |
| ------ | ------------------------------------------ |
| Public | No cookie needed                           |
| User   | Valid `token` cookie required              |
| Admin  | Valid cookie **and** `role` must be `Admin` |

## API Reference

All requests and responses use JSON. Send `Content-Type: application/json` on requests with a body. Every response includes a human-readable `message` field.

---

### Auth — `/auth`

#### `POST /auth/register` — Public

Create an account.

**Body**

| Field         | Type   | Required | Rules                                    |
| ------------- | ------ | -------- | ---------------------------------------- |
| `name`        | string | Yes      | 2–50 characters                          |
| `email`       | string | Yes      | Valid email format; stored lowercased; must be unique |
| `password`    | string | Yes      | At least 6 characters                    |
| `adminSecret` | string | No       | Grants `Admin` role if it matches `ADMIN_SECRET` |

**Response `201`**

```json
{
  "message": "User registered successfully!",
  "user": {
    "_id": "66e0…",
    "name": "Piyush",
    "email": "piyush@example.com",
    "role": "User"
  }
}
```

**Errors:** `400` missing fields / bad email / short password / email already registered.

#### `POST /auth/login` — Public

**Body:** `email`, `password`.

**Response `200`** — sets the `token` cookie.

```json
{ "message": "LoggedIn Successfully!" }
```

**Errors:** `400` missing fields, bad email format, or wrong credentials (the same message is returned whether the email or the password is wrong).

#### `POST /auth/logout` — Public

Clears the `token` cookie. Always returns `200`.

#### `GET /auth/me` — User

Returns the logged-in user.

```json
{
  "message": "Current user",
  "user": { "_id": "…", "name": "…", "email": "…", "role": "User" }
}
```

---

### Categories — `/category`

#### `GET /category` — Public

Lists every category, newest first. Audit fields (`user`, `updatedBy`) are omitted.

```json
{
  "message": "Categories: ",
  "category": [
    { "_id": "…", "name": "Electronics", "description": "…", "createdAt": "…", "updatedAt": "…" }
  ],
  "totalCategories": 1
}
```

#### `POST /category` — Admin

**Body**

| Field         | Type   | Required | Rules                       |
| ------------- | ------ | -------- | --------------------------- |
| `name`        | string | Yes      | 2–50 characters, unique     |
| `description` | string | No       | Up to 400 characters        |

**Response `201`** — `{ "message": "Category created successfully!", "category": { … } }`

**Errors:** `400` name missing or already exists.

#### `PATCH /category/:id` — Admin

Update `name` and/or `description`. Records the acting admin in `updatedBy`.

**Response `200`** — `{ "message": "Updated Category: ", "updateCategory": { … } }`

**Errors:** `404` category not found.

#### `DELETE /category/:id` — Admin

**Response `200`** — `{ "message": "Category deleted successfully!" }`

**Errors:**
- `400` — one or more products still reference this category (the count is included in the message). Reassign or delete those products first.
- `404` — category not found.

---

### Products — `/product`

#### `GET /product` — Public

Lists **active** products (`isActive: true`) with the category populated to its name. Supports the query parameters described under [Pagination, Filtering & Sorting](#pagination-filtering--sorting).

```json
{
  "message": "Products",
  "product": [
    {
      "_id": "…",
      "name": "Wireless Mouse",
      "description": "…",
      "price": 799,
      "brand": "Logitech",
      "category": { "_id": "…", "name": "Electronics" },
      "stock": 25,
      "image": "https://…",
      "isActive": true,
      "createdAt": "…",
      "updatedAt": "…"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalProducts": 1,
  "totalPage": 1
}
```

#### `GET /product/:id` — Public

Returns one active product. Inactive products return `404`, so deactivating a product hides it from the storefront without deleting it.

**Response `200`** — `{ "message": "Product", "product": { … } }`

#### `POST /product` — Admin

**Body**

| Field         | Type   | Required | Rules                                   |
| ------------- | ------ | -------- | --------------------------------------- |
| `name`        | string | Yes      | 2–100 characters                        |
| `description` | string | Yes      | 20–500 characters                       |
| `price`       | number | Yes      | Minimum 10                              |
| `brand`       | string | Yes      |                                         |
| `category`    | string | Yes      | ObjectId of an existing category        |
| `stock`       | number | No       | ≥ 0, defaults to `0`                    |
| `image`       | string | No       | URL                                     |

**Response `201`** — `{ "message": "Product created successfully!", "product": { … } }`

**Errors:** `404` required field missing or category does not exist.

#### `PATCH /product/:id` — Admin

Partial update. Any of the fields above plus `isActive` (boolean). If `category` is supplied it must exist.

**Response `200`** — `{ "message": "Product updated successfully!", "product": { … } }`

**Errors:** `404` product or category not found.

#### `DELETE /product/:id` — Admin

Permanently removes the product. To hide a product while keeping its history, prefer `PATCH` with `{ "isActive": false }`.

**Response `200`** — `{ "message": "Product deleted successfully!" }`

---

### Cart — `/cart`

Each user has exactly one cart, created on first use. All cart routes require login.

#### `GET /cart` — User

Returns the cart with each product populated (`name`, `price`, `image`, `stock`, `isActive`) and computed totals.

```json
{
  "message": "Your Cart: ",
  "items": [
    {
      "_id": "…",
      "product": { "_id": "…", "name": "Wireless Mouse", "price": 799, "stock": 25, "image": "…", "isActive": true },
      "quantity": 2
    }
  ],
  "totalQuantity": 2,
  "totalAmount": 1598
}
```

If the user has no cart yet, `items` is `[]` and both totals are `0`.

#### `POST /cart` — User

Add a product to the cart.

**Body**

| Field       | Type   | Required | Notes                     |
| ----------- | ------ | -------- | ------------------------- |
| `productId` | string | Yes      | Product ObjectId          |
| `quantity`  | number | No       | Defaults to `1`, must be ≥ 1 |

If the product is already in the cart, the quantities are added together. The combined quantity is checked against stock.

**Response `200`** — `{ "message": "Product added to cart", "cart": { … } }`

**Errors:**
- `400` — `productId` missing, quantity < 1, product out of stock, or requested total exceeds available stock (message includes how many are available)
- `404` — product not found or inactive

#### `PATCH /cart/:productId` — User

Set the quantity of a line item.

**Body:** `{ "quantity": <number ≥ 0> }`

- `quantity > 0` — updates the line, subject to stock.
- `quantity = 0` — removes the line entirely.

**Response `200`** — `{ "message": "Cart updated successfully!", "cart": { … } }` or `{ "message": "Product removed from cart!" }`

**Errors:** `400` negative/non-numeric quantity or exceeds stock; `404` cart, line item, or product not found.

#### `DELETE /cart/:productId` — User

Remove one product from the cart.

**Response `200`** — `{ "message": "Product removed from the cart", "cart": { … } }`

**Errors:** `404` cart not found or product not in cart.

#### `DELETE /cart` — User

Empty the cart (the cart document itself is kept).

**Response `200`** — `{ "message": "Cart cleared successfully!", "clearCart": { … } }`

---

### Orders — `/order`

#### `POST /order` — User

Place an order from the current cart.

**Body**

| Field           | Type   | Required | Rules                                             |
| --------------- | ------ | -------- | ------------------------------------------------- |
| `address`       | string | Yes      | 10–500 characters                                 |
| `paymentMethod` | string | No       | `COD` (default), `UPI`, `CARD`, `Other`           |

What happens on success, in order:

1. Every cart line is validated — the product must exist, be active, and have enough stock.
2. An `Order` is created with a **snapshot** of each item's `name` and `price` at the time of purchase, so later product edits don't alter historical orders.
3. The cart is emptied.
4. Each product's `stock` is decremented by the ordered quantity.

**Response `201`**

```json
{
  "message": "Order placed successfully",
  "order": {
    "_id": "…",
    "user": "…",
    "items": [
      { "product": "…", "name": "Wireless Mouse", "price": 799, "quantity": 2 }
    ],
    "totalAmount": 1598,
    "paymentMethod": "COD",
    "status": "Pending",
    "address": "…",
    "createdAt": "…",
    "updatedAt": "…"
  }
}
```

**Errors:** `400` address missing, cart empty, a product is unavailable, or insufficient stock (message names the product).

#### `GET /order/my` — User

Lists the logged-in user's orders. Supports the query parameters described under [Pagination, Filtering & Sorting](#pagination-filtering--sorting).

```json
{
  "message": "My order: ",
  "order": [ { … } ],
  "page": 1,
  "limit": 10,
  "skip": 0,
  "totalPage": 1,
  "totalOrder": 3
}
```

#### `GET /order/:id` — User

Fetch a single order. A user may only view their own orders; an admin may view any.

**Response `200`** — `{ "message": "Order: ", "order": { … } }`

**Errors:** `403` not the owner and not an admin; `404` order not found.

#### `PATCH /order/:id/status` — User

Change an order's status.

**Body:** `{ "status": "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled" }`

Permissions:

| Who    | Allowed transitions                                                 |
| ------ | ------------------------------------------------------------------- |
| User   | Only to `Cancelled`, and only on their own orders                   |
| Admin  | Any status, on any order                                            |

Guards that apply to everyone:

- An order already `Cancelled` cannot be changed again (`400`).
- A `Delivered` order cannot be cancelled (`400`).

When the new status is `Cancelled`, each item's quantity is added back to the product's stock.

**Response `200`** — `{ "message": "Order status updated successfully!", "order": { … } }`

**Errors:** `400` status missing/invalid, disallowed transition, or user attempting a non-cancel change; `403` user targeting someone else's order; `404` order not found.

#### `GET /order` — Admin

Lists **all** orders with the customer's `name` and `email` populated. Accepts the same query parameters as `/order/my` plus `user`.

---

## Pagination, Filtering & Sorting

The list endpoints (`GET /product`, `GET /order/my`, `GET /order`) share a common set of query parameters.

### Pagination (all list endpoints)

| Param   | Default | Notes                                                   |
| ------- | ------- | ------------------------------------------------------- |
| `page`  | `1`     | Values ≤ 0 are treated as 1                             |
| `limit` | `10`    | Values ≤ 0 reset to 10; values above **50** are capped  |

Responses include `page`, `limit`, the total count, and `totalPage`.

### `GET /product`

| Param      | Example                  | Behaviour                                                    |
| ---------- | ------------------------ | ------------------------------------------------------------ |
| `search`   | `?search=mouse`          | Case-insensitive substring match on `name`                   |
| `brand`    | `?brand=logi`            | Case-insensitive substring match on `brand`                  |
| `category` | `?category=<ObjectId>`   | Exact category match                                         |
| `minPrice` | `?minPrice=500`          | `price >= 500`                                               |
| `maxPrice` | `?maxPrice=1000`         | `price <= 1000`                                              |
| `inStock`  | `?inStock=true`          | Only products with `stock >= 1`                              |
| `sort`     | `?sort=price-low`        | `oldest`, `price-high`, `price-low`; default is newest first |

Filters combine with AND. Example — Logitech products between ₹500 and ₹1000 that are in stock, cheapest first:

```
GET /product?brand=logitech&minPrice=500&maxPrice=1000&inStock=true&sort=price-low
```

### `GET /order/my` and `GET /order`

| Param           | Example                     | Behaviour                                                  |
| --------------- | --------------------------- | ---------------------------------------------------------- |
| `search`        | `?search=mouse`             | Case-insensitive match against any item `name` in the order |
| `status`        | `?status=shipped`           | Case-insensitive match on `status`                         |
| `paymentMethod` | `?paymentMethod=upi`        | Case-insensitive match on `paymentMethod`                  |
| `from`          | `?from=2026-09-01`          | Orders created on or after this date                       |
| `to`            | `?to=2026-09-30`            | Orders created on or before this date (midnight, UTC)      |
| `sort`          | `?sort=oldest`              | Default is newest first                                    |
| `user`          | `?user=<ObjectId>`          | **Admin list only** — filter by customer                   |

## Business Rules

These rules are enforced server-side regardless of how the request is made.

**Catalogue**
- Category names are unique.
- A category cannot be deleted while any product references it.
- Product prices must be at least 10; stock cannot go negative.
- Only active products appear in `GET /product` and `GET /product/:id`. Admin routes can still update inactive products.

**Cart**
- One cart per user; it's created automatically on the first add.
- Adding a product that's already in the cart merges quantities rather than creating a duplicate line.
- Quantities can never exceed the product's current stock, whether adding or updating.
- Out-of-stock and inactive products cannot be added.

**Orders**
- Checkout is all-or-nothing: if any line fails validation, no order is created and the cart is left untouched.
- Item `name` and `price` are frozen into the order at checkout.
- Stock is decremented on placement and restored on cancellation.
- Users can cancel only their own orders and only if not yet delivered; a cancelled order is final.
- Only admins can move an order through `Confirmed → Shipped → Delivered`.

## Data Models

### User

| Field       | Type     | Notes                                   |
| ----------- | -------- | --------------------------------------- |
| `name`      | String   | required, 2–50 chars, trimmed           |
| `email`     | String   | required, unique, lowercased, trimmed   |
| `password`  | String   | required — stored as a bcrypt hash      |
| `role`      | String   | `"User"` (default) or `"Admin"`         |

### Category

| Field         | Type     | Notes                                 |
| ------------- | -------- | ------------------------------------- |
| `name`        | String   | required, unique, 2–50 chars          |
| `description` | String   | optional, ≤ 400 chars                 |
| `user`        | ObjectId → User | admin who created it           |
| `updatedBy`   | ObjectId → User | admin who last edited it       |

### Product

| Field         | Type     | Notes                                         |
| ------------- | -------- | --------------------------------------------- |
| `name`        | String   | required, 2–100 chars                         |
| `description` | String   | required, 20–500 chars                        |
| `price`       | Number   | required, ≥ 10                                |
| `brand`       | String   | required                                      |
| `category`    | ObjectId → Category | required                           |
| `stock`       | Number   | ≥ 0, default `0`                              |
| `image`       | String   | optional URL                                  |
| `isActive`    | Boolean  | default `true`; `false` hides from storefront |
| `user`        | ObjectId → User | admin who created it                   |

### Cart

| Field     | Type                          | Notes                          |
| --------- | ----------------------------- | ------------------------------ |
| `user`    | ObjectId → User               | required, unique (one per user)|
| `items[]` | `{ product, quantity }`       | `product` → Product; `quantity` ≥ 1, default 1 |

### Order

| Field           | Type                                    | Notes                                              |
| --------------- | --------------------------------------- | -------------------------------------------------- |
| `user`          | ObjectId → User                         | required                                           |
| `items[]`       | `{ product, name, price, quantity }`    | `name`/`price` snapshotted at checkout             |
| `totalAmount`   | Number                                  | ≥ 0, computed at checkout                          |
| `paymentMethod` | String                                  | `COD` (default), `UPI`, `CARD`, `Other`            |
| `status`        | String                                  | `Pending` (default), `Confirmed`, `Shipped`, `Delivered`, `Cancelled` |
| `address`       | String                                  | required, 10–500 chars                             |

Every model has `createdAt` and `updatedAt` timestamps managed by Mongoose.

## Error Handling

Every error response has the shape:

```json
{ "message": "Human-readable explanation" }
```

Unexpected server errors (`500`) additionally include an `error` field with the underlying exception message.

| Status | When                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| `400`  | Validation failed, or a business rule was violated (duplicate email, insufficient stock, invalid status transition, …) |
| `401`  | No `token` cookie, or the token is invalid/expired, or the user no longer exists       |
| `403`  | Logged in but lacking permission (non-admin on an admin route, or accessing another user's order) |
| `404`  | The referenced resource doesn't exist (or, for products, is inactive)                  |
| `500`  | Unhandled exception                                                                    |

## Project Structure

```
.
├── app.js                     # Entry point — middleware, routers, DB connect, listen
├── config/
│   └── database.js            # Mongoose connection helper
├── controllers/
│   ├── auth.js                # register / login / logout / me
│   ├── category.js            # category CRUD
│   ├── product.js             # product CRUD + catalogue listing
│   ├── cart.js                # cart operations
│   └── order.js               # checkout, order listing, status updates
├── middlewares/
│   └── authentication.js      # userAuth (JWT cookie → req.user) and isAdmin
├── models/
│   ├── user.js
│   ├── category.js
│   ├── product.js
│   ├── cart.js
│   └── order.js
├── routes/
│   ├── auth.js                # mounted at /auth
│   ├── category.js            # mounted at /category
│   ├── product.js             # mounted at /product
│   ├── cart.js                # mounted at /cart
│   └── order.js               # mounted at /order
└── utils/
    ├── filter.js              # searchRegex, numberRange, dateRange
    └── pagination.js          # getPagination(query) → { page, limit, skip }
```

**Request flow:** `app.js` → router (`routes/`) → auth middleware (if protected) → controller (`controllers/`) → Mongoose model (`models/`) → JSON response.

## Example Walkthrough

A full flow using `curl`. The `-c`/`-b` flags persist the login cookie between calls.

```bash
BASE=http://localhost:3000

# 1. Register an admin (ADMIN_SECRET must be set in .env)
curl -s -X POST $BASE/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Admin","email":"admin@example.com","password":"secret123","adminSecret":"<ADMIN_SECRET>"}'

# 2. Log in and store the cookie
curl -s -c cookies.txt -X POST $BASE/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"secret123"}'

# 3. Create a category
curl -s -b cookies.txt -X POST $BASE/category \
  -H 'Content-Type: application/json' \
  -d '{"name":"Electronics","description":"Gadgets and accessories"}'
# → note the returned category _id

# 4. Create a product
curl -s -b cookies.txt -X POST $BASE/product \
  -H 'Content-Type: application/json' \
  -d '{"name":"Wireless Mouse","description":"Compact 2.4GHz wireless mouse with USB receiver","price":799,"brand":"Logitech","category":"<CATEGORY_ID>","stock":25}'
# → note the returned product _id

# 5. Browse the catalogue (no login needed)
curl -s "$BASE/product?search=mouse&inStock=true"

# 6. Add to cart
curl -s -b cookies.txt -X POST $BASE/cart \
  -H 'Content-Type: application/json' \
  -d '{"productId":"<PRODUCT_ID>","quantity":2}'

# 7. View cart totals
curl -s -b cookies.txt $BASE/cart

# 8. Place the order
curl -s -b cookies.txt -X POST $BASE/order \
  -H 'Content-Type: application/json' \
  -d '{"address":"221B Baker Street, London","paymentMethod":"UPI"}'
# → stock drops to 23, cart is now empty

# 9. Admin marks it shipped
curl -s -b cookies.txt -X PATCH $BASE/order/<ORDER_ID>/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"Shipped"}'

# 10. List every order
curl -s -b cookies.txt "$BASE/order?status=shipped"
```
