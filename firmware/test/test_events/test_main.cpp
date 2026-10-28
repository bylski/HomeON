#include <ArduinoJson.h>
#include <MqttEvents.h>
#include <gtest/gtest.h>

#include <algorithm>
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
// the real payloads of the device, so the snapshots show exactly what it
// sends
#include "../../devices/test_sensors/discovery.h"

namespace HomeOn {
namespace {

// pio test runs the binary from the firmware folder
const std::string kSnapshotDir = "test/snapshots/";

// set by `--update-snapshots` (`pnpm test:firmware:update`)
bool update_snapshots = false;

/** re-serializes JSON compactly, so formatting differences don't count */
std::string Normalize(const std::string& json) {
    JsonDocument doc;
    deserializeJson(doc, json);
    std::string normalized;
    serializeJson(doc, normalized);
    return normalized;
}

/** Compares a payload with its committed snapshot. With --update-snapshots
 * it rewrites the file instead (see docs/conventions/testing.md). */
void ExpectMatchesSnapshot(const std::string& json, const std::string& file) {
    const std::string path = kSnapshotDir + file;

    if (update_snapshots) {
        JsonDocument doc;
        deserializeJson(doc, json);
        std::string pretty;
        serializeJsonPretty(doc, pretty);
        // ArduinoJson writes CRLF and a text-mode stream on Windows adds
        // another CR, so drop them and write binary: snapshots always use LF
        // (.gitattributes)
        pretty.erase(std::remove(pretty.begin(), pretty.end(), '\r'),
                     pretty.end());
        std::ofstream out(path, std::ios::binary);
        ASSERT_TRUE(out) << "cannot write " << path;
        out << pretty << '\n';
        return;
    }

    std::ifstream in(path);
    ASSERT_TRUE(in) << "missing snapshot " << path
                    << ", create it with `pnpm test:firmware:update`";
    std::stringstream snapshot;
    snapshot << in.rdbuf();
    EXPECT_EQ(Normalize(json), Normalize(snapshot.str()))
        << "firmware output changed: if intended, run "
           "`pnpm test:firmware:update` and commit the snapshot";
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

TEST(Snapshot, DiscoveryOfTestSensors) {
    ExpectMatchesSnapshot(ToJson(kDiscoveryEvent),
                          "discovery/testSensors.json");
}

TEST(Snapshot, UltrasonicTelemetry) {
    // built the same way as in devices/test_sensors/main.cpp
    const ComponentTelemetryEvent event = {.id = kUltrasonicSensor.id,
                                           .metric = "distance",
                                           .value = 42,
                                           .unit = "cm",
                                           .state = "MEASURING"};

    ExpectMatchesSnapshot(ToJson(event), "telemetry/ultrasonicDistance.json");
}

TEST(Snapshot, LedSwitchCommand) {
    const ComponentCommandEvent event = {
        .timestamp = 1730000000, .command = "SWITCH_LED", .value = "ON"};

    ExpectMatchesSnapshot(ToJson(event), "command/ledSwitchOn.json");
}

}  // namespace
}  // namespace HomeOn

int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    for (int i = 1; i < argc; i++) {
        if (std::strcmp(argv[i], "--update-snapshots") == 0) {
            HomeOn::update_snapshots = true;
        }
    }
    return RUN_ALL_TESTS();
}
