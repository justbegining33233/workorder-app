// OpenTelemetry configuration for distributed tracing and APM
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Configure Jaeger exporter for distributed tracing
const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
});

// Configure Prometheus exporter for metrics
const prometheusExporter = new PrometheusExporter({
  port: parseInt(process.env.PROMETHEUS_PORT || '9464'),
});

// Create resource with service information
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'fixtray-app',
  [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
  [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'workorder-management',
});

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  resource,
  traceExporter: jaegerExporter,
  metricExporter: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Configure auto-instrumentations
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-ioredis': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-net': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-dns': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-fs': {
        enabled: true,
      },
    }),
  ],
});

// Gracefully shut down the SDK
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('OpenTelemetry SDK shut down successfully'))
    .catch((error) => console.error('Error shutting down OpenTelemetry SDK', error))
    .finally(() => process.exit(0));
});

export default sdk;