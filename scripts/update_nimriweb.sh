#!/bin/bash
cd /home/theo/nimriweb || exit
git fetch --all
git reset --hard origin/main
npm install
rm -r /var/www/html/*

npm exec -- eleventy
ELEVENTY_OUTPUT=/var/www/html node scripts/build-presentations.js
