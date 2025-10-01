#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR="${1:-nginx/certs}"
DOMAIN="${DOMAIN:-localhost}"
DAYS="${DAYS:-365}"

mkdir -p "$OUTPUT_DIR"

temp_conf=$(mktemp)
trap 'rm -f "$temp_conf"' EXIT

cat > "$temp_conf" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext

[dn]
C = US
ST = DevState
L = DevCity
O = ProcureX
OU = Dev
CN = ${DOMAIN}

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${DOMAIN}
DNS.2 = localhost
IP.1 = 127.0.0.1
EOF

echo "Generating self-signed certificate for ${DOMAIN} (expires in ${DAYS} days)"
openssl req -x509 -nodes -days "$DAYS" -newkey rsa:2048 \
  -keyout "$OUTPUT_DIR/privkey.pem" \
  -out "$OUTPUT_DIR/fullchain.pem" \
  -config "$temp_conf"

echo "Certificate generated:"
echo "  $OUTPUT_DIR/fullchain.pem"
echo "  $OUTPUT_DIR/privkey.pem"