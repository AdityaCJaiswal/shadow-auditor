package org.auditor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Centralized configuration loader.
 * Priority: System env vars > System properties > application.properties
 */
public final class AppConfig {

    private static final Logger log = LoggerFactory.getLogger(AppConfig.class);
    private static final Properties props = new Properties();

    static {
        try (InputStream is = AppConfig.class.getClassLoader()
                .getResourceAsStream("application.properties")) {
            if (is != null) {
                props.load(is);
                log.debug("Loaded application.properties");
            }
        } catch (IOException e) {
            log.warn("Could not load application.properties – using defaults");
        }
    }

    private AppConfig() {}

    /** Returns property value, checking env vars and system props first. */
    public static String get(String key) {
        // 1. Env var (e.g. GEMINI_MODEL for gemini.model)
        String envKey = key.replace('.', '_').replace('-', '_').toUpperCase();
        String envVal = System.getenv(envKey);
        if (envVal != null && !envVal.isBlank()) return envVal;

        // 2. System property
        String sysProp = System.getProperty(key);
        if (sysProp != null && !sysProp.isBlank()) return sysProp;

        // 3. application.properties
        return props.getProperty(key);
    }

    public static String get(String key, String defaultValue) {
        String val = get(key);
        return (val != null && !val.isBlank()) ? val : defaultValue;
    }

    public static double getDouble(String key, double defaultValue) {
        try { return Double.parseDouble(get(key)); }
        catch (Exception e) { return defaultValue; }
    }

    public static int getInt(String key, int defaultValue) {
        try { return Integer.parseInt(get(key)); }
        catch (Exception e) { return defaultValue; }
    }

    /** Resolves the Gemini API key from standard environment variables. */
    public static String resolveApiKey() {
        String key = System.getenv("GOOGLE_API_KEY");
        if (key != null && !key.isBlank()) return key;
        key = System.getenv("GEMINI_API_KEY");
        if (key != null && !key.isBlank()) return key;
        key = System.getProperty("google.api.key");
        if (key != null && !key.isBlank()) return key;
        throw new IllegalStateException(
                "No API key found. Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable.");
    }
}