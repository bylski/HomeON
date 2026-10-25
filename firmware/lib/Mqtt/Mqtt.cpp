#include <Mqtt.h>
#include <PubSubClient.h>

namespace HomeOn {

MqttService::MqttService(Client& client, const MqttConfig& config)
    : client_(client), config_(config) {
    config_ = config;
    if (config_.host != nullptr) {
        client_.setServer(config_.host, config_.port);
    }
    client_.setBufferSize(2048);
}

MqttService::~MqttService() {}

void MqttService::Connect() {
    ConnectClient();

    Serial.print("\nTrying to connect to MQTT server...");
    while (!client_.connected()) {
        Serial.print("Connection failed, retrying in ");
        Serial.print(String(config_.connect_retry_time_ms / 1000));
        Serial.println(" seconds");

        delay(config_.connect_retry_time_ms);
        Serial.println("Retrying to establish MQTT connection...");
        ConnectClient();
    }
    Serial.println();
    Serial.println("Successfully connected to MQTT broker");
}

PubSubClient& MqttService::client() { return client_; }

}  // namespace HomeOn