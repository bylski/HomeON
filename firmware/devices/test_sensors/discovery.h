#include "MqttEvents.h"
#include "config.h"

constexpr const char* RED_LED_ID = "red_led_diode";

const MetricMetadata ULTRASONIC_SENSOR_METRIC = {
    .metric_id = "ultrasonic_distance",
    .name = "Ultrasonic sensor distance",
    .metric = "distance",
    .unit = "cm",
    .min_value = 0,
};

const MetricMetadata BUTTON_METRIC = {
    .metric_id = "button_is_pressed",
    .name = "State of button (pressed / not pressed)",
    .metric = "input_state",
    .min_value = 0,
    .max_value = 1,
};

const MetricMetadata LED_METRIC = {
    .metric_id = "led_state",
    .name = "LED on/off status",
    .metric = "output_state",
    .min_value = 0,
    .max_value = 1,
};

const CommandMetadata LED_COMMAND = {
    .command_id = "switch_led",
    .name = "Switch LED on/off",
    .command = "SWITCH_LED",
    .command_topic = String("/") + RED_LED_ID + "red_led/switch",
    .allowed_values = {"ON", "OFF"},
    .description = "Switches LED ON or OFF",
};

const ComponentConfig ULTRASONIC_SENSOR = {
    .id = "ultrasonic_sensor",
    .name = "Distance sensor",
    .type = "SENSOR",
    .metrics = {ULTRASONIC_SENSOR_METRIC},
};

const ComponentConfig MONOSTABLE_SWITCH = {
    .id = "monostable_switch",
    .name = "Button",
    .type = "SWITCH",
    .metrics = {BUTTON_METRIC},
};

const ComponentConfig LED_DIODE = {
    .id = RED_LED_ID,
    .name = "Red led diode",
    .type = "LIGHT",
    .metrics = {LED_METRIC},
    .commands = {LED_COMMAND},
};

const DeviceDiscoveryEvent DISCOVERY_EVENT = {
    .device_id = Config::DEVICE_ID,
    .name = "Test device",
    .components = {ULTRASONIC_SENSOR, MONOSTABLE_SWITCH, LED_DIODE},
};
