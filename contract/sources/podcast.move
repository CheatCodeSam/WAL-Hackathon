module fundsui::podcast;

use std::string::String;
use fundsui::channel::ChannelRegistry;
use fundsui::channel::Channel;

public struct Podcast has key, store {
    id: UID,
    source_file_uri: String,
    title: String,
    description: String,
    deleted: bool
}