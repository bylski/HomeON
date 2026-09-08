#include "MqttEvents.h"
#include "config.h"

constexpr const char* RED_LED_ID = "red_led_diode";

const MetricMetadata ULTRASONIC_SENSOR_METRIC = {
    .metric_id = "ultrasonic_distance",
    .unit = "cm",
    .min_value = 0,
};

const MetricMetadata BUTTON_METRIC = {
    .metric_id = "button_is_pressed",
    .min_value = 0,
    .max_value = 1,
};

const MetricMetadata LED_METRIC = {
    .metric_id = "led_state",
    .min_value = 0,
    .max_value = 1,
};

const CommandMetadata LED_COMMAND = {
    .command = "switch_led",
    .command_topic = String("/") + RED_LED_ID + "red_led/switch",
    .allowed_values = {"ON", "OFF"},
    .description = "Switches LED ON or OFF",
};

const ComponentConfig ULTRASONIC_SENSOR = {
    .id = "ultrasonic_sensor",
    .type = "SENSOR",
    .metrics = {ULTRASONIC_SENSOR_METRIC},
};

const ComponentConfig MONOSTABLE_SWITCH = {
    .id = "monostable_switch",
    .type = "SWITCH",
    .metrics = {BUTTON_METRIC},
};

const ComponentConfig LED_DIODE = {
    .id = RED_LED_ID,
    .type = "LIGHT",
    .metrics = {LED_METRIC},
    .commands = {LED_COMMAND},
};

const DeviceDiscoveryEvent DISCOVERY_EVENT = {
    .device_id = Config::DEVICE_ID,
    .components = {ULTRASONIC_SENSOR, MONOSTABLE_SWITCH, LED_DIODE},
};
