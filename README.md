# 🍴 RecipeHub — Full-Stack Recipe Management Application

RecipeHub is a full-stack recipe management application built with **Angular 17+ standalone architecture** on the frontend and **Node.js, Express, and MongoDB** on the backend.

The project focuses on **RESTful API design, structured MongoDB schemas, secure JWT authentication, role-based authorization, recipe CRUD operations, API validation, search, filtering, pagination, and a responsive reactive Angular frontend**.

## ✨ Features

- 🔐 **Secure Authentication**: JWT-based authentication with bcrypt password hashing, protected routes, and centralized `401 Unauthorized` handling.
- 👑 **Role-Based Access Control**: User and Admin roles with protected admin functionality and owner-based recipe authorization.
- 🍳 **Recipe Management**: Create, view, update, and delete recipes with ownership and admin authorization.
- 🔍 **Recipe Search**: Search recipes by title using backend API filtering.
- 🏷️ **Category Filtering**: Filter recipes by categories such as Indian, Italian, Chinese, Mexican, Dessert, Healthy, Breakfast, and Other.
- 📄 **Pagination**: Backend-supported pagination for efficient recipe listing.
- 🖼️ **Recipe Images**: Recipes support image URLs for displaying attractive recipe cards and details.
- 🛡️ **API Security**: Helmet, CORS configuration, rate limiting, centralized error handling, and request validation.
- ✅ **API Validation**: Express-validator is used to validate authentication and recipe inputs.
- 🧪 **Automated Testing**: Jest and Supertest integration tests for health, authentication, and recipe APIs.
- 📱 **Responsive UI**: Responsive Angular interface designed for desktop, tablet, and mobile screens.
- ⚡ **Reactive Angular Frontend**: RxJS-based API data flow with Observables, AsyncPipe, reactive forms, search, filtering, and pagination.
- 🧩 **Modern Angular Architecture**: Standalone components, functional guards, HTTP interceptor, Signals, modern `@if` and `@for` control flow, and lazy-loaded routes.

---

## 📂 Folder Structure

RecipeHub follows a clean monorepo-style structure by separating the Angular frontend and Node.js/Express backend.

### Frontend (`client/`)

```text
client/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── navbar/              # Application navigation
│   │   │
│   │   ├── pages/
│   │   │   ├── home/                # Home page
│   │   │   ├── login/               # Login page
│   │   │   ├── register/            # Registration page
│   │   │   ├── recipes/             # Recipe listing, search & pagination
│   │   │   ├── recipe-detail/       # Recipe details
│   │   │   ├── create-recipe/       # Create recipe
│   │   │   ├── edit-recipe/         # Edit recipe
│   │   │   ├── my-recipes/          # User's recipes
│   │   │   ├── manage-recipes/      # Admin recipe management
│   │   │   └── not-found/           # 404 page
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.ts      # Authentication API & state
│   │   │   └── recipe.service.ts     # Recipe API communication
│   │   │
│   │   ├── guards/
│   │   │   ├── auth.guard.ts        # Protect authenticated routes
│   │   │   └── admin.guard.ts       # Protect admin routes
│   │   │
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts  # Attach JWT & handle 401
│   │   │
│   │   ├── models/
│   │   │   └── Recipe.ts            # Typed recipe interfaces
│   │   │
│   │   ├── app.routes.ts            # Application routing
│   │   ├── app.ts                   # Root component
│   │   └── app.html                 # Application shell
│   │
│   ├── styles.css                   # Global styles
│   └── main.ts                      # Angular application bootstrap


### Server (`server/`)

server/
├── config/
│   └── db.js                        # MongoDB connection
│
├── controllers/
│   ├── authController.js            # Register, login & current user
│   └── recipeController.js          # Recipe CRUD & listing logic
│
├── middleware/
│   ├── authMiddleware.js            # JWT verification
│   ├── validate.js                  # Validation middleware
│   └── errorMiddleware.js           # Centralized error handling
│
├── models/
│   ├── User.js                      # User schema
│   └── Recipe.js                    # Recipe schema
│
├── routes/
│   ├── authRoutes.js                # Authentication routes
│   └── recipeRoutes.js              # Recipe API routes
│
├── validators/
│   ├── authValidator.js             # Auth validation rules
│   └── recipeValidator.js           # Recipe validation rules
│
├── tests/
│   ├── health.test.js               # Health API tests
│   ├── auth.test.js                 # Authentication tests
│   └── recipe.test.js               # Recipe API tests
│
├── .env                             # Environment configuration
├── server.js                        # Express app & server entry point
└── package.json                     # Backend dependencies & scripts

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


## Day 5 — Angular Foundation & Authentication

### Work Completed

Today, the RecipeHub frontend was developed using modern Angular standalone architecture.

#### Angular Frontend Setup
- Created the Angular standalone application.
- Configured the frontend structure with pages, components, services, guards and models.
- Configured Angular routing with lazy-loaded standalone components.
- Added a common application shell with Navbar and RouterOutlet.
- Added a custom 404 / Not Found page.

#### Authentication
- Implemented user registration using Reactive Forms.
- Implemented user login using Reactive Forms.
- Connected Angular authentication forms with the backend API.
- Stored the JWT token in localStorage after successful login.
- Implemented /me API integration to retrieve the currently authenticated user.
- Added logout functionality.
- Added authentication state management using Angular signals.

#### Route Guards
- Created a functional authentication guard for protected routes.
- Created an admin guard for admin-only routes.
- Configured protected routes such as My Recipes, Create Recipe, Edit Recipe and Manage Recipes.

#### HTTP Authentication
- Configured an HTTP interceptor to attach the JWT token to authenticated API requests.
- Added handling for unauthorized (401) responses.

#### Role-Based Navigation
Updated the Navbar based on authentication and user role.

*Guest users:*
- Home
- Recipes
- Login
- Get Started

*Authenticated users:*
- Home
- Recipes
- My Recipes
- Create Recipe
- Logout

*Admin users:*
- Manage Recipes

#### Recipe Listing
- Created a typed Recipe model.
- Created RecipeService for backend recipe API communication.
- Connected the Recipes page with the backend.
- Displayed recipes dynamically from MongoDB through the API.
- Added recipe images, category, title and owner information.
- Added navigation from recipe cards to individual recipe details.

#### Home Page Integration
- Preserved the existing RecipeHub home page design.
- Replaced the static Popular Recipes cards with dynamic recipe data from the backend.
- Configured the home page to display the latest 6 recipes from the database.
- Kept the existing hero section and overall UI design unchanged.

### Technical Concepts Used

- Angular Standalone Components
- Lazy Loading
- Angular Router
- Reactive Forms
- Angular Signals
- HttpClient
- HTTP Interceptors
- Functional Route Guards
- Role-Based Navigation
- RxJS Observables
- AsyncPipe
- Typed API Responses
- Modern Angular @if and @for control flow

### Day 5 Outcome

The RecipeHub Angular frontend is now connected with the backend API and has a working authentication flow, JWT-based request handling, protected routes, role-aware navigation and dynamic recipe listing.


## Day 6 – Angular UX, Recipe Management & Responsive UI

Today, I focused on completing the Angular UX and recipe management features of the RecipeHub application. The main objective was to build a complete and user-friendly recipe experience with reactive forms, recipe searching, filtering, pagination, recipe details, ownership-based actions, admin management, error handling, and responsive UI.

### 🚀 Features Completed

- Implemented **Create Recipe** functionality using Angular Reactive Forms.
- Added client-side validation for recipe title, image URL, ingredients, steps, and category.
- Implemented **Edit Recipe** functionality with existing recipe data pre-filled automatically.
- Added the **Recipe Detail** page to display complete recipe information including image, ingredients, steps, category, and owner details.
- Implemented **recipe search** using RxJS.
- Added **category-based filtering**.
- Implemented efficient search using:
  - `combineLatest`
  - `debounceTime`
  - `distinctUntilChanged`
  - `switchMap`
- Added **recipe pagination** for browsing multiple pages of recipes.
- Completed the **My Recipes** page for displaying recipes created by the logged-in user.
- Added **View, Edit, and Delete** actions for user-owned recipes.
- Implemented the **Admin Manage Recipes** page for managing recipes created by all users.
- Added **loading states** while API requests are in progress.
- Added proper **error states** for failed API operations.
- Added **empty states** when no recipes are available or no search results are found.
- Improved the Recipes page by moving the **Search and Category filters to the top** of the page.
- Fixed the **Search and Category field overlapping issue** using a responsive CSS grid layout.
- Implemented responsive recipe grids for **desktop, tablet, and mobile** devices.
- Added a dedicated **404 Not Found page** with a Back to Home option.
- Fixed the recipe API URL integration issue and verified the frontend-to-backend recipe data flow.
- Improved overall UI consistency with responsive cards, buttons, spacing, filters, pagination, and recipe layouts.

### 🔄 RecipeHub Day 6 Flow

                         ┌──────────────────────┐
                         │      RecipeHub       │
                         │    Angular Client    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │       Recipe Features       │
                    └──────────────┬──────────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
             ▼                     ▼                     ▼
      ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
      │   Browse    │       │    Create   │       │  My Recipes │
      │   Recipes   │       │   Recipe    │       │             │
      └──────┬──────┘       └──────┬──────┘       └──────┬──────┘
             │                     │                     │
             ▼                     ▼                     ▼
      ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
      │   Search    │       │  Reactive   │       │ View / Edit │
      │  Category   │       │    Form     │       │   / Delete  │
      │ Pagination  │       │ Validation  │       │   Recipes   │
      └──────┬──────┘       └──────┬──────┘       └──────┬──────┘
             │                     │                     │
             └─────────────────────┼─────────────────────┘
                                   │
                                   ▼
                         ┌─────────────────────┐
                         │   Recipe Service    │
                         │      HttpClient     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Express REST API  │
                         │   /api/recipes      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     MongoDB Atlas   │
                         │   Recipe Collection │
                         └─────────────────────┘


### 🔐 Recipe Authorization Flow

                    ┌───────────────┐
                    │  User / Admin │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Recipe Action │
                    │ View/Edit/Del │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   JWT Token   │
                    │   Interceptor │
                    └───────┬───────┘
                            │
                            ▼
                    ┌────────────────┐
                    │ Auth Middleware│
                    └───────┬────────┘
                            │
                   ┌────────┴────────┐
                   │                 │
                   ▼                 ▼
             ┌───────────┐      ┌───────────┐
             │   Owner   │      │   Admin   │
             │    User   │      │           │
             └─────┬─────┘      └─────┬─────┘
                   │                  │
                   ▼                  ▼
             ┌───────────┐      ┌───────────┐
             │  Allowed  │      │   Admin   │
             │   Action  │      │  Override │
             └─────┬─────┘      └─────┬─────┘
                   │                  │
                   └────────┬─────────┘
                            ▼
                    ┌───────────────┐
                    │Recipe Updated │
                    │   / Deleted   │
                    └───────────────┘


