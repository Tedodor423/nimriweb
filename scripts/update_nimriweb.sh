#!/bin/bash
cd /home/theo/nimriweb || exit
git fetch --all
git reset --hard origin/main
npm install
rm -r /var/www/html/*

find src/scss -maxdepth 1 -type f ! -name "base.scss" -exec npx sass {} /var/www/html/css/{}.css \;
npx sass src/scss/base.scss src/_includes/css/base.css

npx eleventy
