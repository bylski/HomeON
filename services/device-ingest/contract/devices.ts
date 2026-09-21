export interface CommandMetadataDTO {
  id: number
  commandId: string
  componentId: string
  deviceId: string
  name: string
  command: string
  commandTopic: string
  allowedValues?: string[]
  minValue?: string
  maxValue?: string
  description?: string
}

export interface MetricMetadataDTO {
  id: number
  metricId: string
  componentId: string
  deviceId: string
  name: string
  metric: string
  unit: string
  minValue?: string
  maxValue?: string
}

export interface FullComponentDTO {
  id: number
  componentId: string
  deviceId: string
  name: string
  type: string
  metricsMetadata: MetricMetadataDTO[]
  commandsMetadata: CommandMetadataDTO[]
}

export interface FullDeviceDTO {
  id: string
  name: string
  components: FullComponentDTO[]
}
