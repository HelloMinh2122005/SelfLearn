---
name: java-ecosystem-guide
description: >-
  Use this skill when teaching, explaining, reviewing code, or building hands-on labs for Java and the Spring backend ecosystem. Covers modern Java (Java 17/21 LTS), Project Loom & Concurrency, JVM Internals (Memory, GC, Bytecode), Spring Boot 3.x, JPA/Hibernate, and enterprise architecture patterns.
---

# Java Ecosystem Guide Skill

This skill guides the teaching, architecture design, and hands-on coding for modern enterprise Java and backend software engineering.

---

## 1. When to Use This Skill
- The user asks about Java language features, standard library, or idioms.
- The user seeks deep-dives into JVM internals (memory layout, Garbage Collectors, performance tuning).
- The user builds or learns Spring Boot 3.x, Spring Data, Spring Security, or Microservices.
- Designing hands-on coding labs or reviewing code in the `java/` directory.

---

## 2. Core Learning Tracks & Official Mapping

### Track 1: Modern Java Language Features (Java 17 & 21 LTS)
- **Data Modeling**: `record` (immutable data carriers), `sealed` classes and interfaces.
- **Pattern Matching**: Pattern matching for `instanceof`, pattern matching for `switch` (record patterns, exhaustive switch).
- **Modern Collections & API**: Sequenced Collections (`SequencedCollection`, `SequencedSet`, `SequencedMap`), `Optional` best practices, Stream API idioms.
- *Official Reference*: `https://docs.oracle.com/en/java/javase/21/language/`

### Track 2: Concurrency & Project Loom
- **Project Loom**: Virtual Threads (`Thread.ofVirtual().start()`, `Executors.newVirtualThreadPerTaskExecutor()`), when to use vs when to avoid (pinning on synchronized blocks / JNI).
- **Modern Concurrency**: Structured Concurrency, Scoped Values.
- **Classic Concurrency**: Thread Pool sizing, `CompletableFuture`, `ReentrantLock`, `CountDownLatch`, `ConcurrentHashMap`, Java Memory Model (JMM, happens-before, `volatile`).
- *Official Reference*: `https://openjdk.org/jeps/444` (Virtual Threads), `https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html`

### Track 3: JVM Internals & Performance Engineering
- **Memory Architecture**: Heap (Eden, Survivor, Tenured), Metaspace, Thread Stacks, Code Cache.
- **Garbage Collection**: G1 GC, ZGC (Generational ZGC in Java 21), Shenandoah, Serial/Parallel GC tradeoffs.
- **Diagnostics & Profiling**: `jcmd`, `jstack`, `jmap`, JDK Flight Recorder (JFR), JDK Mission Control (JMC).
- *Official Reference*: `https://docs.oracle.com/en/java/javase/21/gctuning/`

### Track 4: Spring Framework 6 & Spring Boot 3.x
- **Core Container**: Dependency Injection, Bean Lifecycle, Conditional configuration, AOP (Aspect-Oriented Programming).
- **Data Persistence**: Spring Data JPA, Hibernate 6 internals (N+1 query problem, fetch strategies, dirty checking, 1st/2nd level cache).
- **Security**: Spring Security 6 (SecurityFilterChain DSL, OAuth2 Resource Server, JWT authentication).
- **Cloud & Microservices**: REST APIs, Spring Cloud Gateway, Resilience4j (Circuit Breaker, Rate Limiting), Distributed Tracing (Micrometer, OpenTelemetry).
- *Official Reference*: `https://docs.spring.io/spring-boot/docs/current/reference/html/`

---

## 3. Coding & Output Guidelines for Java Topics

1. **Idiomatic Modern Java**:
   - Prefer Java 21 LTS idioms (`var`, records, switch expressions, text blocks).
   - Never write outdated boilerplate (e.g. avoid traditional verbose POJOs with manual getters/setters when a `record` is appropriate).
2. **Spring Boot 3 Standard**:
   - Use `jakarta.persistence.*`, `jakarta.servlet.*` (never deprecated `javax.*`).
   - Use functional `SecurityFilterChain` bean configuration instead of deprecated `WebSecurityConfigurerAdapter`.
3. **Executable & Testable**:
   - Accompany code with unit/integration tests using **JUnit 5**, **AssertJ**, and **Testcontainers**.
4. **Mandatory Citations**:
   - Include direct links to `docs.oracle.com/en/java/javase/21/...` or `docs.spring.io/...`.
