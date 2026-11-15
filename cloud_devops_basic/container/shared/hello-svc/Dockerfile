# Reference Dockerfile for hello-svc (same as the answer of lab 6_2_1).
# Works with both `docker build` and `podman build`.

# ---------- Stage 1: build the jar with Maven ----------
FROM docker.io/library/maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src

# Copy only pom.xml first: this layer and the dependency download below
# stay cached until pom.xml changes.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Source code changes more often, so it is copied last.
COPY src ./src
RUN mvn -B -q package

# ---------- Stage 2: runtime image with only a JRE ----------
FROM docker.io/library/eclipse-temurin:21-jre

ENV PORT=8080 \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"

WORKDIR /app
COPY --from=build /src/target/hello-svc.jar /app/hello-svc.jar

# The version is declared last so changing it rebuilds only the final layers.
# It is also used in a RUN step: with Podman/Buildah (seen on Podman 5.8.9) an ARG used
# only in ENV did not change the cache key, so a new --build-arg reused the old layer.
ARG APP_VERSION=dev
RUN echo "${APP_VERSION}" > /app/VERSION
ENV APP_VERSION=${APP_VERSION}

# Numeric non-root user: Kubernetes `runAsNonRoot: true` can verify a numeric UID.
USER 10001:10001
EXPOSE 8080

# Exec form: java is PID 1 and receives SIGTERM directly.
ENTRYPOINT ["java", "-jar", "/app/hello-svc.jar"]
