#include "WifiService.h"

#include <ESP8266WiFi.h>

namespace HomeOn {

WifiService::WifiService() { raw_client_ = new WiFiClient(); }

WifiService::~WifiService() { delete raw_client_; }

bool WifiService::Begin(const char* ssid, const char* pass) {
    WiFi.begin(ssid, pass);

    Serial.print("\nConnecting to WiFi...");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print('.');
    }

    Serial.println("\nSuccessfully connected!");
    return true;
}

IPAddress WifiService::GetLocalIp() { return WiFi.localIP(); }

Client& WifiService::GetClient() { return *raw_client_; }

}  // namespace HomeOn