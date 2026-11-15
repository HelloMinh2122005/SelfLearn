#!/bin/sh
# Wrapper script used by Dockerfile.naive.
echo "starting hello-svc"
java -jar /app/target/hello-svc.jar
