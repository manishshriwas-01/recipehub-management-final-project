#  RecipeHub

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
# recipehub-management-final-project
