#include "Arduino.h"
#include "Mqtt.h"
#include "MqttEvents.h"
#include "WifiService.h"
#include "config.h"

const char* BOARD_ID = "test_sensors";

HomeOn::WifiService wifi_service;

HomeOn::MqttService mqtt_client(wifi_service.getClient(),
                                {
                                    .host = Config::MQTT_HOST,
                                    .client_id = BOARD_ID,
                                    .username = Config::MQTT_USERNAME,
                                    .password = Config::MQTT_PASSWORD,
                                    .port = Config::MQTT_PORT,
                                });

const uint8_t TRIG_PIN = D1;
const uint8_t ECHO_PIN = D2;
const uint8_t LED_PIN = D3;

void mqtt_callback(char* topic, byte* payload, unsigned int length) {
    char msg[length + 1];

    for (unsigned int i = 0; i < length; i++) {
        msg[i] = (char)payload[i];
    }
    msg[length] = '\0';

    Serial.println(msg);

    if (strcmp(msg, "ON")) {
        digitalWrite(LED_PIN, HIGH);
    } else if (strcmp(msg, "OFF")) {
        digitalWrite(LED_PIN, LOW);
    }
};

void setup() {
    Serial.begin(115200);
    pinMode(ECHO_PIN, INPUT);
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);

    wifi_service.begin(Config::WIFI_SSID, Config::WIFI_PASSWORD);
    mqtt_client.connect();

    MetricMetadata ultrasonic_sensor_metric = {
        .metric_id = "ultrasonic_distance",
        .unit = "cm",
        .min_value = 0,
    };

    MetricMetadata button_metric = {
        .metric_id = "button_is_pressed",
        .min_value = 0,
        .max_value = 1,
    };

    MetricMetadata led_metric = {
        .metric_id = "led_state",
        .min_value = 0,
        .max_value = 1,
    };

    CommandMetadata led_command = {
        .command = "switch_led",
        .command_topic = "/red_led/switch",
        .allowed_values = {"ON", "OFF"},
        .description = "Switches LED ON or OFF",
    };

    ComponentConfig ultrasonic_sensor = {
        .id = "ultrasonic_sensor",
        .type = "SENSOR",
        .metrics = {ultrasonic_sensor_metric},
    };

    ComponentConfig monostable_switch = {
        .id = "monostable_switch",
        .type = "SWITCH",
        .metrics = {button_metric},
    };

    ComponentConfig led_diode = {
        .id = "red_led_diode",
        .type = "LIGHT",
        .metrics = {led_metric},
        .commands = {led_command},
    };

    DeviceDiscoveryEvent discovery_event = {
        .board_id = BOARD_ID,
        .ip_address = wifi_service.getLocalIp().toString(),
        .components = {ultrasonic_sensor, monostable_switch, led_diode},
    };

    JsonDocument json_res;
    String res;
    json_res.set(discovery_event);
    serializeJson(json_res, res);

    String discovery_topic = (String("home_on/discovery/") + BOARD_ID);
    mqtt_client.publish(discovery_topic.c_str(), res.c_str());

    String command_topic =
        (String("home_on/commands/") + BOARD_ID + led_command.command_topic);
    mqtt_client.client().subscribe(command_topic.c_str());
    mqtt_client.client().setCallback(mqtt_callback);
}

void loop() {
    mqtt_client.client().loop();
    // digitalWrite(TRIG_PIN, LOW);
    // delayMicroseconds(2);

    // digitalWrite(TRIG_PIN, HIGH);
    // delayMicroseconds(10);
    // digitalWrite(TRIG_PIN, LOW);

    // long duration = pulseIn(ECHO_PIN, HIGH, 30000);

    // int distance = duration / 58;
    // Serial.print("Distance: ");
    // Serial.print(distance);
    // Serial.println(" cm");

    // if (distance > 100) {
    //     digitalWrite(LED_PIN, HIGH);
    // } else {
    //     digitalWrite(LED_PIN, LOW);
    // }

    // delay(200);
}