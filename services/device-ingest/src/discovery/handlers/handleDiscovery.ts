import type { DeviceDiscoveryEvent } from '@home-on/generated/events'
import { saveDiscoveredDevice } from '../services/devices.js'

const handleDiscovery = async (_topic: string, payload: DeviceDiscoveryEvent) => {
  await saveDiscoveredDevice(payload)
}

export default handleDiscovery
