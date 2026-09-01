#include "WifiService.h"

#include <ESP8266WiFi.h>

namespace HomeOn {

WifiService::WifiService() { _rawClient = new WiFiClient(); }

WifiService::~WifiService() { delete _rawClient; }

bool WifiService::begin(const char* ssid, const char* pass) {
    WiFi.begin(ssid, pass);

    Serial.print("\nConnecting to WiFi...");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print('.');
    }

    Serial.println("\nSuccessfully connected!");
    return true;
}

IPAddress WifiService::getLocalIp() { return WiFi.localIP(); }

Client& WifiService::getClient() { return *_rawClient; }

}  // namespace HomeOn