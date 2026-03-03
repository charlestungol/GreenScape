# GreenScape (ReactJS + Django + MSSQL)
# Python version 3.12

## SQL Server Setup (Pre-requisit: Have SQL server and SSMS installed)
1. Server Name = localhost
2. Authentication = Windows Authentication
3. Databse Name = <default>
4. Encrypt = Mandatory
5. Trust Server Certification = True/Check
# Once SSMS is open and connection establish
6. Click FIle
7. Open
8. File
9. Find 'GreenScape.sql' From prject folder
10. Execute


## BACKEND SETUP
1. cd backend
2. python -m venv venv
2. py -3.12 -m venv venv 
3. venv\Scripts\activate
4. pip install -r requirements.txt
5. python manage.py migrate
6. python manage.py sync_roles
7. python manage.py runserver

<!-- Back End Email verification when creating account -->
<!-- Use either one of these 2, comment/uncomment as needed in auth/settings.py -->
# EMAIL_PORT = 465  # Use with EMAIL_USE_SSL = True
# EMAIL_PORT = 587  # Use with EMAIL_USE_TLS = True

## FRONTEND SETUP
1. cd frontend
2. npm i
3. npm run dev
