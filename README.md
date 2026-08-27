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
✨ Key Features
📝 Athlete Registration
Online athlete registration
Automatic registration number generation
Personal information management
Competition participation selection
Age-category eligibility calculation
Weight-category selection
Document uploads
Form validation
Email confirmation
Registration receipt generation
🛡️ Registration & Administration

The administration side allows officials to manage registered athletes and competition information.

Includes:

View registered athletes
View registration details
Verify submitted documents
Verify athlete registration
Manage competition information
Manage registration data
Export registration data
📋 Start List Management

The system generates and manages competition start lists from registered athletes.

Includes:

Athlete start-list generation
Lot number assignment
Bodyweight recording
Weight-category information
Opening weight information
Competition ordering
Gender-based start lists
🏋️ Live Competition

The live competition module is designed around the actual workflow of a weightlifting competition.

Officials can:

View the current athlete
View the next athlete
Record declared weights
Process Good Lift / No Lift decisions
Track athlete attempts
Progress through competition attempts
Automatically determine the next athlete
Follow competition calling order
Manage Snatch and Clean & Jerk phases
📺 Public Scoreboard

A separate public-facing scoreboard displays competition information in real time.

Displays:

Current athlete
Athlete attempts
Declared weights
Lift results
Competition phase
Next athlete
Competition status

The public scoreboard is read-only and is designed for spectators and competition viewing.

🧠 Competition Logic

The system is not simply a registration form. It contains competition-specific logic to support the operational workflow of a weightlifting competition.

Key areas include:

Age-category eligibility
Weight-category selection
Athlete competition entry
Start-list generation
Athlete calling order
Declared-weight handling
Attempt tracking
Good Lift / No Lift processing
Competition progression
Automatic next-athlete selection
Live scoreboard updates
👥 User Roles
👤 Athlete

Athletes can:

Register for a competition
Enter personal information
Select eligible categories
Upload required documents
Submit registration
Receive registration confirmation
🛠️ Officials / Administrators

Officials can:

Manage competitions
Review registrations
Verify athletes and documents
Generate and manage start lists
Operate the live competition
Record lift results
Control competition progression
👀 Public

The public can:

View the live competition
Follow athlete attempts
See lift results
View the current competition status
🏗️ System Architecture

The application follows a full-stack architecture with separate frontend and backend applications.

                    ┌─────────────────────┐
                    │      Athlete        │
                    │   Registration UI   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Frontend       │
                    │       React         │
                    └──────────┬──────────┘
                               │
                         REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │       Backend       │
                    │   Node.js + Express │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      MongoDB        │
                    │      Database       │
                    └─────────────────────┘
🛠️ Technology Stack
Frontend
React.js
JavaScript
HTML5
CSS3
Vite
Backend
Node.js
Express.js
REST APIs
Database
MongoDB
Mongoose
Additional Technologies
Cloudinary — document/image storage
Nodemailer — email communication
PDFKit — registration receipt generation
XLSX — spreadsheet export
Puppeteer — PDF/browser-related processing
Docker — backend deployment support
Vercel — frontend deployment
Render — backend deployment
Development Tools
Git
GitHub
Postman
VS Code
📂 Project Structure
Competition-Management-System/
│
├── Backend/
│   ├── assets/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── seed/
│   ├── services/
│   ├── validators/
│   ├── app.js
│   └── server.js
│
├── Frontend/
│   ├── api/
│   ├── calculation/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── src/
│   └── index.html
│
└── README.md
🔄 Competition Flow

The competition workflow is divided into several stages:

1. Registration

Athletes submit their personal information, competition participation details, and required documents.

2. Verification

Officials review submitted information and verify athlete registrations.

3. Competition Entry

Verified athletes become eligible for competition entry and start-list generation.

4. Start List

The system organizes athletes according to competition requirements and generates the start list.

5. Live Competition

Officials operate the competition through the live control interface while recording athlete attempts and results.

6. Public Display

Competition information is presented through a separate read-only scoreboard for spectators.

📌 Project Status

The system currently includes the core workflow from athlete registration through live competition operations.

Implemented
Athlete registration
Registration number generation
Document submission
Registration verification
Competition management
Start-list management
Live competition control
Attempt tracking
Good Lift / No Lift processing
Automatic athlete progression
Public scoreboard
Future Improvements

Possible future extensions include:

Competition result reports
Certificates
Advanced statistics
Historical competition records
Athlete performance history
Enhanced public scoreboard features
Additional competition formats
🚀 Running the Project Locally
Clone the repository
git clone https://github.com/KOMAL-DEVRAPALLI/Competition-Management-System.git
cd Competition-Management-System
Backend
cd Backend
npm install
npm start
Frontend

Open another terminal:

cd Frontend
npm install
npm run dev

The frontend and backend environment variables should be configured locally before running the application.

🎓 What I Learned

This project gave me practical experience in building a real-world full-stack application rather than only developing isolated CRUD projects.

Through this project I worked with:

REST API design
Database modelling
Authentication and authorization
Form validation
File uploads
Email services
PDF generation
Spreadsheet generation
Frontend state management
API integration
Competition-specific business logic
Deployment and environment configuration
Debugging production issues
Designing software around a real operational workflow
👩‍💻 Developer

Komal Devrapalli

BCA Graduate | MCA Student | Full-Stack Web Developer

I build practical web applications using React, Node.js, Express.js, and MongoDB, with a focus on solving real-world workflow problems.

Connect
💼 LinkedIn: linkedin.com/in/komal-devrapalli-10062k25
🐙 GitHub: github.com/KOMAL-DEVRAPALLI
📄 License

This project is developed as a personal/academic project and is maintained by Komal Devrapalli.
