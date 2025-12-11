@echo off
REM Script to generate SSL certificates for development/staging (Windows version)
REM For production, use Let's Encrypt or your organization's CA
REM Requires OpenSSL to be installed and in PATH

setlocal enabledelayedexpansion

set DOMAIN=%1
if "%DOMAIN%"=="" set DOMAIN=quadro-lotacao.senior.com.br

set CERT_DIR=ssl-certs
set DAYS=365

echo Generating SSL certificates for domain: %DOMAIN%

REM Create certificate directory
if not exist "%CERT_DIR%" mkdir "%CERT_DIR%"

REM Generate private key
openssl genrsa -out "%CERT_DIR%\key.pem" 2048

REM Create config file for certificate
echo [req] > temp_config.txt
echo distinguished_name = req_distinguished_name >> temp_config.txt
echo req_extensions = v3_req >> temp_config.txt
echo prompt = no >> temp_config.txt
echo. >> temp_config.txt
echo [req_distinguished_name] >> temp_config.txt
echo C = BR >> temp_config.txt
echo ST = SC >> temp_config.txt
echo L = Blumenau >> temp_config.txt
echo O = Senior Sistemas >> temp_config.txt
echo OU = IT >> temp_config.txt
echo CN = %DOMAIN% >> temp_config.txt
echo. >> temp_config.txt
echo [v3_req] >> temp_config.txt
echo keyUsage = keyEncipherment, dataEncipherment >> temp_config.txt
echo extendedKeyUsage = serverAuth >> temp_config.txt
echo subjectAltName = @alt_names >> temp_config.txt
echo. >> temp_config.txt
echo [alt_names] >> temp_config.txt
echo DNS.1 = %DOMAIN% >> temp_config.txt
echo DNS.2 = *.%DOMAIN% >> temp_config.txt
echo DNS.3 = localhost >> temp_config.txt
echo IP.1 = 127.0.0.1 >> temp_config.txt

REM Generate certificate signing request
openssl req -new -key "%CERT_DIR%\key.pem" -out "%CERT_DIR%\csr.pem" -config temp_config.txt

REM Generate self-signed certificate
openssl x509 -req -in "%CERT_DIR%\csr.pem" -signkey "%CERT_DIR%\key.pem" -out "%CERT_DIR%\cert.pem" -days %DAYS% -extensions v3_req -extfile temp_config.txt

REM Clean up temporary files
del temp_config.txt
del "%CERT_DIR%\csr.pem"

echo SSL certificates generated successfully:
echo   Certificate: %CERT_DIR%\cert.pem
echo   Private Key: %CERT_DIR%\key.pem

echo.
echo Base64 encoded values for Kubernetes secrets:
echo Note: Use PowerShell or online tool to base64 encode the certificate files

echo.
echo Certificate details:
openssl x509 -in "%CERT_DIR%\cert.pem" -text -noout | findstr /C:"Subject:" /C:"DNS:" /C:"IP Address:" /C:"Not Before" /C:"Not After"

endlocal