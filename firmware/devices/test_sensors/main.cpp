#include "Arduino.h"
#include "Mqtt.h"
#include "MqttEvents.h"
#include "WifiService.h"
#include "config.h"
#include "discovery.h"

HomeOn::WifiService wifi_service;

HomeOn::MqttService mqtt_client(wifi_service.getClient(),
                                {
                                    .host = Config::MQTT_HOST,
                                    .client_id = Config::DEVICE_ID,
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

    mqtt_client.publish(DISCOVERY_EVENT, Config::DEVICE_ID, {.retain = true});

    // mqtt_client.client().subscribe(command_topic.c_str());
    // mqtt_client.client().setCallback(mqtt_callback);
}

void loop() {
    // mqtt_client.client().loop();

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