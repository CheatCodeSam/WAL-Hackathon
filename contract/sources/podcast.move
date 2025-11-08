module podcast::podcast;

use podcast::episode::{Self, Episode};
use std::string::String;
use sui::bag::{Self, Bag};
use sui::dynamic_field as df;

// ==== Errors ====
#[error]
const EEpisodeAlreadyExists: vector<u8> = b"Episode already exists";

#[error]
const EEpisodeDoesNotExists: vector<u8> = b"Episode does not exist";

#[error]
const EPodcastNotEmpty: vector<u8> = b"Can not delete a podcast with episodes";

public struct Podcast has key, store {
    id: UID,
    title: String,
    image_blob: String,
    duration: u64,
    episode_count: u64,
    episodes: Bag,
    tags: vector<String>, // For automatic recomendations
    nouce: String, // Unique string for decryption
    is_free: bool,
}

public fun new(title: String, image_blob: String, nouce: String, ctx: &mut TxContext): Podcast {
    let podcast = Podcast {
        id: object::new(ctx),
        title,
        image_blob,
        duration: 0,
        episode_count: 0,
        episodes: bag::new(ctx),
        tags: vector<String>[],
        is_free: true,
        nouce,
    };

    podcast
}

// Add Episode to podcast
public fun add(
    podcast: &mut Podcast,
    name: String,
    duration: u64,
    blob_id: String,
    file_type: String,
) {
    assert!(df::exists_(&podcast.id, blob_id), EEpisodeAlreadyExists);
    let episode = episode::new(name, duration, blob_id, file_type);

    podcast.episodes.add(blob_id, episode);
    podcast.increament_duration(duration);

    // Todo: Episode Added
}

/// remove episode from podcast by ID
public fun remove(podcast: &mut Podcast, blob_id: String) {
    assert!(bag::contains(&podcast.episodes, blob_id), EEpisodeDoesNotExists);
    let episode: Episode = podcast.episodes.remove(blob_id);

    let duration = episode.duration();
    episode.destroy();
    podcast.decreament_duration(duration);

    cleanup_blob(blob_id);
    // Todo: Episode Removed
}

public fun destroy(podcast: Podcast) {
    assert!(bag::length(&podcast.episodes) != 0, EPodcastNotEmpty);
    let Podcast { id, episodes, .. } = podcast;

    id.delete();

    episodes.destroy_empty()
    // destroy_episodes(episodes);
    // Todo: Podcast Destroy
}

fun increament_duration(podcast: &mut Podcast, duration: u64) {
    podcast.duration = podcast.duration + duration;
}

fun decreament_duration(podcast: &mut Podcast, duration: u64) {
    if (podcast.duration >= duration) {
        podcast.duration = podcast.duration - duration;
    } else {
        podcast.duration = 0;
    };
}

/// handles cleaning up blob storage
#[allow(unused_variable)]
fun cleanup_blob(blob_id: String) {}

public fun id(podcast: &Podcast): ID {
    object::id(podcast)
}

public fun nouce(podcast: &Podcast): String {
    podcast.nouce
}

public fun is_free(podcast: &Podcast): bool {
    podcast.is_free
}
