import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';

try {
  const prometheusExporter = new PrometheusExporter({
    port: 9464,
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'accounting-service',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    }),
    traceExporter: new ConsoleSpanExporter(),
    metricReader: prometheusExporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  console.log('🚀 [Tracing] OpenTelemetry SDK started successfully');
} catch (error) {
  console.error('❌ [Tracing] Failed to start OpenTelemetry SDK:', error);
  console.log('🔄 [Tracing] Continuing without tracing...');
}
