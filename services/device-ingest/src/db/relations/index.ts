import { defineRelations } from '@home-on/drizzle'
import { devices } from '../schema/devices'
import { commandsMetadata } from '../schema/commandsMetadata'
import { metricsMetadata } from '../schema/metricsMetadata'
import { components } from '../schema/components'

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
        from: r.components.componentId,
        to: r.commandsMetadata.componentId,
      }),
      metricsMetadata: r.many.metricsMetadata({
        from: r.components.componentId,
        to: r.metricsMetadata.componentId,
      }),
    },

    commandsMetadata: {
      component: r.one.components({
        from: r.commandsMetadata.componentId,
        to: r.components.componentId,
      }),
    },

    metricsMetadata: {
      component: r.one.components({
        from: r.metricsMetadata.componentId,
        to: r.components.componentId,
      }),
    },
  }),
)
