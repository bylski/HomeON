#pragma once

#include <Arduino.h>
#include <Client.h>

class WiFiClient;

namespace HomeOn {

class WifiService {
   public:
    WifiService();
    ~WifiService();

    bool Begin(const char* ssid, const char* pass);

    Client& GetClient();

    IPAddress GetLocalIp();

   private:
    WiFiClient* raw_client_;
};
}  // namespace HomeOn