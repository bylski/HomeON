#pragma once

#include <ArduinoJson.h>
#include <EventsJsonTransform.h>

#include <string>

namespace HomeOn {

/** Serializes an event to the JSON payload sent over MQTT. */
template <typename TPayload>
std::string ToJson(const TPayload& payload) {
    JsonDocument doc;
    doc.set(payload);
    std::string json;
    serializeJson(doc, json);
    return json;
}

}  // namespace HomeOn
