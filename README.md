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

