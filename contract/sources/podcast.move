module podcast::podcast;

use podcast::episode::{Self, Episode};
use std::string::String;

public struct Podcast has key, store {
    id: UID,
    title: String,
    image_blob: String,
    duration: u64,
    episodes: vector<Episode>,
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
        episodes: vector<Episode>[],
        tags: vector<String>[],
        is_free: true,
        nouce,
    };

    podcast
}

public fun add(
    podcast: &mut Podcast,
    name: String,
    duration: u64,
    blob_id: String,
    file_type: String,
) {
    let episode = episode::new(name, duration, blob_id, file_type);

    podcast.increament_duration(duration);
    podcast.episodes.push_back(episode);

    // Todo: Episode Added
}

/// remove last podcast
public fun pop_back(podcast: &mut Podcast) {
    let episode = podcast.episodes.pop_back();

    let duration = episode.duration();
    episode.destroy();
    podcast.decreament_duration(duration);

    // Todo: Episode Popped
}

public fun destroy(podcast: Podcast) {
    let Podcast { id, episodes, .. } = podcast;

    id.delete();

    destroy_episodes(episodes);
    // Todo: Podcast Destroy
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
