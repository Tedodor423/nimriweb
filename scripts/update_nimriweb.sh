#!/bin/bash
cd /home/theo/nimriweb || exit
git fetch --all
git reset --hard origin/main
npm install
rm -r /var/www/html/*
mkdir /var/www/html/css/

find src/scss -maxdepth 1 -type f -exec sh -c 'filename=$(basename "$1" .scss); npx sass "$1" "src/_includes/css/${filename}.css"' _ {} \;
find src/scss/arnost -maxdepth 1 -type f -exec sh -c 'filename=$(basename "$1" .scss); npx sass "$1" "src/_includes/css/arnost/${filename}.css"' _ {} \;
find src/scss/theo -maxdepth 1 -type f -exec sh -c 'filename=$(basename "$1" .scss); npx sass "$1" "src/_includes/css/theo/${filename}.css"' _ {} \;
find src/scss/large -maxdepth 1 -type f -exec sh -c 'filename=$(basename "$1" .scss); npx sass "$1" "/var/www/html/css/${filename}.css"' _ {} \;


npx eleventy
