export interface ComponentCommandEvent {
  /**
   * Timestamp when the command was issued
   */
  timestamp: number
  /**
   * High-level abstract intent (e.g., 'SET_TEMP', 'TURN_ON')
   */
  command: string
  /**
   * Optional target payload or setpoint for the command
   */
  value?: number | string | boolean | null
}

/**
 * Payload sent by a device at boot to announce its components and capabilities.
 */
export interface DeviceDiscoveryEvent {
  /**
   * Unique board identifier (e.g., 'living_room_esp32')
   */
  board_id: string
  ip_address?: string
  components: ComponentConfig[]
}
/**
 * Configuration and metadata for an attached component.
 */
export interface ComponentConfig {
  /**
   * Matches 'id' in ComponentTelemetryEvent (e.g., 'climate_sensor')
   */
  id: string
  /**
   * UI widget hint for web dashboard
   */
  type: 'SENSOR' | 'SWITCH' | 'DISPLAY' | 'MOTOR' | 'SERVO' | 'LIGHT'
  /**
   * List of telemetry measurements this component can emit
   */
  metrics?: MetricMetadata[]
  /**
   * List of abstract commands this component accepts
   */
  commands?: CommandMetadata[]
}
/**
 * Metadata definition for a component telemetry metric.
 */
export interface MetricMetadata {
  /**
   * Specific metric key (e.g., 'temperature', 'humidity')
   */
  metric_id: string
  /**
   * Unit of measurement required for automation logic (e.g., '°C', '%', 'RPM')
   */
  unit: string
  min_value?: number
  max_value?: number
}
/**
 * Metadata definition for abstract actions accepted by a component.
 */
export interface CommandMetadata {
  /**
   * Abstract high-level action (e.g., 'SET_TEMP', 'TURN_ON', 'MOVE_LEFT')
   */
  command: string
  /**
   * MQTT topic to publish this specific command payload to
   */
  command_topic: string
  /**
   * Optional discrete options (e.g., ['ON', 'OFF', 'AUTO'])
   */
  allowed_values?: string[]
  min_value?: number
  max_value?: number
  description?: string
}

export interface ComponentTelemetryEvent {
  /**
   * Timestamp of metric event
   */
  timestamp: number
  /**
   * Serves as component's identifier (e.g., 'climate_sensor')
   */
  id: string
  /**
   * Specific metric key (e.g., 'temperature')
   */
  metric: string
  /**
   * Pure unformatted value used directly in automation conditions (e.g., 23.5, true)
   */
  value: number | boolean | string | null
  /**
   * Optional standard unit symbol for backend logic (e.g., 'C', '%', 'RPM')
   */
  unit?: string
  /**
   * Human-readable label strictly for UI display (e.g., '23.5 °C', 'HEATING')
   */
  state?: string
}

export type TopicPrefixesWithTypes = {
  'home-on/commands/': ComponentCommandEvent
  'home-on/discovery/': DeviceDiscoveryEvent
  'home-on/telemetry/': ComponentTelemetryEvent
}
