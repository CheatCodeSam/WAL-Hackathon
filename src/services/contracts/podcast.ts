import { Transaction } from "@mysten/sui/transactions";
import { config } from "../config";

interface PodcastInput {
    title: string;
    nouce: string;
}

export class Podcast {
    private tx: Transaction;

    private constructor() {
        this.tx = new Transaction();
    }

    static init(): Podcast {
        return new Podcast();
    }

    /**
     * Creates a new podcast
     * @param input Podcast creation parameters
     * @param channelCapId The channel capability object ID
     * @returns this for method chaining
     */
    create(input: PodcastInput, channelCapId: string): Podcast {
        this.tx.moveCall({
            target: `${config.packageId}::podcast::new`,
            arguments: [
                this.tx.pure.string(input.title),
                this.tx.pure.string(input.nouce),
                this.tx.object(channelCapId),
            ]
        });
        return this;
    }

    /**
     * Adds an episode to podcast
     * @param channelId The channel object ID
     * @param podcastId The podcast object ID
     * @param channelCapId The channel capability object ID
     * @param episodeMetaData Object with file metadata
     * @returns this for method chaining
     */
    add(channelId: string, podcastId: string, channelCapId: string, episodeMetaData: { name: string, duration_ms: number, blod_id: string, file_type: string }): Podcast {
        this.tx.moveCall({
            target: `${config.packageId}::podcast::add`,
            arguments: [
                this.tx.object(channelId),
                this.tx.object(podcastId),
                this.tx.pure.string(episodeMetaData.name),
                this.tx.pure.u64(episodeMetaData.duration_ms),
                this.tx.pure.string(episodeMetaData.file_type),
                this.tx.object(channelCapId),
            ]
        });
        return this;
    }

    /**
     * Removes last episode added to podcast
     * @param channelId The channel object ID
     * @param podcastId The podcast object ID
     * @param channelCapId The channel capability object ID
     * @returns this for method chaining
     */
    pop_back(channelId: string, podcastId: string, channelCapId: string): Podcast {
        this.tx.moveCall({
            target: `${config.packageId}::podcast::pop_back`,
            arguments: [
                this.tx.object(channelId),
                this.tx.object(podcastId),
                this.tx.object(channelCapId),
            ]
        });
        return this;
    }

    /**
     * Publishes a podcast to the public
     * @param podcastId The podcast object ID
     * @param subscriptionPrice The price to access the content (in MIST)
     * @returns this for method chaining
     */
    publish(podcastId: string, subscriptionPrice: number): Podcast {
        this.tx.moveCall({
            target: `${config.packageId}::podcast::publish`,
            arguments: [
                this.tx.object(podcastId),
                this.tx.pure.u64(subscriptionPrice),
            ]
        });
        return this;
    }

    /**
     * Destroys a podcast
     * @param podcastId The podcast object ID
     * @param channelCapId The channel capability object ID
     * @returns this for method chaining
     */
    destroy(podcastId: string, channelCapId: string): Podcast {
        this.tx.moveCall({
            target: `${config.packageId}::podcast::destroy`,
            arguments: [
                this.tx.object(podcastId),
                this.tx.object(channelCapId),
            ]
        });
        return this;
    }

    /**
     * Returns the transaction for execution
     */
    build(): Transaction {
        return this.tx;
    }
}
