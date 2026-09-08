#pragma once

#include <Client.h>
#include <Events.h>
#include <PubSubClient.h>

#include <string_view>

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

struct PublishOptions {
    bool retain = false;
};

class MqttService {
   public:
    MqttService(Client& client, const MqttConfig& config);
    ~MqttService();

    void connect();

    /** Publishes event under a correct topic based on its payload type. */
    template <typename TPayload>
    bool publish(const TPayload& payload, const char* board_id,
                 PublishOptions options) {
        return publish(payload, board_id, "", options);
    }

    /** Publishes event under a correct topic based on its payload type. */
    template <typename TPayload>
    bool publish(const TPayload& payload, const char* board_id,
                 const char* topic_suffix = "",
                 PublishOptions options = {.retain = false}) {
        constexpr std::string_view topic_prefix = TopicTraits<TPayload>::prefix;

        // results in something like:
        // "home_on/commands/test_board/red_led/switch"
        // topic_suffix can be empty e.g. in discovery event
        String full_topic =
            String(topic_prefix.data()) + board_id + topic_suffix;

        JsonDocument doc;
        String json_payload;
        doc.set(payload);
        serializeJson(doc, json_payload);

        bool ok = _client.publish(full_topic.c_str(), json_payload.c_str(),
                                  options.retain);
        if (ok) {
            Serial.println("Publishing " + full_topic + " event");
        } else {
            Serial.println("Error while publishing " + full_topic + " event");
        }
        return ok;
    }

    PubSubClient& client();

   private:
    PubSubClient _client;
    MqttConfig _config;

    void connectClient() {
        _client.connect(_config.client_id, _config.username, _config.password);
    }
};

}  // namespace HomeOn