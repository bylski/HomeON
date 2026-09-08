#pragma once

#include <Events.h>

/*
 Arduino Json library automatically uses converters when
 serializing/deserializing source type.
 By defining convertes for all of MQTT events we can easily serialize them to
 JSON without thinking about it - Arduino Json does that for us.
 https://arduinojson.org/news/2021/05/04/version-6-18-0/
*/
namespace ArduinoJson {

// generic converter for std::vector<T>
template <typename T>
struct Converter<std::vector<T>> {
    static bool toJson(const std::vector<T>& src, JsonVariant dst) {
        JsonArray array = dst.to<JsonArray>();
        for (const auto& item : src) {
            array.add(item);
        }
        return true;
    }
};

template <>
struct Converter<MetricMetadata> {
    static bool toJson(const MetricMetadata& src, JsonVariant dst) {
        dst["metric_id"] = src.metric_id;
        dst["unit"] = src.unit;
        dst["min_value"] = src.min_value;
        dst["max_value"] = src.max_value;
        return true;
    }
};

template <>
struct Converter<CommandMetadata> {
    static bool toJson(const CommandMetadata& src, JsonVariant dst) {
        dst["command"] = src.command;
        dst["command_topic"] = src.command_topic;
        dst["allowed_values"] = src.allowed_values;
        dst["min_value"] = src.min_value;
        dst["max_value"] = src.max_value;
        dst["description"] = src.description;
        return true;
    }
};

template <>
struct Converter<ComponentConfig> {
    static bool toJson(const ComponentConfig& src, JsonVariant dst) {
        dst["id"] = src.id;
        dst["type"] = src.type;
        dst["metrics"] = src.metrics;
        dst["commands"] = src.commands;
        return true;
    }
};

template <>
struct Converter<ComponentCommandEvent> {
    static bool toJson(const ComponentCommandEvent& src, JsonVariant dst) {
        dst["timestamp"] = src.timestamp;
        dst["command"] = src.command;
        dst["value"] = src.value;
        return true;
    }
};

template <>
struct Converter<ComponentTelemetryEvent> {
    static bool toJson(const ComponentTelemetryEvent& src, JsonVariant dst) {
        dst["timestamp"] = src.timestamp;
        dst["id"] = src.id;
        dst["metric"] = src.metric;
        dst["value"] = src.value;
        dst["unit"] = src.unit;
        dst["state"] = src.state;
        return true;
    }
};

template <>
struct Converter<DeviceDiscoveryEvent> {
    static bool toJson(const DeviceDiscoveryEvent& src, JsonVariant dst) {
        dst["device_id"] = src.device_id;
        dst["ip_address"] = src.ip_address;
        dst["components"] = src.components;
        return true;
    }
};
}  // namespace ArduinoJson