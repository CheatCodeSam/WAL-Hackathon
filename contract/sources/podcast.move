module podcast::podcast;

use podcast::channel::{Channel, ChannelCap};
use podcast::episode::{Self, Episode};
use std::string::String;

#[error]
const EUnauthorizedAccess: vector<u8> = b"Unauthorized Access";

public struct Podcast has key, store {
    id: UID,
    title: String,
    image_blob: String,
    duration: u64,
    episodes: vector<Episode>,
    tags: vector<String>, // For automatic recomendations
    channel: ID,
    nouce: String, // Unique string for decryption
    is_free: bool
}

public fun new(
    title: String,
    image_blob: String,
    nouce: String,
    channel_cap: &ChannelCap,
    ctx: &mut TxContext,
): Podcast {
    let podcast = Podcast {
        id: object::new(ctx),
        title,
        image_blob,
        duration: 0,
        episodes: vector<Episode>[],
        tags: vector<String>[],
        channel: channel_cap.channel(),
        is_free: true,
        nouce,
    };

    podcast
}

public fun add(
    channel: &mut Channel,
    podcast: &mut Podcast,
    name: String,
    duration: u64,
    blob_id: String,
    file_type: String,
    channel_cap: &ChannelCap,
) {
    assert!(channel.id() == channel_cap.channel(), EUnauthorizedAccess);
    assert!(podcast.channel == channel_cap.channel(), EUnauthorizedAccess);

    let episode = episode::new(name, duration, blob_id, file_type);

    podcast.increament_duration(duration);
    podcast.episodes.push_back(episode);
    channel.increment_number_of_podcasts();
}

/// remove last podcast
public fun pop_back(channel: &mut Channel, podcast: &mut Podcast, channel_cap: &ChannelCap) {
    assert!(channel.id() == channel_cap.channel(), EUnauthorizedAccess);
    assert!(podcast.channel == channel_cap.channel(), EUnauthorizedAccess);

    let episode = podcast.episodes.pop_back();

    let duration = episode.duration();
    episode.destroy();
    podcast.decreament_duration(duration);
    channel.decrement_number_of_podcasts();
}

/// Publish podcast to the public
#[allow(lint(share_owned))]
public fun publish(podcast: Podcast) {
    // Todo: emit PodcastPublished
    transfer::public_share_object(podcast);
}

public fun destroy(podcast: Podcast, channel_cap: &ChannelCap) {
    let Podcast { id, channel, episodes, .. } = podcast;

    assert!(channel == channel_cap.channel(), 0); // Only channel can destory podcast

    id.delete();

    destroy_episodes(episodes);
}

fun destroy_episodes(mut episodes: vector<Episode>) {
    let len = vector::length<Episode>(&episodes);
    let mut i = 0;

    while (i < len) {
        let ep = vector::remove<Episode>(&mut episodes, i);

        let (_, blob_id) = ep.destroy();

        cleanup_blob(blob_id);

        i = i + 1;
    };

    vector::destroy_empty<Episode>(episodes);
}

fun increament_duration(podcast: &mut Podcast, duration: u64) {
    podcast.duration = podcast.duration + duration;
}

fun decreament_duration(podcast: &mut Podcast, duration: u64) {
    if (podcast.duration >= duration){
        podcast.duration = podcast.duration - duration;
    } else {
        podcast.duration = 0;
    };
}


/// handles cleaning up blob storage
#[allow(unused_variable)]
fun cleanup_blob(blob_id: String) {}

public fun channel(podcast: &Podcast): ID {
    podcast.channel
}

public fun nouce(podcast: &Podcast): String {
    podcast.nouce
}

public fun is_free(podcast: &Podcast): bool {
    podcast.is_free
}