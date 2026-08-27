#include "Arduino.h"
#include "Mqtt.h"
#include "MqttEvents.h"
#include "WifiService.h"
#include "config.h"

HomeOn::WifiService wifi_service;
HomeOn::MqttService mqtt_client(wifi_service.getClient(),
                                {
                                    .host = Config::MQTT_HOST,
                                    .client_id = "test_sensors",
                                    .username = Config::MQTT_USERNAME,
                                    .password = Config::MQTT_PASSWORD,
                                    .port = Config::MQTT_PORT,
                                });

const uint8_t TRIG_PIN = D1;
const uint8_t ECHO_PIN = D2;
const uint8_t LED_PIN = D3;

void setup() {
    Serial.begin(115200);
    pinMode(ECHO_PIN, INPUT);
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);

    wifi_service.begin(Config::WIFI_SSID, Config::WIFI_PASSWORD);
    mqtt_client.connect();

    MetricMetadata metric_metadata;
    metric_metadata.max_value = 255;
    metric_metadata.min_value = 0;
    metric_metadata.metric_id = "test";

    JsonDocument json_res;
    String res;
    json_res.set(metric_metadata);
    serializeJson(json_res, res);

    Serial.println(res);

    mqtt_client.client().publish("home/sensor/pin_state", "HELLO WORLD");
}

void loop() {
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);

    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    long duration = pulseIn(ECHO_PIN, HIGH, 30000);

    int distance = duration / 58;
    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.println(" cm");

    if (distance > 100) {
        digitalWrite(LED_PIN, HIGH);
    } else {
        digitalWrite(LED_PIN, LOW);
    }

    delay(200);
}