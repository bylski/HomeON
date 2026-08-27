#pragma once

#include <Client.h>
#include <PubSubClient.h>

class PubSubClient;

namespace HomeOn {

struct MqttConfig {
    const char* host = nullptr;
    const char* client_id = "ESP_Client";
    const char* username = nullptr;
    const char* password = nullptr;
    uint16_t port = 1883;
    uint16_t connectRetryTimeMs = 5000;
};

class MqttService {
   public:
    MqttService(Client& client, const MqttConfig& config);
    ~MqttService();

    void connect();

    PubSubClient& client();

   private:
    PubSubClient _client;
    MqttConfig _config;

    void connectClient() {
        _client.connect(_config.client_id, _config.username, _config.password);
    }
};

}  // namespace HomeOn