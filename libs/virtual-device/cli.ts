import { parseArgs } from 'node:util'
import { buildLogger } from '@home-on/logger/index'
import { createVirtualDevice, firmwareDiscovery } from './index.js'

// usage: pnpm virtual-device [--broker mqtt://localhost:1883] [--device-id virtual_sensors]
//        [--interval 1000] [--username test --password password]

const logger = buildLogger('[VIRTUAL DEVICE]')

const { values } = parseArgs({
  options: {
    broker: { type: 'string', default: 'mqtt://localhost:1883' },
    'device-id': { type: 'string', default: 'virtual_sensors' },
    interval: { type: 'string', default: '1000' },
    username: { type: 'string' },
    password: { type: 'string' },
  },
})

/** a random reading inside the metric's range */
const randomReading = (min = 0, max = 0) => {
  // fixme: firmware sends max_value 0 for metrics without a maximum (see cppHeaderBuilder.ts)
  const upper = max > min ? max : min + 200
  return Math.round(min + Math.random() * (upper - min))
}

const run = async () => {
  const device = await createVirtualDevice({
    brokerUrl: values.broker,
    username: values.username,
    password: values.password,
    discovery: firmwareDiscovery(values['device-id']),
  })
  logger.info(`Connected to ${values.broker} as ${device.deviceId}`)

  await device.announce()
  logger.info('Announced discovery event')

  for (const component of device.discovery.components) {
    for (const command of component.commands ?? []) {
      const commandName = command.command_topic.split('/').at(-1) ?? command.command_id
      await device.onCommand(component.id, commandName, (event) => {
        logger.info(`Command for ${component.id}: ${JSON.stringify(event)}`)
      })
    }
  }

  const timer = setInterval(async () => {
    for (const component of device.discovery.components) {
      for (const metric of component.metrics ?? []) {
        await device.sendTelemetry({
          timestamp: Math.floor(Date.now() / 1000),
          id: component.id,
          metric: metric.metric,
          value: randomReading(metric.min_value, metric.max_value),
          unit: metric.unit,
        })
      }
    }
  }, +values.interval)

  process.on('SIGINT', async () => {
    clearInterval(timer)
    await device.disconnect()
    logger.info('Disconnected')
    process.exit(0)
  })
}

run()
