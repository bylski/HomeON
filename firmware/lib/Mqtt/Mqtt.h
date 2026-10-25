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
    uint16_t connect_retry_time_ms = 5000;
};

struct PublishOptions {
    bool retain = false;
};

class MqttService {
   public:
    MqttService(Client& client, const MqttConfig& config);
    ~MqttService();

    void Connect();

    /** Publishes event under a correct topic based on its payload type. */
    template <typename TPayload>
    bool Publish(const TPayload& payload, const char* board_id,
                 PublishOptions options) {
        return Publish(payload, board_id, "", options);
    }

    /** Publishes event under a correct topic based on its payload type.
     *
     * PubSubClient always publishes with QoS 0. */
    template <typename TPayload>
    bool Publish(const TPayload& payload, const char* board_id,
                 const char* topic_suffix = "",
                 PublishOptions options = {.retain = false}) {
        constexpr std::string_view topic_prefix =
            TopicTraits<TPayload>::kPrefix;

        // results in something like:
        // "home-on/v1/commands/test_board/red_led/switch"
        // topic_suffix can be empty e.g. in discovery event
        String full_topic =
            String(topic_prefix.data()) + board_id + topic_suffix;

        JsonDocument doc;
        String json_payload;
        doc.set(payload);
        serializeJson(doc, json_payload);

        bool ok = client_.publish(full_topic.c_str(), json_payload.c_str(),
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
    PubSubClient client_;
    MqttConfig config_;

    void ConnectClient() {
        client_.connect(config_.client_id, config_.username, config_.password);
    }
};

}  // namespace HomeOn