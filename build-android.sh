#!/bin/bash

# Build the project
npm run build

# Sync Capacitor
npx cap sync

# Build the Android APK
npx cap build android