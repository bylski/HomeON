import {
  CommandMetadata,
  ComponentConfig,
  DeviceDiscoveryEvent,
  MetricMetadata,
  type ComponentTelemetryEvent,
} from '@home-on/generated'
import { z } from 'zod'
import { COMPONENT_TYPES } from '../../contract/events'

const MetricSchema: z.ZodType<MetricMetadata> = z.object({
  metric_id: z.string(),
  name: z.string(),
  metric: z.string(),
  unit: z.string(),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
})

const CommandSchema: z.ZodType<CommandMetadata> = z.object({
  command: z.string(),
  command_id: z.string(),
  name: z.string(),
  command_topic: z.string(),
  allowed_values: z.array(z.string()).optional(),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  description: z.string().optional(),
})

const ComponentConfigSchema: z.ZodType<ComponentConfig> = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(COMPONENT_TYPES),
  metrics: z.array(MetricSchema).optional(),
  commands: z.array(CommandSchema).optional(),
})

export const discoveryEventSchema: z.ZodType<DeviceDiscoveryEvent> = z
  .object({
    device_id: z.string(),
    name: z.string(),
    ip_address: z.string().optional(),
    components: z.array(ComponentConfigSchema),
  })
  .strict()

export const telemetryEventSchema: z.ZodType<ComponentTelemetryEvent> = z
  .object({
    timestamp: z.number().optional(),
    id: z.string(),
    metric: z.string(),
    value: z.any(),
    unit: z.string().optional(),
    state: z.string().optional(),
  })
  .strict()
