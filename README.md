# 🏋️ Competition Management System

A full-stack web application built to digitize and simplify the workflow of managing a sports competition.

The system covers the process from **athlete registration and verification to start-list preparation and live competition management**.

---

## 📌 Overview

Managing a sports competition involves more than recording results.

Organizers need to handle:

- Athlete registrations
- Documents and verification
- Competition categories
- Competition entries
- Start lists
- Athlete attempts
- Officials' decisions
- Live competition progression
- Public score display

This project brings these workflows into one web-based system instead of relying on separate manual processes.

The application was developed around the real workflow of a **weightlifting competition**.

---

## 🎯 Main Workflow

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


✨ Features
📝 Athlete Registration
Online athlete registration
Automatic registration number generation
Personal information management
Competition participation selection
Age-category eligibility
Weight-category selection
Document uploads
Form validation
Email confirmation
Registration receipt generation
🛡️ Registration & Administration

The administration side allows officials to manage registered athletes and competition information.

Includes
View registrations
Review athlete information
Review submitted documents
Verify registrations
Manage competition information
Manage competition entries
Export registration data
📋 Start List

The start-list module prepares athletes for competition.

It manages information such as:

Athlete name
Lot number
Bodyweight
Weight category
Age category
Opening attempts

The generated start list becomes the foundation for the live competition workflow.

🏋️ Live Competition

The live competition module is designed around the actual flow of a weightlifting competition.

Officials Control

Officials can:

View the current athlete
View the next athlete
Update declared weights
Record Good Lift / No Lift
Track attempts
Progress through competition phases
Manage Snatch attempts
Manage Clean & Jerk attempts
Follow automatic calling order
Advance the competition
Public Scoreboard

A separate public-facing scoreboard displays competition information without exposing official controls.

              OFFICIALS
                  │
                  ▼
        Competition State
                  │
                  ▼
         PUBLIC SCOREBOARD

This separates competition control from the public display.

🧠 Competition Logic

One of the more challenging parts of the project is the live competition logic.

The next athlete is not simply selected by moving to the next row.

The system has to consider information such as:

Current competition phase
Current athlete
Current attempt
Declared weight
Completed attempts
Athlete progression
Calling order
Queue state
Next athlete

The application contains separate logic for handling:

Current attempt selection
Next athlete selection
Declared-weight updates
Queue generation
Queue recalculation
Competition progression
Snatch progression
Clean & Jerk progression
Competition completion

This was implemented to make the system behave according to the competition workflow rather than acting as a simple CRUD application.

🔄 Competition Flow
                 Competition Started
                         │
                         ▼
                      SNATCH
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
          Attempt 1   Attempt 2   Attempt 3
                         │
                         ▼
                   Optional Break
                         │
                         ▼
                   CLEAN & JERK
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
          Attempt 1   Attempt 2   Attempt 3
                         │
                         ▼
                Competition Completed
🏗️ Architecture

The application follows a separate frontend and backend architecture.

┌─────────────────────────────┐
│            Users            │
│                             │
│ Athletes | Officials | Public│
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          Frontend           │
│           React.js          │
└──────────────┬──────────────┘
               │
             REST API
               │
               ▼
┌─────────────────────────────┐
│          Backend            │
│     Node.js + Express.js    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          MongoDB            │
└─────────────────────────────┘

External services are integrated where required for features such as file storage, email, document generation, and deployment.

🛠️ Technology Stack
Category	Technologies
Frontend	React.js, JavaScript, HTML5, CSS3
Backend	Node.js, Express.js
Database	MongoDB, Mongoose
API	REST API
File Storage	Cloudinary
Email	Nodemailer
PDF	PDFKit
Data Export	XLSX
Testing / API Tools	Postman
Version Control	Git, GitHub
Containerization	Docker
Deployment	Vercel, Render
📂 Project Structure
Backend
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
Backend responsibilities
API endpoints
Business logic
Database operations
Authentication and authorization
Request validation
File handling
Competition state management
Frontend
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
Frontend responsibilities
User interfaces
Forms
API communication
Admin interfaces
Start-list interface
Live competition control
Public scoreboard
🖼️ Screenshots

Screenshots of the major application workflows can be added here.

Athlete Registration

Add screenshot here.

Administration

Add screenshot here.

Start List

Add screenshot here.

Officials Control Screen

Add screenshot here.

Public Scoreboard

Add screenshot here.

🔐 Application Considerations

The project also deals with several concerns that appear in real-world applications:

Input validation
API validation
Authentication
Authorization
Error handling
Environment variables
Database operations
File uploads
External service integration
Frontend/backend communication
Deployment configuration
Competition state management
🚀 Running the Project Locally
Prerequisites

Make sure you have installed:

Node.js
npm
MongoDB or MongoDB Atlas
1. Clone the Repository
git clone https://github.com/KOMAL-DEVRAPALLI/Competition-Management-System.git
cd Competition-Management-System
2. Install Backend Dependencies
cd Backend
npm install
3. Configure Backend

Create a .env file inside the Backend directory.

Add the required environment variables for:

MongoDB
Cloudinary
Email service
Authentication
Other backend configuration

Do not commit .env files or secrets to GitHub.

4. Start the Backend
npm start
5. Install Frontend Dependencies

Open another terminal:

cd Frontend
npm install
6. Configure Frontend

Create a .env file inside the Frontend directory.

Configure the backend API URL.

7. Start the Frontend
npm run dev

The frontend and backend will run separately during local development.

📚 What This Project Demonstrates

This project demonstrates practical experience with:

Full-Stack Development
Building a React frontend
Building REST APIs
Connecting frontend and backend
Working with MongoDB
Structuring an Express application
Backend Development
Controllers
Services
Routes
Middleware
Validation
Database operations
Business logic
Frontend Development
Component-based architecture
State management
Forms
API integration
Conditional rendering
Interactive competition interfaces
Real-World Problem Solving

The project required translating an actual sports competition workflow into software.

This involved handling:

Athlete progression
Competition phases
Attempt tracking
Declared weights
Calling order
Queue recalculation
Official decisions
Public display state
📈 Project Status

Active Development

The system is being developed incrementally as additional competition workflows, edge cases, and improvements are identified.

👩‍💻 About the Developer
Komal Devrapalli

BCA Graduate | MCA Student | Full-Stack Web Developer

I build practical web applications using React.js, Node.js, Express.js, and MongoDB.

My approach is focused on understanding real-world problems and converting business workflows into usable software.

Connect
💼 LinkedIn: https://www.linkedin.com/in/komal-devrapalli-10062k25
💻 GitHub: https://github.com/KOMAL-DEVRAPALLI
⭐ Project Highlights
Built around a real-world sports competition workflow
Full-stack React + Node.js application
MongoDB database integration
REST API architecture
Athlete registration and verification
Start-list management
Live competition control
Automatic competition progression logic
Public scoreboard
External service integrations
Deployment and production configuration


<p align="center"> Built with React.js • Node.js • Express.js • MongoDB </p> ```
