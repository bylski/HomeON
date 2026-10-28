#include <ArduinoJson.h>
#include <MqttEvents.h>
#include <gtest/gtest.h>

#include <cstring>
#include <fstream>
#include <sstream>
#include <string>

// config.h requires these from firmware/.env; the tests never connect anywhere
#define ENV_WIFI_SSID "test"
#define ENV_WIFI_PASSWORD "test"
#define ENV_MQTT_PORT 1883
#define ENV_MQTT_USERNAME "test"
#define ENV_MQTT_PASSWORD "test"
#define ENV_MQTT_HOST "localhost"
// the real payloads of the device, so the golden files show exactly what it
// sends
#include "../../devices/test_sensors/discovery.h"

namespace HomeOn {
namespace {

// pio test runs the binary from the firmware folder
const std::string kGoldenDir = "../tests/contract/golden/";

// set by `--update-golden` (`pnpm test:firmware:update`)
bool update_golden = false;

/** re-serializes JSON compactly, so formatting differences don't count */
std::string Normalize(const std::string& json) {
    JsonDocument doc;
    deserializeJson(doc, json);
    std::string normalized;
    serializeJson(doc, normalized);
    return normalized;
}

/** Compares a payload with its committed golden file. With --update-golden
 * it rewrites the file instead (see docs/conventions/testing.md). */
void ExpectMatchesGolden(const std::string& json, const std::string& file) {
    const std::string path = kGoldenDir + file;

    if (update_golden) {
        JsonDocument doc;
        deserializeJson(doc, json);
        std::ofstream out(path);
        ASSERT_TRUE(out) << "cannot write " << path;
        serializeJsonPretty(doc, out);
        out << '\n';
        return;
    }

    std::ifstream in(path);
    ASSERT_TRUE(in) << "missing golden file " << path
                    << ", create it with `pnpm test:firmware:update`";
    std::stringstream golden;
    golden << in.rdbuf();
    EXPECT_EQ(Normalize(json), Normalize(golden.str()))
        << "firmware output changed: if intended, run "
           "`pnpm test:firmware:update` and commit the golden file";
}

TEST(Topics, BuildsDiscoveryTopicWithoutSuffix) {
    EXPECT_EQ(BuildTopic<DeviceDiscoveryEvent>("test_sensors"),
              "home-on/v1/discovery/test_sensors");
}

TEST(Topics, BuildsTelemetryTopicForComponent) {
    EXPECT_EQ(BuildTopic<ComponentTelemetryEvent>("test_sensors",
                                                  "/ultrasonic_sensor"),
              "home-on/v1/telemetry/test_sensors/ultrasonic_sensor");
}

TEST(Topics, DeviceCommandTopicFollowsConvention) {
    const std::string topic = BuildTopic<ComponentCommandEvent>(
        Config::kDeviceId, kLedCommand.command_topic);

    EXPECT_EQ(topic, "home-on/v1/commands/test_sensors/red_led_diode/switch");
}

TEST(EventsJson, SerializesTelemetryValueAsNumber) {
    const ComponentTelemetryEvent event = {
        .id = "ultrasonic_sensor", .metric = "distance", .value = 42};

    JsonDocument doc;
    deserializeJson(doc, ToJson(event));

    EXPECT_TRUE(doc["value"].is<int>());
    EXPECT_EQ(doc["value"].as<int>(), 42);
}

TEST(EventsJson, SerializesCommandStringValue) {
    const ComponentCommandEvent event = {
        .timestamp = 1730000000, .command = "SWITCH_LED", .value = "ON"};

    JsonDocument doc;
    deserializeJson(doc, ToJson(event));

    EXPECT_EQ(doc["value"].as<std::string>(), "ON");
}

TEST(Golden, DiscoveryOfTestSensors) {
    ExpectMatchesGolden(ToJson(kDiscoveryEvent), "discovery/testSensors.json");
}

TEST(Golden, UltrasonicTelemetry) {
    // built the same way as in devices/test_sensors/main.cpp
    const ComponentTelemetryEvent event = {.id = kUltrasonicSensor.id,
                                           .metric = "distance",
                                           .value = 42,
                                           .unit = "cm",
                                           .state = "MEASURING"};

    ExpectMatchesGolden(ToJson(event), "telemetry/ultrasonicDistance.json");
}

TEST(Golden, LedSwitchCommand) {
    const ComponentCommandEvent event = {
        .timestamp = 1730000000, .command = "SWITCH_LED", .value = "ON"};

    ExpectMatchesGolden(ToJson(event), "command/ledSwitchOn.json");
}

}  // namespace
}  // namespace HomeOn

int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    for (int i = 1; i < argc; i++) {
        if (std::strcmp(argv[i], "--update-golden") == 0) {
            HomeOn::update_golden = true;
        }
    }
    return RUN_ALL_TESTS();
}
