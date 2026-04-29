#!/bin/bash
set -e
CENTRAL_LICENSE_KEY=$CENTRAL_LICENSE_KEY npm ci
npm run build
