# 🏋️ Competition Management System

> A full-stack web application designed to digitize sports competition workflows — from athlete registration and verification to start lists and live competition operations.

---

## 📌 About the Project

Organising a sports competition involves managing athlete registrations, documents, categories, start lists, officials, and competition-day operations.

The **Competition Management System** brings these workflows together into a single web application to reduce repetitive manual work and make competition management more organised.

The project is based on the real workflow of a weightlifting competition and includes separate functionality for administrators, competition officials, and public viewers.

---

## 🎯 Project Workflow

```text
Athlete Registration
        ↓
Document Submission
        ↓
Registration Verification
        ↓
Competition Entry
        ↓
Start List
        ↓
Live Competition
        ↓
Public Scoreboard

✨ Key Features
📝 Athlete Registration
Online athlete registration
Automatic registration number generation
Personal information collection
Competition participation selection
Age-category eligibility handling
Weight-category selection
Document upload
Form validation
Email confirmation
Registration receipt generation
🛡️ Administration

Administrators can manage the information submitted through the registration system.

Includes
View registered athletes
Review athlete information
Review submitted documents
Verify athlete registrations
Manage competition information
Manage competition entries
Export registration data
📋 Start List

The start-list module prepares registered athletes for competition.

It handles information such as:

Athlete name
Lot number
Bodyweight
Weight category
Age category
Opening attempts

The start list is then used as the basis for the live competition workflow.

🏋️ Live Competition

The live competition module is designed around the actual flow of a weightlifting competition.

It uses competition state and athlete attempt information to determine how the competition progresses.

Officials Control Screen

Officials can:

View the current athlete
View the next athlete
Manage declared weights
Record Good Lift / No Lift
Track athlete attempts
Progress through competition phases
Manage Snatch attempts
Manage Clean & Jerk attempts
Follow automatic athlete calling order
Progress the competition from one athlete to the next
Public Scoreboard

A separate public-facing scoreboard displays competition information without exposing official controls.

This creates two distinct experiences:

Officials
   │
   │ Control Competition
   ▼
Live Competition State
   │
   ▼
Public Scoreboard

# 🧠 Competition Logic

A major part of this project is the competition logic behind the live scoring system.

The next athlete cannot always be selected simply by moving to the next row in a list.

The system considers factors such as:

* Current competition phase
* Athlete attempts
* Declared weights
* Completed attempts
* Athlete progression
* Queue order
* Current athlete
* Next athlete

The live competition module contains logic for:

* Selecting the next athlete
* Tracking the current attempt
* Updating declared weights
* Generating the competition queue
* Recalculating the queue
* Advancing competition state
* Handling Snatch progression
* Handling Clean & Jerk progression
* Detecting competition completion

---

# 🔄 Competition Flow

```text
                 Competition Started
                         │
                         ▼
                      SNATCH
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          Attempt 1   Attempt 2   Attempt 3
                         │
                         ▼
                  Optional Break
                         │
                         ▼
                   CLEAN & JERK
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          Attempt 1   Attempt 2   Attempt 3
                         │
                         ▼
                Competition Completed
```

An athlete is considered complete after finishing all required Snatch and Clean & Jerk attempts.

---

# 🖥️ Application Architecture

The project uses a separate frontend and backend architecture.

```text
                    ┌─────────────────────┐
                    │       Users         │
                    │                     │
                    │ Athletes / Officials│
                    │      / Public       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Frontend       │
                    │       React.js      │
                    └──────────┬──────────┘
                               │
                          REST APIs
                               │
                               ▼
                    ┌─────────────────────┐
                    │       Backend       │
                    │ Node.js + Express.js│
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      MongoDB        │
                    │      Database       │
                    └─────────────────────┘
```

External services are used where required for functionality such as file storage, email, document generation, and deployment.

---

# 🗂️ Project Structure

## Backend

```text
Backend/
├── assets/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── seed/
├── services/
├── validators/
├── app.js
├── server.js
└── package.json
```

### Backend responsibilities

* API endpoints
* Business logic
* Database operations
* Authentication and authorization
* Request validation
* File handling
* Competition state management

---

## Frontend

```text
Frontend/
├── api/
├── calculation/
├── components/
├── hooks/
├── pages/
├── services/
├── src/
├── index.html
└── package.json
```

### Frontend responsibilities

* User interfaces
* Forms
* API communication
* Competition screens
* Admin screens
* Start-list interface
* Live scoreboard
* Public display

---

# 🛠️ Technology Stack

| Area                 | Technology      |
| -------------------- | --------------- |
| Frontend             | React.js        |
| Programming Language | JavaScript      |
| Backend              | Node.js         |
| Server Framework     | Express.js      |
| Database             | MongoDB         |
| ODM                  | Mongoose        |
| API                  | REST API        |
| File Storage         | Cloudinary      |
| Email                | Nodemailer      |
| Data Export          | Excel           |
| PDF Generation       | PDFKit          |
| Deployment           | Vercel / Render |
| Containerization     | Docker          |
| API Testing          | Postman         |
| Version Control      | Git / GitHub    |
| Development          | VS Code         |

---

# 📊 Main Modules

| Module                 | Purpose                              |
| ---------------------- | ------------------------------------ |
| Athlete Registration   | Collect athlete information          |
| Document Management    | Handle submitted documents           |
| Verification           | Review and verify registrations      |
| Competition Management | Store competition configuration      |
| Competition Entry      | Prepare athletes for participation   |
| Start List             | Organise athletes before competition |
| Live Competition       | Manage competition-day progression   |
| Public Scoreboard      | Display live competition information |
| Data Export            | Export registration information      |

---

# 🔐 Application Concerns

The project also addresses common concerns involved in building a real web application:

* Form validation
* API validation
* Authentication
* Authorization
* Error handling
* Environment variables
* Database operations
* File uploads
* External service integration
* Frontend/backend communication
* Deployment configuration
* Competition state management

---

# 🖼️ Screenshots

Screenshots of the application can be added below.

## Athlete Registration

*Add screenshot here.*

## Admin Dashboard

*Add screenshot here.*

## Start List

*Add screenshot here.*

## Officials Control Screen

*Add screenshot here.*

## Public Scoreboard

*Add screenshot here.*

---

# 🚀 Running the Project Locally

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB or MongoDB Atlas

---

## 1. Clone the Repository

```bash
git clone https://github.com/KOMAL-DEVRAPALLI/Competition-Management-System.git
cd Competition-Management-System
```

---

## 2. Install Backend Dependencies

```bash
cd Backend
npm install
```

---

## 3. Configure Backend Environment Variables

Create a local `.env` file inside the `Backend` directory.

Add the environment variables required by the backend configuration.

> Do not commit `.env` files or other secrets to GitHub.

---

## 4. Start the Backend

```bash
npm start
```

---

## 5. Install Frontend Dependencies

Open another terminal:

```bash
cd Frontend
npm install
```

---

## 6. Configure Frontend Environment Variables

Create a local `.env` file inside the `Frontend` directory.

Configure the backend API URL required by the frontend.

---

## 7. Start the Frontend

```bash
npm run dev
```

The frontend and backend can then run independently during development.

---

# 💡 What I Learned

Building this project provided practical experience in developing a complete full-stack application rather than working only with isolated frontend or backend exercises.

### Technical Experience

* Building React applications
* Creating REST APIs
* Designing Express backend structure
* Working with MongoDB and Mongoose
* Connecting frontend and backend
* Implementing forms and validation
* Handling file uploads
* Integrating external services
* Generating documents
* Exporting data
* Deploying web applications

### Software Engineering Experience

* Separating routes, controllers, services, and models
* Organising application logic
* Managing application state
* Debugging real workflows
* Handling edge cases
* Working with Git and GitHub
* Managing environment configuration
* Deploying frontend and backend separately

### Problem-Solving Experience

The live competition system required translating real competition procedures into software logic.

This involved reasoning about:

* Which athlete should lift next
* How attempts affect athlete progression
* How declared weights affect the queue
* How competition phases change
* How official decisions affect competition state
* How competition state should be reflected on the public scoreboard

---

# 📈 Project Status

**Status: Active Development**

The system is being developed incrementally as additional competition workflows, improvements, and edge cases are identified.

---

# 👩‍💻 Developer

## Komal Devrapalli

**BCA Graduate | MCA Student | Full-Stack Web Developer**

I build practical web applications using technologies such as React.js, Node.js, Express.js, and MongoDB.

My focus is on understanding real-world problems and turning business workflows into usable software.

### Connect With Me

* 💼 LinkedIn: [https://www.linkedin.com/in/komal-devrapalli-10062k25](https://www.linkedin.com/in/komal-devrapalli-10062k25)
* 💻 GitHub: [https://github.com/KOMAL-DEVRAPALLI](https://github.com/KOMAL-DEVRAPALLI)

---

# 📌 Why I Built This

This project started from a real requirement in the sports environment.

Instead of building a generic demonstration application, the system was developed around an actual competition workflow.

The goal was to reduce manual work, organise competition information, and create a digital workflow that could support competition operations.

It also provided an opportunity to understand how real-world business rules can be translated into application logic.

---

## ⭐ Project Highlights

```text
Real-world domain
       +
Full-stack development
       +
Database design
       +
REST APIs
       +
Business logic
       +
Competition workflow
       +
Deployment
       =
Practical software project
```

---

<p align="center">
  Built with React.js • Node.js • Express.js • MongoDB
</p>
```
