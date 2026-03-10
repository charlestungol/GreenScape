# GreenScape (ReactJS + Django + MSSQL)

# Python version 3.12

## SQL Server Setup (Pre-requisit: Have SQL server and SSMS installed)

1. Server Name = localhost
2. Authentication = Windows Authentication
3. Databse Name = <default>
4. Encrypt = Mandatory
5. Trust Server Certification = True/Check

### SQL Server note – SimpleJWT for backend setup
<!-- 
`token_blacklist.0008_migrate_to_bigautofield` is incompatible with SQL Server
because it alters a column with a UNIQUE constraint.

We intentionally mark it as applied using:

    python manage.py migrate token_blacklist 0008 --fake

Do not remove this step. -->


## BACKEND SETUP

1. cd backend
2. python -m venv venv
3. py -3.12 -m venv venv
4. venv\Scripts\activate
5. pip install -r requirements.txt
6. python manage.py migrate token_blacklist 0007
7. python manage.py migrate token_blacklist 0008 --fake
8. python manage.py migrate
9. python manage.py sync_roles
10. python manage.py runserver

<!-- Back End Email verification when creating account -->
<!-- Use either one of these 2, comment/uncomment as needed in auth/settings.py -->

# EMAIL_PORT = 465 # Use with EMAIL_USE_SSL = True

# EMAIL_PORT = 587 # Use with EMAIL_USE_TLS = True

## FRONTEND SETUP

1. cd frontend
2. npm i
3. npm run dev
