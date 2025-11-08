module podcast::episode;

use std::string::String;

// use sui::clock::Clock;

public struct Episode has store {
    name: String,
    duration: u64,
    file_type: String,
    blob_id: String,
    // created_at: u64,
}

public fun new(
    name: String,
    duration: u64,
    blob_id: String,
    file_type: String,
    // clock: &Clock
): Episode {
    Episode {
        name,
        duration,
        file_type,
        blob_id,
    }
}

public fun destroy(episode: Episode): (String, String) {
    let Episode { name, blob_id, .. } = episode;
    (name, blob_id)
}


public fun duration(episode: &Episode): u64 {
    episode.duration
}