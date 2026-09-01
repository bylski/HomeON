#include <Mqtt.h>
#include <PubSubClient.h>

namespace HomeOn {

MqttService::MqttService(Client& client, const MqttConfig& config)
    : _client(client), _config(config) {
    _config = config;
    if (_config.host != nullptr) {
        _client.setServer(_config.host, _config.port);
    }
    _client.setBufferSize(2048);
}

MqttService::~MqttService() {}

void MqttService::connect() {
    connectClient();

    Serial.print("\nTrying to connect to MQTT server...");
    while (!_client.connected()) {
        Serial.print("Connection failed, retrying in ");
        Serial.print(String(_config.connectRetryTimeMs / 1000));
        Serial.println(" seconds");

        delay(_config.connectRetryTimeMs);
        Serial.println("Retrying to establish MQTT connection...");
        connectClient();
    }
    Serial.println();
    Serial.println("Successfully connected to MQTT broker");
}

bool MqttService::publish(const char* topic, const char* data) {
    bool ok = _client.publish(topic, data);
    if (ok) {
        Serial.println("Publishing " + String(topic) + " event");
    } else {
        Serial.println("Error while publishing " + String(topic) + " event");
    }
    return ok;
}

PubSubClient& MqttService::client() { return _client; }

}  // namespace HomeOn