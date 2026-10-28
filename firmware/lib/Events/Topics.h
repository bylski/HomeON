#pragma once

#include <Events.h>

#include <string>
#include <string_view>

namespace HomeOn {

/** Builds the topic an event is published under (docs/conventions/mqtt.md),
 * e.g. "home-on/v1/telemetry/test_sensors/ultrasonic_sensor".
 *
 * topic_suffix is empty or starts with '/', e.g. "/ultrasonic_sensor". */
template <typename TPayload>
std::string BuildTopic(std::string_view board_id,
                       std::string_view topic_suffix = "") {
    std::string topic(TopicTraits<TPayload>::kPrefix);
    topic += board_id;
    topic += topic_suffix;
    return topic;
}

}  // namespace HomeOn
