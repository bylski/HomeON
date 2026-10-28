#include "MqttEvents.h"
#include "config.h"

constexpr const char* kRedLedId = "red_led_diode";

const MetricMetadata kUltrasonicSensorMetric = {
    .metric_id = "ultrasonic_distance",
    .name = "Ultrasonic sensor distance",
    .metric = "distance",
    .unit = "cm",
    .min_value = 0,
};

const MetricMetadata kButtonMetric = {
    .metric_id = "button_is_pressed",
    .name = "State of button (pressed / not pressed)",
    .metric = "input_state",
    .min_value = 0,
    .max_value = 1,
};

const MetricMetadata kLedMetric = {
    .metric_id = "led_state",
    .name = "LED on/off status",
    .metric = "output_state",
    .min_value = 0,
    .max_value = 1,
};

const CommandMetadata kLedCommand = {
    .command_id = "switch_led",
    .name = "Switch LED on/off",
    .command = "SWITCH_LED",
    .command_topic = std::string("/") + kRedLedId + "/switch",
    .allowed_values = {"ON", "OFF"},
    .description = "Switches LED ON or OFF",
};

const ComponentConfig kUltrasonicSensor = {
    .id = "ultrasonic_sensor",
    .name = "Distance sensor",
    .type = "SENSOR",
    .metrics = {kUltrasonicSensorMetric},
};

const ComponentConfig kMonostableSwitch = {
    .id = "monostable_switch",
    .name = "Button",
    .type = "SWITCH",
    .metrics = {kButtonMetric},
};

const ComponentConfig kLedDiode = {
    .id = kRedLedId,
    .name = "Red led diode",
    .type = "LIGHT",
    .metrics = {kLedMetric},
    .commands = {kLedCommand},
};

const DeviceDiscoveryEvent kDiscoveryEvent = {
    .device_id = Config::kDeviceId,
    .name = "Test device",
    .components = {kUltrasonicSensor, kMonostableSwitch, kLedDiode},
};
