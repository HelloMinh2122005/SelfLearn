package dev.selflearn.hello;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * hello-svc: a tiny HTTP service used by every lab in the container curriculum.
 *
 * Only the JDK is used (com.sun.net.httpserver), so the image stays small and
 * the build needs no framework.
 *
 * Endpoints:
 *   GET /           greeting, host name and version
 *   GET /health     liveness check (always 200 while the process runs)
 *   GET /ready      readiness check (503 until STARTUP_DELAY_MS has passed)
 *   GET /order?id=N fake business call; returns 500 when N is a multiple of 7
 *   any other path  404
 *
 * Environment variables:
 *   PORT                  listen port (default 8080)
 *   APP_VERSION           version string shown in responses and logs
 *   GREETING              greeting text (default "hello")
 *   STARTUP_DELAY_MS      delay before /ready returns 200 (default 0)
 *   ALLOCATE_MB_ON_START  allocate and touch N MiB of heap at start (default 0),
 *                         used by the OOM labs
 *
 * Every log line is one JSON object on stdout.
 */
public final class App {

    private static final AtomicBoolean READY = new AtomicBoolean(false);
    // Keeps the allocated memory reachable so the GC cannot free it.
    private static final List<byte[]> BALLAST = new ArrayList<>();

    private App() {
    }

    public static void main(String[] args) throws Exception {
        int port = Integer.parseInt(env("PORT", "8080"));
        String version = env("APP_VERSION", "dev");
        String greeting = env("GREETING", "hello");
        long startupDelayMs = Long.parseLong(env("STARTUP_DELAY_MS", "0"));
        int allocateMb = Integer.parseInt(env("ALLOCATE_MB_ON_START", "0"));
        String host = InetAddress.getLocalHost().getHostName();

        log("INFO", "starting", "version", version, "host", host,
                "maxHeapMiB", String.valueOf(Runtime.getRuntime().maxMemory() / (1024 * 1024)));

        allocate(allocateMb);

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        // HttpServer matches contexts by prefix ("/health" would also match "/healthz"),
        // so exact() makes every endpoint answer only its own path and 404 otherwise.
        exact(server, "/", ex -> respond(ex, 200, greeting + " from " + host + " version=" + version + "\n"));
        exact(server, "/health", ex -> respond(ex, 200, "ok\n"));
        exact(server, "/ready", ex -> {
            boolean ready = READY.get();
            respond(ex, ready ? 200 : 503, ready ? "ready\n" : "starting\n");
        });
        exact(server, "/order", ex -> handleOrder(ex, version));
        server.start();
        log("INFO", "listening", "port", String.valueOf(port));

        // SIGTERM (docker stop, podman stop, Kubernetes pod deletion) runs this hook.
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            log("INFO", "shutdown signal received, stopping http server");
            server.stop(2);
            log("INFO", "stopped");
        }));

        Thread.sleep(startupDelayMs);
        READY.set(true);
        log("INFO", "ready");
    }

    private static void exact(HttpServer server, String path, HttpHandler handler) {
        server.createContext(path, ex -> {
            if (!path.equals(ex.getRequestURI().getPath())) {
                respond(ex, 404, "not found\n");
                return;
            }
            handler.handle(ex);
        });
    }

    /** Business rule used by the unit test: order ids that are multiples of 7 fail. */
    static int orderStatus(int id) {
        return id % 7 == 0 ? 500 : 200;
    }

    private static void handleOrder(HttpExchange ex, String version) throws IOException {
        String requestId = ex.getRequestHeaders().getFirst("X-Request-Id");
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }
        int id;
        try {
            id = Integer.parseInt(queryParam(ex.getRequestURI().getQuery(), "id"));
        } catch (NumberFormatException e) {
            log("WARN", "bad request", "requestId", requestId, "path", "/order");
            respond(ex, 400, "id must be an integer\n");
            return;
        }
        int status = orderStatus(id);
        if (status == 500) {
            log("ERROR", "payment-service timeout", "requestId", requestId,
                    "orderId", String.valueOf(id), "status", "500", "version", version);
            respond(ex, 500, "order " + id + " failed\n");
        } else {
            log("INFO", "order processed", "requestId", requestId,
                    "orderId", String.valueOf(id), "status", "200", "version", version);
            respond(ex, 200, "order " + id + " ok\n");
        }
    }

    private static void allocate(int megabytes) {
        if (megabytes <= 0) {
            return;
        }
        log("INFO", "allocating memory", "mib", String.valueOf(megabytes));
        for (int i = 0; i < megabytes; i++) {
            byte[] block = new byte[1024 * 1024];
            Arrays.fill(block, (byte) 1); // touch every page so it really uses RAM
            BALLAST.add(block);
        }
        log("INFO", "allocation done", "mib", String.valueOf(megabytes));
    }

    private static String queryParam(String query, String name) {
        if (query == null) {
            return "";
        }
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2 && kv[0].equals(name)) {
                return kv[1];
            }
        }
        return "";
    }

    private static void respond(HttpExchange ex, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String env(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? fallback : value;
    }

    /** Prints one JSON log line. Keys and values are plain strings. */
    static void log(String level, String msg, String... kv) {
        StringBuilder sb = new StringBuilder(128);
        sb.append("{\"ts\":\"").append(Instant.now()).append('"');
        sb.append(",\"level\":\"").append(level).append('"');
        sb.append(",\"msg\":\"").append(escape(msg)).append('"');
        for (int i = 0; i + 1 < kv.length; i += 2) {
            sb.append(",\"").append(escape(kv[i])).append("\":\"").append(escape(kv[i + 1])).append('"');
        }
        sb.append('}');
        System.out.println(sb);
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
