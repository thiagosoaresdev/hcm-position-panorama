#!/bin/bash

# Script to generate SSL certificates for development/staging
# For production, use Let's Encrypt or your organization's CA

set -e

DOMAIN=${1:-"quadro-lotacao.senior.com.br"}
CERT_DIR="./ssl-certs"
DAYS=365

echo "Generating SSL certificates for domain: $DOMAIN"

# Create certificate directory
mkdir -p "$CERT_DIR"

# Generate private key
openssl genrsa -out "$CERT_DIR/key.pem" 2048

# Generate certificate signing request
openssl req -new -key "$CERT_DIR/key.pem" -out "$CERT_DIR/csr.pem" -subj "/C=BR/ST=SC/L=Blumenau/O=Senior Sistemas/OU=IT/CN=$DOMAIN"

# Generate self-signed certificate
openssl x509 -req -in "$CERT_DIR/csr.pem" -signkey "$CERT_DIR/key.pem" -out "$CERT_DIR/cert.pem" -days $DAYS -extensions v3_req -extfile <(
cat <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = BR
ST = SC
L = Blumenau
O = Senior Sistemas
OU = IT
CN = $DOMAIN

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = *.$DOMAIN
DNS.3 = localhost
IP.1 = 127.0.0.1
EOF
)

# Clean up CSR
rm "$CERT_DIR/csr.pem"

# Set proper permissions
chmod 600 "$CERT_DIR/key.pem"
chmod 644 "$CERT_DIR/cert.pem"

echo "SSL certificates generated successfully:"
echo "  Certificate: $CERT_DIR/cert.pem"
echo "  Private Key: $CERT_DIR/key.pem"

# Generate base64 encoded values for Kubernetes secrets
echo ""
echo "Base64 encoded values for Kubernetes secrets:"
echo "tls.crt: $(base64 -w 0 "$CERT_DIR/cert.pem")"
echo "tls.key: $(base64 -w 0 "$CERT_DIR/key.pem")"

# Verify certificate
echo ""
echo "Certificate details:"
openssl x509 -in "$CERT_DIR/cert.pem" -text -noout | grep -E "(Subject:|DNS:|IP Address:|Not Before|Not After)"