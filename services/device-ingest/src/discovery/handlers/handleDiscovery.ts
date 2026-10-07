// import type { DeviceDiscoveryEvent } from '@home-on/generated/events'
// import { devices, type NewDevice } from '../../db/schema/devices'
// import { components, type NewComponent } from '../../db/schema/components'
// import { metricsMetadata, type NewMetricMetadata } from '../../db/schema/metricsMetadata'
// import { commandsMetadata, type NewCommandMetadata } from '../../db/schema/commandsMetadata'
// import db from '../../db/index'
// import { prepareUpdateOnConflictSet } from '@home-on/drizzle'

// type DiscoveryDataToSave = {
//   device: NewDevice
//   components: NewComponent[]
//   metricsMetadata: NewMetricMetadata[]
//   commandsMetadata: NewCommandMetadata[]
// }

// const handleDiscovery = async (_topic: string, payload: DeviceDiscoveryEvent) => {
//   const toSave = extractDiscoveryDataToSave(payload)

//   db.insert(devices)

//   db.transaction(async (tx) => {
//     await tx
//       .insert(devices)
//       .values(toSave.device)
//       .onConflictDoUpdate({
//         set: prepareUpdateOnConflictSet(devices, { id: false, name: true }),
//         target: devices.id,
//       })

//     await tx
//       .insert(components)
//       .values(toSave.components)
//       .onConflictDoUpdate({
//         set: prepareUpdateOnConflictSet(components, {
//           id: false,
//           deviceId: false,
//           componentId: false,
//           name: true,
//           type: true,
//         }),
//         target: [components.deviceId, components.componentId],
//       })

//     await tx
//       .insert(metricsMetadata)
//       .values(toSave.metricsMetadata)
//       .onConflictDoUpdate({
//         set: prepareUpdateOnConflictSet(metricsMetadata, {
//           id: false,
//           deviceId: false,
//           componentId: false,
//           metricId: false,
//           metric: true,
//           name: true,
//           maxValue: true,
//           minValue: true,
//           unit: true,
//         }),
//         target: [metricsMetadata.deviceId, metricsMetadata.componentId, metricsMetadata.metricId],
//       })

//     await tx
//       .insert(commandsMetadata)
//       .values(toSave.commandsMetadata)
//       .onConflictDoUpdate({
//         set: prepareUpdateOnConflictSet(commandsMetadata, {
//           id: false,
//           deviceId: false,
//           componentId: false,
//           commandId: false,
//           command: true,
//           commandTopic: true,
//           name: true,
//           maxValue: true,
//           minValue: true,
//           allowedValues: true,
//           description: true,
//         }),
//         target: [
//           commandsMetadata.deviceId,
//           commandsMetadata.componentId,
//           commandsMetadata.commandId,
//         ],
//       })
//   })
// }

// export default handleDiscovery

// const extractDiscoveryDataToSave = (event: DeviceDiscoveryEvent): DiscoveryDataToSave => {
//   const newDevice: NewDevice = { id: event.device_id, name: event.name }
//   const newComponents: NewComponent[] = []
//   const newMetricsMetadata: NewMetricMetadata[] = []
//   const newCommandsMetadata: NewCommandMetadata[] = []

//   for (const component of event.components) {
//     newComponents.push({
//       deviceId: event.device_id,
//       name: component.name,
//       componentId: component.id,
//       type: component.type,
//     })

//     for (const metric of component.metrics ?? []) {
//       newMetricsMetadata.push({
//         deviceId: event.device_id,
//         componentId: component.id,
//         metricId: metric.metric_id,
//         name: metric.name,
//         metric: metric.metric_id,
//         unit: metric.unit,
//         minValue: metric.min_value?.toString(),
//         maxValue: metric.max_value?.toString(),
//       })
//     }

//     for (const command of component.commands ?? []) {
//       newCommandsMetadata.push({
//         deviceId: event.device_id,
//         componentId: component.id,
//         commandId: command.command_id,
//         name: command.name,
//         command: command.command,
//         commandTopic: command.command_topic,
//         allowedValues: command.allowed_values,
//         description: command.description,
//         minValue: command.min_value?.toString(),
//         maxValue: command.max_value?.toString(),
//       })
//     }
//   }

//   return {
//     device: newDevice,
//     components: newComponents,
//     metricsMetadata: newMetricsMetadata,
//     commandsMetadata: newCommandsMetadata,
//   }
// }
