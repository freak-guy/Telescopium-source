#!/bin/bash

hexo clean
hexo g

scp -r public/* root@8.130.126.229:/var/www/blog/

echo "Deploy finished."
