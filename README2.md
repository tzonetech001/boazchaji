📱 BOAZCHAJI - Service Management System
BOAZCHAJI is a comprehensive, web-based service management system designed specifically for phone repair shops and electronic device technicians. It helps manage customers, track repair jobs, handle payments, manage staff (agents), and maintain a complete history of completed services.

🏢 Developed & Designed By
TZONETECH
🌐 https://tzonetech.co.tz
Innovative Software Solutions

🚀 Key Features & System Logic
The system is built on Role-Based Access Control (RBAC), divided into two main roles: Admin and Agent.

1. User & Authentication Logic
Login/Register: Secure authentication using PHP password_hash (bcrypt) and custom base64 tokens.

Role Management: Admins have full access; Agents only see their own data.

Forgot Password: A two-step verification process (Email verification followed by password reset).

Profile Management: Users can update their profile info, change passwords, and upload profile pictures (on-the-spot UI updates without refreshing).

2. Customer Management Logic
Agent Isolation: An Agent can only see and manage the customers they registered.

Admin Oversight: Admins can see all customers and assign specific customers to specific Agents.

Auto-Registration: When creating a new service, if the customer's name doesn't exist, they are automatically saved into the database.

3. Service & Repair Management (Core Logic)
Job Creation: Agents record the customer, device details, quantity, price, and payment status.

Multiple Image Uploads: Supports uploading multiple photos of the device (stored as JSON arrays in the database).

Partial Returns (Quantity Tracking): If a customer brings in 3 devices and takes 1, the system tracks the taken_quantity. The job stays in the "Pending" list until all devices are taken.

Payment Tracking: Jobs can be marked as "Paid" or "Pending" on the spot.

Deletion Protection: A service cannot be deleted if the device has already been partially or fully taken by the customer.

4. History & Archiving Logic
Auto-Archive: Once a job is marked "Paid" AND all devices are "Taken" (taken_quantity == quantity), it automatically moves to the History page.

Bulk Selection: Admins can select multiple history records and delete them simultaneously.

Strict Deletion: Only Admins can delete from history; Agents can view their own history but cannot delete.

5. Notifications & Alerts Logic
System Alerts: Automatically generated when an Agent creates a new job. It notifies the specific Agent and all Admins.

Admin Messages: Admins can send custom messages (with PDF/Image attachments < 2MB) to all Agents or specific selected Agents.

Read/Unread State: Notifications are personalized. Marking a message as read only affects the current user, not others.

Bulk Delete: Admins have a unique privilege to bulk-delete notifications.

6. UI/UX & System Settings
Instant Localization (i18n): The system supports English and Swahili with inline translations (no page reload required). Flag icons (SVG) are used to switch languages.

Theming: Dynamic Light and Dark mode toggling using CSS variables.

Responsive Design: Fully responsive layout (Mobile, Tablet, Desktop). The Sidebar collapses into a hamburger menu on smaller screens.

PWA Ready: Configured with manifest.webmanifest and ngsw-config.json for Progressive Web App support (installable on mobile).

🛠️ Tech Stack
Frontend: Angular (v18+), RxJS, Reactive Forms, Custom Services (for state & translation).

Backend: PHP (RESTful API architecture).

Database: MySQL (using PDO for secure queries).

Styling: Vanilla CSS with CSS Variables for dynamic theming.

Icons: FontAwesome 6.

🗄️ Database Schema Summary
The database (boazchaji_db) consists of the following tables:

users: Stores Admin and Agent data (roles, status, profile pictures).

customers: Stores client details linked to the Agent who registered them.

device_types: Lookup table for device categories (Phone, Radio, Battery, etc.).

services: The core table tracking jobs, quantities, total amounts, statuses, and image JSON arrays.

notifications: Tracks messages, system alerts, attachments, and read states.

activity_logs: (Optional) Audits user logins and actions.

⚙️ Installation & Setup Guide
Prerequisites
XAMPP / WAMP / MAMP (PHP 7.4+ & MySQL)

Node.js & Angular CLI

1. Backend Setup (PHP)
Move the backend folder to your htdocs (XAMPP) or www (WAMP) directory.

Open phpMyAdmin and create a database named boazchaji_db.

Import the provided schema.sql file to generate all tables and initial data.

Configure database connection:
Navigate to backend/config/db.php and update the $username and $password to match your local server.

Ensure the backend/uploads/ folder exists and has write permissions (chmod 777).

2. Frontend Setup (Angular)
Open your terminal and navigate to the frontend directory.

Install dependencies:

bash
npm install
Configure the API URL:
Navigate to src/environments/environment.ts and set your backend URL:

typescript
export const environment = {
  production: false,
  baseUrl: 'http://localhost/boazchaji/backend'
};
Run the development server:

bash
ng serve
Open your browser and navigate to http://localhost:4200.

