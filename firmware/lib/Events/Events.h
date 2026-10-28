#pragma once

#include <cstdint>
#include <string>
#include <string_view>
#include <variant>
#include <vector>

struct ComponentCommandEvent {
    int64_t timestamp;
    std::string command;
    std::variant<int, double, bool, std::string> value;
};

struct MetricMetadata {
    std::string metric_id;
    std::string name;
    std::string metric;
    std::string unit;
    double min_value;
    double max_value;
};

struct CommandMetadata {
    std::string command_id;
    std::string name;
    std::string command;
    std::string command_topic;
    std::vector<std::string> allowed_values;
    double min_value;
    double max_value;
    std::string description;
};

struct ComponentConfig {
    std::string id;
    std::string name;
    std::string type;
    std::vector<MetricMetadata> metrics;
    std::vector<CommandMetadata> commands;
};

struct DeviceDiscoveryEvent {
    std::string device_id;
    std::string name;
    std::string ip_address;
    std::vector<ComponentConfig> components;
};

struct ComponentTelemetryEvent {
    int64_t timestamp;
    std::string id;
    std::string metric;
    std::variant<int, double, bool, std::string> value;
    std::string unit;
    std::string state;
};

template <typename T>
struct TopicTraits;
template <>
struct TopicTraits<ComponentCommandEvent> {
    static constexpr const std::string_view kPrefix = "home-on/v1/commands/";
};

template <>
struct TopicTraits<DeviceDiscoveryEvent> {
    static constexpr const std::string_view kPrefix = "home-on/v1/discovery/";
};

template <>
struct TopicTraits<ComponentTelemetryEvent> {
    static constexpr const std::string_view kPrefix = "home-on/v1/telemetry/";
};
