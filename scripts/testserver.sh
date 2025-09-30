#!/bin/bash
set -e

rm -rf _site/*
mkdir _site/css

# Ensure all background jobs are killed on exit (Ctrl+C or normal exit)
trap 'kill 0' EXIT
find src/scss -maxdepth 1 -type f ! -name "_*" -exec sh -c 'filename=$(basename "$1" .scss); npx sass --watch "$1" "src/_includes/css/${filename}.css" &' _ {} \;
find src/scss/theo -maxdepth 1 -type f ! -name "_*" -exec sh -c 'filename=$(basename "$1" .scss); npx sass --watch "$1" "src/_includes/css/theo/${filename}.css" &' _ {} \;
find src/scss/arnost -maxdepth 1 -type f ! -name "_*" -exec sh -c 'filename=$(basename "$1" .scss); npx sass --watch "$1" "src/_includes/css/arnost/${filename}.css" &' _ {} \;

find src/scss/large -maxdepth 1 -type f ! -name "_*" -exec sh -c 'filename=$(basename "$1" .scss); npx sass --watch "$1" "_site/css/${filename}.css" &' _ {} \;

npx eleventy --serve
