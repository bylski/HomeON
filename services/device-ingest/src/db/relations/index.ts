import { defineRelations } from '@home-on/drizzle'
import { devices } from '../schema/devices.js'
import { commandsMetadata } from '../schema/commandsMetadata.js'
import { metricsMetadata } from '../schema/metricsMetadata.js'
import { components } from '../schema/components.js'

export const relations = defineRelations(
  { devices, components, commandsMetadata, metricsMetadata },
  (r) => ({
    devices: {
      components: r.many.components({
        from: r.devices.id,
        to: r.components.deviceId,
      }),
    },

    components: {
      device: r.one.devices({
        from: r.components.deviceId,
        to: r.devices.id,
      }),
      commandsMetadata: r.many.commandsMetadata({
        from: [r.components.deviceId, r.components.componentId],
        to: [r.commandsMetadata.deviceId, r.commandsMetadata.componentId],
      }),
      metricsMetadata: r.many.metricsMetadata({
        from: [r.components.deviceId, r.components.componentId],
        to: [r.metricsMetadata.deviceId, r.metricsMetadata.componentId],
      }),
    },

    commandsMetadata: {
      component: r.one.components({
        from: [r.commandsMetadata.deviceId, r.commandsMetadata.componentId],
        to: [r.components.deviceId, r.components.componentId],
      }),
    },

    metricsMetadata: {
      component: r.one.components({
        from: [r.metricsMetadata.deviceId, r.metricsMetadata.componentId],
        to: [r.components.deviceId, r.components.componentId],
      }),
    },
  }),
)
