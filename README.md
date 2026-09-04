# recipehub-management-final-project

A full-stack recipe management application built with **Angular, Node.js, Express.js, and MongoDB**. Users will be able to securely create, manage, search, and filter recipes with role-based authorization for admins.

## Day 1 — Setup & Data Layer

### Today's Work

* Created the project structure with separate `client` and `server` directories.
* Initialized the Node.js and Express.js backend.
* Connected the backend with **MongoDB Atlas** using Mongoose.
* Configured environment variables using `.env`.
* Created the **User** Mongoose model with:

  * Name
  * Email
  * Password
  * Role (`user` / `admin`)
  * Schema validation
  * Timestamps
* Created the **Recipe** Mongoose model with:

  * Owner reference to User
  * Title
  * Ingredients
  * Steps
  * Category
  * Schema validation
  * Timestamps
* Established the **User → Recipe ownership relationship**.
* Verified MongoDB connection and model validation.
* Tested saving User and Recipe data to MongoDB Atlas.
* Added `.gitignore` to protect environment variables and exclude unnecessary files.

### Database Relationship

```text
User
 │
 │ _id
 ▼
Recipe.owner
```



## Day 2 — Authentication & JWT

### Today, I implemented the complete backend authentication flow for RecipeHub.

* Implemented user registration API with server-side validation.
* Added bcrypt password hashing before storing passwords in MongoDB.
* Added duplicate email handling.
* Implemented login API with bcrypt password verification.
* Added JWT token generation with expiry.
* Created JWT authentication middleware for protected routes.
* Implemented GET /api/auth/me to fetch the authenticated user's details.
* Added proper 401 responses for missing, invalid, or expired authentication.
* Tested valid and invalid registration, login, JWT, and /me scenarios.



# Day 3 — CRUD, Validation & Authorization

## Overview

Implemented secured Recipe CRUD APIs with server-side validation, role-based authorization, proper HTTP status codes, and centralized error handling.

## Features

### 1. Recipe CRUD

Implemented the following endpoints:

| Method | Endpoint | Authentication |
|--------|----------|----------------|
| GET | `/api/recipes` | Public |
| GET | `/api/recipes/:id` | Public |
| POST | `/api/recipes` | Required |
| PUT | `/api/recipes/:id` | Required |
| DELETE | `/api/recipes/:id` | Required |

### 2. Server-Side Validation

Used `express-validator` for recipe input validation.

Validation includes:

- Recipe title — required, 3–100 characters
- Ingredients — non-empty array
- Individual ingredients — cannot be empty
- Steps — non-empty array
- Individual steps — cannot be empty
- Category — must be one of the allowed categories

Allowed categories:

Indian
Italian
Chinese
Mexican
Dessert
Healthy
Breakfast
Other

Both create and update operations are validated.

### 3. Authorization

Recipe modification and deletion are protected using ownership and role checks.

Rules:

- Recipe owner can edit their own recipe.
- Recipe owner can delete their own recipe.
- Other authenticated users receive `403 Forbidden`.
- Admin users can edit or delete any recipe.

Authorization is handled inside the recipe controllers.

### 4. HTTP Status Handling

Implemented proper status codes:

| Status | Meaning | Example |
|--------|---------|---------|
| `400` | Bad Request | Validation error / invalid recipe ID |
| `401` | Unauthorized | Missing or invalid JWT |
| `403` | Forbidden | User is not the recipe owner |
| `404` | Not Found | Recipe does not exist |
| `500` | Internal Server Error | Unexpected server error |

### 5. Central Error Middleware

Created a centralized error-handling middleware.

Controller errors are forwarded using:

    catch (error) {
      next(error);
    }

The central middleware handles errors such as:

- Mongoose `ValidationError`
- Mongoose `CastError`
- Unexpected server errors

The middleware is registered after all application routes.

## Request Flow

    Client Request
          ↓
    Authentication Middleware
          ↓
    Express Validator
          ↓
    Validation Middleware
          ↓
    Controller
          ↓
    Authorization Check
          ↓
    Database Operation
          ↓
    Response

If an unexpected error occurs:

    Controller
        ↓
    catch(error)
        ↓
    next(error)
        ↓
    Central Error Middleware
        ↓
    Proper Error Response

## Authorization Flow

    Authenticated User
            ↓
        Find Recipe
            ↓
        Recipe Exists?
       ↓           ↓
      No          Yes
      ↓            ↓
     404       Check Owner/Admin
                    ↓
            Owner OR Admin?
              ↓          ↓
            Yes          No
             ↓            ↓
           Allow         403

## Day 3 Deliverable

**Secured and validated RecipeHub API with CRUD operations, ownership-based authorization, admin override, proper HTTP status handling, and centralized error management.**



## Day 4 — API Hardening & Testing

### Work Completed

- Added API security using Helmet.
- Added rate limiting to protect API endpoints from excessive requests.
- Configured CORS for frontend-backend communication.
- Added centralized error handling middleware.
- Handled Mongoose validation errors and invalid MongoDB IDs properly.
- Added search functionality for recipes by title.
- Added category-based recipe filtering.
- Added pagination for recipe listing.
- Added Jest and Supertest for API testing.
- Added authentication, validation, and authorization test cases.
- Verified the complete backend API using automated tests.

### Testing

All backend tests are passing successfully.

**Test Result:**
- 14/14 tests passed ✅

### Day 4 Outcome

The RecipeHub backend API is now more secure, validated, tested, and ready for frontend integration.

