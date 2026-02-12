# GreenScape (ReactJS + Django + MSSQL)

## BACKEND SETUP
1. cd backend
2. python -m venv venv
3. venv\Scripts\activate
4. pip install -r requirements.txt
5. pip install django-allauth dj-rest-auth
6. pip install mssql-django
7. python manage.py migrate
8. python manage.py runserver

<!-- Back End Email verification when creating account -->
<!-- Use either one of these 2, comment/uncomment as needed in auth/settings.py -->
# EMAIL_PORT = 465  # Use with EMAIL_USE_SSL = True
# EMAIL_PORT = 587  # Use with EMAIL_USE_TLS = True

## FRONTEND SETUP
1. cd frontend
2. npm i
3. npm run dev
