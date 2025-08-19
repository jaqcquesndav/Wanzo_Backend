import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';

// Configuration centralisée avec valeurs par défaut et options issues des variables d'environnement
const TRACING_CONFIG = {
  serviceName: process.env.OTEL_SERVICE_NAME || 'portfolio-institution-service',
  serviceVersion: process.env.OTEL_SERVICE_VERSION || '1.0.0',
  prometheusPort: parseInt(process.env.OTEL_EXPORTER_PROMETHEUS_PORT || '9464', 10),
  enabled: process.env.OTEL_SDK_DISABLED !== 'true',
};

console.log(`Initializing OpenTelemetry tracing for ${TRACING_CONFIG.serviceName}...`);
console.log(`Prometheus metrics exporter will use port: ${TRACING_CONFIG.prometheusPort}`);

try {
  // Création des exporters avec gestion d'erreurs
  const prometheusExporter = new PrometheusExporter({
    port: TRACING_CONFIG.prometheusPort,
  });

  // Configuration du SDK avec options avancées
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: TRACING_CONFIG.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: TRACING_CONFIG.serviceVersion,
    }),
    traceExporter: new ConsoleSpanExporter(),
    metricReader: prometheusExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Configuration fine des instrumentations automatiques
        '@opentelemetry/instrumentation-fs': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-http': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-express': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-nestjs-core': {
          enabled: true,
        },
      }),
    ],
  });

  // Démarrage conditionnel du SDK
  if (TRACING_CONFIG.enabled) {
    sdk.start();
    console.log('OpenTelemetry tracing initialized successfully.');
    
    // Arrêt propre lors de la fin du processus
    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => console.log('OpenTelemetry SDK shut down successfully'))
        .catch((error) => console.error('Error shutting down OpenTelemetry SDK', error))
        .finally(() => process.exit(0));
    });
  } else {
    console.log('OpenTelemetry tracing is disabled by configuration.');
  }
} catch (error) {
  console.error('Failed to initialize OpenTelemetry tracing:', error);
  console.log('The application will continue without tracing.');
}
