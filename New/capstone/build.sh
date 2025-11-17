#!/bin/bash
npm install
NODE_ENV=production ./node_modules/.bin/vite build
