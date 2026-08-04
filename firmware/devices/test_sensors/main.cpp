#include <ESP8266WiFi.h>
#include <PubSubClient.h>

#include "Arduino.h"
#include "config.h"

WiFiClient wifi_client;
PubSubClient mqtt_client(wifi_client);
char* MQTT_ID = "test_sensors";
const uint16_t MQTT_RETRY_INTERVAL_SECONDS = 5;

void setup_wifi() {
    WiFi.begin(Config::WIFI_SSID, Config::WIFI_PASSWORD);
    Serial.print("\nTrying to connect to WiFi...");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print('.');
    }
    Serial.println();
    Serial.print("Successfully connected to: ");
    Serial.println(Config::WIFI_SSID);
}

void setup_mqtt() {
    mqtt_client.setServer(Config::MQTT_HOST, Config::MQTT_PORT);
    mqtt_client.connect(MQTT_ID, Config::MQTT_USERNAME, Config::MQTT_PASSWORD);

    Serial.print("\nTrying to connect to MQTT server...");
    while (!mqtt_client.connected()) {
        Serial.print("Connection failed, retrying in ");
        Serial.print(MQTT_RETRY_INTERVAL_SECONDS);
        Serial.println(" seconds");

        delay(5000);
        Serial.println("Retrying to establish MQTT connection...");
        mqtt_client.connect(MQTT_ID);
    }
    Serial.println();
    Serial.print("Successfully connected to MQTT broker");
}

void setup() {
    Serial.begin(115200);
    setup_wifi();
    setup_mqtt();

    mqtt_client.publish("home/sensor/pin_state", "HELLO WORLD");
}

void loop() {}