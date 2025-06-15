import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';
import { ConfigService } from '@nestjs/config'; // Import ConfigService

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

// Initialize ConfigService to read .env variables
const configService = new ConfigService();
const prometheusPort = parseInt(configService.get('PROMETHEUS_PORT') || '9469', 10);

const prometheusExporter = new PrometheusExporter(
  {
    port: prometheusPort,
    // endpoint: '/metrics', // Default endpoint
  },
  () => {
    console.log(`Prometheus exporter server started on port ${prometheusPort}`);
    console.log(`Metrics available at http://localhost:${prometheusPort}/metrics`);
  },
);

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'portfolio-sme-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter: new ConsoleSpanExporter(), // Use ConsoleSpanExporter instead of PrometheusExporter
  metricReader: prometheusExporter,
  // instrumentations: [getNodeAutoInstrumentations()], // Auto-instrumentation can be added here
});

sdk.start();

console.log('Tracing initialized with Prometheus exporter');

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

export { prometheusExporter };