#pragma once

#include <Arduino.h>
#include <Client.h>

class WiFiClient;

namespace HomeOn {

class WifiService {
   public:
    WifiService();
    ~WifiService();

    bool begin(const char* ssid, const char* pass);

    Client& getClient();

   private:
    WiFiClient* _rawClient;
};
}  // namespace HomeOn