#!/bin/sh
set -e
curl -s -c /tmp/sos.jar -X POST http://localhost:3001/api/auth/sign-in/email \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3001' \
  -d '{"email":"rider@bikie.app","password":"Rider@12345"}' > /tmp/login.json
echo "LOGIN=$(head -c 80 /tmp/login.json)"
curl -s -b /tmp/sos.jar -b 'selectedRole=RIDER' -X POST http://localhost:3001/api/sos/alerts \
  -H 'Content-Type: application/json' \
  -d '{"type":"ACCIDENT","description":"Red Alert — Accident","latitude":12.9716,"longitude":77.5946,"city":"Bangalore"}'
echo ""
