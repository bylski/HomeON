import {
  CommandMetadata,
  ComponentConfig,
  DeviceDiscoveryEvent,
  MetricMetadata,
} from '@home-on/generated'
import { z } from 'zod'

const MetricSchema: z.ZodType<MetricMetadata> = z.object({
  metric_id: z.string(),
  unit: z.string(),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
})

const CommandSchema: z.ZodType<CommandMetadata> = z.object({
  command: z.string(),
  command_topic: z.string(),
  allowed_values: z.array(z.string()).optional(),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  description: z.string().optional(),
})

const ComponentConfigSchema: z.ZodType<ComponentConfig> = z.object({
  id: z.string(),
  type: z.enum(['SENSOR', 'SWITCH', 'DISPLAY', 'MOTOR', 'SERVO', 'LIGHT']),
  metrics: z.array(MetricSchema).optional(),
  commands: z.array(CommandSchema).optional(),
})

export const discoveryEventSchema: z.ZodType<DeviceDiscoveryEvent> = z.object({
  device_id: z.string(),
  ip_address: z.string().optional(),
  components: z.array(ComponentConfigSchema),
})
