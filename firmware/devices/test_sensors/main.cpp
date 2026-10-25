#include "Arduino.h"
#include "Mqtt.h"
#include "MqttEvents.h"
#include "WifiService.h"
#include "config.h"
#include "discovery.h"

HomeOn::WifiService wifi_service;

HomeOn::MqttService mqtt_client(wifi_service.GetClient(),
                                {
                                    .host = Config::kMqttHost,
                                    .client_id = Config::kDeviceId,
                                    .username = Config::kMqttUsername,
                                    .password = Config::kMqttPassword,
                                    .port = Config::kMqttPort,
                                });

const uint8_t kTrigPin = D1;
const uint8_t kEchoPin = D2;
const uint8_t kLedPin = D3;

void MqttCallback(char* topic, byte* payload, unsigned int length) {
    char msg[length + 1];

    for (unsigned int i = 0; i < length; i++) {
        msg[i] = (char)payload[i];
    }
    msg[length] = '\0';

    Serial.println(msg);

    if (strcmp(msg, "ON") == 0) {
        digitalWrite(kLedPin, HIGH);
    } else if (strcmp(msg, "OFF") == 0) {
        digitalWrite(kLedPin, LOW);
    }
};

void setup() {
    Serial.begin(115200);
    pinMode(kEchoPin, INPUT);
    pinMode(kTrigPin, OUTPUT);
    pinMode(kLedPin, OUTPUT);
    digitalWrite(kLedPin, LOW);

    wifi_service.Begin(Config::kWifiSsid, Config::kWifiPassword);
    mqtt_client.Connect();

    mqtt_client.Publish(kDiscoveryEvent, Config::kDeviceId, {.retain = true});

    // mqtt_client.client().subscribe(command_topic.c_str(), 1);
    // mqtt_client.client().setCallback(MqttCallback);
}

void loop() {
    digitalWrite(kTrigPin, LOW);
    delayMicroseconds(2);

    digitalWrite(kTrigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(kTrigPin, LOW);

    long duration = pulseIn(kEchoPin, HIGH, 30000);

    int distance = duration / 58;
    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.println(" cm");

    if (distance > 100) {
        digitalWrite(kLedPin, HIGH);
    } else {
        digitalWrite(kLedPin, LOW);
    }

    ComponentTelemetryEvent ultrasonic_telemetry = {.id = kUltrasonicSensor.id,
                                                    .metric = "distance",
                                                    .value = distance,
                                                    .unit = "cm",
                                                    .state = "MEASURING"};

    mqtt_client.Publish(ultrasonic_telemetry, Config::kDeviceId,
                        ("/" + kUltrasonicSensor.id).c_str());

    delay(200);
}