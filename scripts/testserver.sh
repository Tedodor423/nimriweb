#!/bin/bash
set -e

rm -rf _site/*

# Ensure all background jobs are killed on exit (Ctrl+C or normal exit)
trap 'kill 0' EXIT
ELEVENTY_OUTPUT=_site node scripts/build-presentations.js --watch &

npm exec -- eleventy --serve
