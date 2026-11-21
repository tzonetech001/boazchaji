boazchaji/
├── backend/                       <-- PHP BACKEND (Nje ya src)
│   ├── config/
│   │   └── db.php
│   ├── api/
│   │   ├── auth.php
│   │   ├── users.php
│   │   ├── customers.php
│   │   ├── services.php
│   │   └── device_types.php
│   ├── uploads/                   <-- Hapa picha za vifaa zitahifadhiwa
│   └── .htaccess
│
├── public/
│   ├── boaz.jpg                   <-- Logo yako ipo hapa
│   └── favicon.ico
│
├── src/
│   ├── app/
│   │   ├── core/                  
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts
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
│   │   │   ├── dashboard/
│   │   │   ├── services/
│   │   │   │   ├── service-form/
│   │   │   │   └── service-list/
│   │   │   ├── history/
│   │   │   └── settings/
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
│   └── styles.css                