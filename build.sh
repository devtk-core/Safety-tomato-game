#!/bin/sh
set -eu
mkdir -p dist
cp index.html script.js leaderboard.js share.js dist/
cp -R img fonts dist/
