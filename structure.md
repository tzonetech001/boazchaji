boazchaji/
│
├── backend/                          <-- PHP BACKEND (Weka hii kwenye htdocs au server)
│   ├── config/
│   │   └── db.php                    <-- Database Connection (CORS zipo hapa)
│   ├── api/
│   │   ├── auth.php                  <-- Login, Register, Forgot Password
│   │   ├── users.php                 <-- Manage Agents/Users (View, Add, Edit, Delete, Trash)
│   │   ├── customers.php             <-- Manage Customers (Filtered by Role/Agent)
│   │   ├── services.php              <-- Manage Services (Multi-images, Taken, History)
│   │   ├── device_types.php          <-- Aina za Vifaa (View, Add, Delete)
│   │   ├── notifications.php         <-- Taarifa (Send, Get, Mark Read, Clear All)
│   │   ├── stats.php                 <-- Dashboard Statistics
│   │   └── profile.php               <-- Update Profile, Change Password, Upload Avatar
│   ├── uploads/                      <-- Picha za vifaa na Profile (Hakikisha ina ruhusa: chmod 777/755)
│   └── .htaccess                     <-- CORS Headers (Kama upo)
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
│   │   │       ├── auth.service.ts           <-- Logic ya Login/Logout & Current User
│   │   │       ├── api.service.ts            <-- API Calls zote (GET, POST, PUT, DELETE)
│   │   │       ├── theme.service.ts          <-- Light/Dark Mode
│   │   │       ├── language.service.ts       <-- Lugha (SW/EN) kwa sasa inatumika Inline
│   │   │       └── notification.service.ts   <-- Logic ya kutuma na kupokea taarifa
│   │   │
│   │   ├── layout/
│   │   │   ├── header/
│   │   │   │   ├── header.component.ts       <-- Inasoma picha ya mtumiaji papo hapo (On-spot)
│   │   │   │   ├── header.component.html     <-- Ina Flag za SW/GB na Profile Dropdown
│   │   │   │   └── header.component.css
│   │   │   ├── sidebar/
│   │   │   │   ├── sidebar.component.ts      <-- Ina count ya Notifications (Badge)
│   │   │   │   ├── sidebar.component.html    <-- Menyu (Dashboard, Users, Customers, n.k.)
│   │   │   │   └── sidebar.component.css
│   │   │   ├── layout.component.ts
│   │   │   ├── layout.component.html         <-- Header juu, Sidebar chini yake
│   │   │   └── layout.component.css
│   │   │
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
│   │   │   │   └── service-list/             <-- Umeweka fomu yote hapa ndani (Modals)
│   │   │   │       ├── service-list.component.ts
│   │   │   │       ├── service-list.component.html
│   │   │   │       └── service-list.component.css
│   │   │   ├── history/
│   │   │   │   ├── history.component.ts      <-- Ina Bulk Select, Pagination, Search
│   │   │   │   ├── history.component.html
│   │   │   │   └── history.component.css
│   │   │   ├── customers/
│   │   │   │   ├── customers.component.ts    <-- Ina Modals za Add/Edit/Delete
│   │   │   │   ├── customers.component.html
│   │   │   │   └── customers.component.css
│   │   │   ├── users/
│   │   │   │   ├── user-management.component.ts <-- Modals, Role assignment, Avatars
│   │   │   │   ├── user-management.component.html
│   │   │   │   └── user-management.component.css
│   │   │   ├── profile/
│   │   │   │   ├── profile.component.ts         <-- Upload Avatar, Update Info
│   │   │   │   ├── profile.component.html
│   │   │   │   └── profile.component.css
│   │   │   ├── settings/
│   │   │   │   ├── settings.component.ts        <-- Appearance & Language
│   │   │   │   ├── settings.component.html
│   │   │   │   └── settings.component.css
│   │   │   └── notifications/
│   │   │       ├── notifications.component.ts   <-- Admin Send, Mark Read
│   │   │       ├── notifications.component.html
│   │   │       └── notifications.component.css
│   │   │
│   │   ├── app.config.ts
│   │   ├── app.routes.ts             <-- Routing zote (Bila service/new tena)
│   │   ├── app.ts
│   │   ├── app.html
│   │   └── app.css
│   │
│   ├── assets/
│   │   ├── icons/
│   │   │   ├── sw.svg                <-- Bendera ya Tanzania
│   │   │   └── gb.svg                <-- Bendera ya Uingereza
│   │   └── (picha zingine kama zipo)
│   │
│   ├── environments/                 <-- MUHIMU: Kwa ajili ya Base URL
│   │   └── environment.ts            <-- baseUrl: 'http://localhost/boazchaji/backend'
│   │
│   ├── index.html                    <-- Weka FontAwesome CDN hapa
│   ├── main.ts
│   ├── manifest.webmanifest          <-- PWA
│   └── styles.css                    <-- Global styles & CSS Variables
│
├── public/
│   ├── boaz.jpg                      <-- Logo ya mfumo
│   └── favicon.ico
│
├── schema.sql                        <-- Database schema yote (Weka kwenye phpMyAdmin)
├── ngsw-config.json                  <-- PWA Config
├── angular.json
├── package.json
└── tsconfig.json