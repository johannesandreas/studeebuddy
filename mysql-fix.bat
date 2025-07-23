@echo off
echo Fixing MySQL authentication...
mysql -u root -p < fix-mysql.sql
echo Done! Now restart your Node.js app.