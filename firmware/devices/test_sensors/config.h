#pragma once

// WIFI
#ifndef ENV_WIFI_SSID
#error "ENV_WIFI_SSID is missing from .env!"
#endif

#ifndef ENV_WIFI_PASSWORD
#error "ENV_WIFI_PASSWORD is missing from .env!"
#endif

// MQTT
#ifndef ENV_MQTT_PORT
#error "ENV_MQTT_PORT is missing from .env!"
#endif

#ifndef ENV_MQTT_USERNAME
#error "ENV_MQTT_USERNAME is missing from .env!"
#endif

#ifndef ENV_MQTT_PASSWORD
#error "ENV_MQTT_PASSWORD is missing from .env!"
#endif

#ifndef ENV_MQTT_HOST
#error "ENV_MQTT_HOST is missing from .env!"
#endif

namespace Config {
constexpr const char* WIFI_SSID = ENV_WIFI_SSID;
constexpr const char* WIFI_PASSWORD = ENV_WIFI_PASSWORD;
constexpr const uint16_t MQTT_PORT = ENV_MQTT_PORT;
constexpr const char* MQTT_USERNAME = ENV_MQTT_USERNAME;
constexpr const char* MQTT_PASSWORD = ENV_MQTT_PASSWORD;
constexpr const char* MQTT_HOST = ENV_MQTT_HOST;
}  // namespace Config