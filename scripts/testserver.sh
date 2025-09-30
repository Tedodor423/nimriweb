#!/bin/bash
set -e

rm -rf _site/*
mkdir _site/css

# Ensure all background jobs are killed on exit (Ctrl+C or normal exit)
trap 'kill 0' EXIT
find src/scss -maxdepth 1 -type f ! -name "base.scss" ! -name "_*" -exec sh -c 'filename=$(basename "$1" .scss); npx sass --watch "$1" "_site/css/${filename}.css" &' _ {} \;

npx sass --watch src/scss/base.scss src/_includes/css/base.css &

npx eleventy --serve