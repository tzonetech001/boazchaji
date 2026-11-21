boazchaji/
│
├── backend/                          <-- PHP BACKEND (Weka kwenye htdocs)
│   ├── config/
│   │   └── db.php                    <-- Database Connection
│   ├── api/
│   │   ├── auth.php                  <-- Login, Register, Forgot/Reset Password
│   │   ├── users.php                 <-- Admin: Manage Agents, Edit, Deactivate, Trash
│   │   ├── customers.php             <-- Search & Add Customers
│   │   ├── services.php              <-- Create, Get, Mark Paid
│   │   ├── device_types.php          <-- Get Device Types
│   │   ├── stats.php                 <-- Dashboard Statistics
│   │   └── profile.php               <-- Update Profile & Password
│   ├── uploads/                      <-- Picha za vifaa (chmod 755/777)
│   └── .htaccess                     <-- CORS Headers
│
├── src/                              <-- ANGULAR FRONTEND
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── admin.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   └── token.interceptor.ts
│   │   │   ├── models/
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── customer.model.ts
│   │   │   │   └── service.model.ts
│   │   │   └── services/
│   │   │       ├── auth.service.ts
│   │   │       ├── api.service.ts
│   │   │       └── theme.service.ts
│   │   ├── layout/
│   │   │   ├── header/
│   │   │   │   ├── header.component.ts
│   │   │   │   ├── header.component.html
│   │   │   │   └── header.component.css
│   │   │   ├── sidebar/
│   │   │   │   ├── sidebar.component.ts
│   │   │   │   ├── sidebar.component.html
│   │   │   │   └── sidebar.component.css
│   │   │   ├── layout.component.ts
│   │   │   ├── layout.component.html
│   │   │   └── layout.component.css
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   └── login/
│   │   │   │       ├── login.component.ts
│   │   │   │       ├── login.component.html
│   │   │   │       └── login.component.css
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.component.html
│   │   │   │   └── dashboard.component.css
│   │   │   ├── services/
│   │   │   │   ├── service-form/
│   │   │   │   │   ├── service-form.component.ts
│   │   │   │   │   ├── service-form.component.html
│   │   │   │   │   └── service-form.component.css
│   │   │   │   └── service-list/
│   │   │   │       ├── service-list.component.ts
│   │   │   │       ├── service-list.component.html
│   │   │   │       └── service-list.component.css
│   │   │   ├── history/
│   │   │   │   ├── history.component.ts
│   │   │   │   ├── history.component.html
│   │   │   │   └── history.component.css
│   │   │   ├── settings/                 <-- MPYA: Lugha & Theme
│   │   │   │   ├── settings.component.ts
│   │   │   │   ├── settings.component.html
│   │   │   │   └── settings.component.css
│   │   │   ├── profile/
│   │   │   │   ├── profile.component.ts
│   │   │   │   ├── profile.component.html
│   │   │   │   └── profile.component.css
│   │   │   ├── users/                    <-- MPYA: Usimamizi wa Watumiaji (Admin)
│   │   │   │   ├── user-management.component.ts
│   │   │   │   ├── user-management.component.html
│   │   │   │   └── user-management.component.css
│   │   │   └── trash/                    <-- MPYA: Rejesha au Futa Kabisa
│   │   │       ├── trash.component.ts
│   │   │       ├── trash.component.html
│   │   │       └── trash.component.css
│   │   ├── app.config.ts
│   │   ├── app.css
│   │   ├── app.html
│   │   ├── app.routes.ts
│   │   └── app.ts
│   ├── assets/
│   │   └── i18n/
│   │       ├── sw.json
│   │       └── en.json
│   ├── index.html
│   ├── main.ts
│   ├── manifest.webmanifest           <-- PWA
│   └── styles.css
│
├── public/
│   ├── boaz.jpg                       <-- Logo yako
│   ├── favicon.ico
│   └── manifest.webmanifest           <-- PWA (Ili iweze ku-install)
│
├── ngsw-config.json                   <-- PWA Config
├── angular.json
├── package.json
└── tsconfig.json