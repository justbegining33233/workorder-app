declare module '@opentelemetry/sdk-node' {
  export class NodeSDK {
    constructor(config?: Record<string, any>);
    start(): void;
    shutdown(): Promise<void>;
  }
}

declare module '@opentelemetry/auto-instrumentations-node' {
  export function getNodeAutoInstrumentations(config?: Record<string, any>): any[];
}

declare module '@opentelemetry/exporter-jaeger' {
  export class JaegerExporter {
    constructor(config?: { endpoint?: string });
  }
}

declare module '@opentelemetry/exporter-prometheus' {
  export class PrometheusExporter {
    constructor(config?: { port?: number });
  }
}

declare module '@opentelemetry/resources' {
  export class Resource {
    constructor(attributes?: Record<string, any>);
  }
}

declare module '@opentelemetry/semantic-conventions' {
  export const SemanticResourceAttributes: {
    SERVICE_NAME: string;
    SERVICE_VERSION: string;
    SERVICE_NAMESPACE: string;
    [key: string]: string;
  };
}
