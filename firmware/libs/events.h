#pragma once;

#include <Arduino.h>
#include <ArduinoJson.h>

#include <vector>

struct ComponentCommandEvent {
    int64_t timestamp;
    String command;
    JsonVariant value;
};

struct MetricMetadata {
    String metric_id;
    String unit;
    double min_value;
    double max_value;
};

struct CommandMetadata {
    String command;
    String command_topic;
    std::vector<String> allowed_values;
    double min_value;
    double max_value;
    String description;
};

struct ComponentConfig {
    String id;
    String type;
    std::vector<MetricMetadata> metrics;
    std::vector<CommandMetadata> commands;
};

struct DeviceDiscoveryEvent {
    String board_id;
    String ip_address;
    std::vector<ComponentConfig> components;
};

struct ComponentTelemetryEvent {
    int64_t timestamp;
    String id;
    String metric;
    JsonVariant value;
    String unit;
    String state;
};
