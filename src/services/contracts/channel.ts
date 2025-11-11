import { Transaction } from "@mysten/sui/transactions";
import { config } from "../config";

interface ChannelInput {
	username: string;
	bio: string;
	coverPhoto: string;
	profilePhoto: string;
}

export class Channel {
	private tx: Transaction;

	private constructor() {
		this.tx = new Transaction();
	}

	static init(): Channel {
		return new Channel();
	}

	/**
	 * Creates a new channel
	 * @returns this for method chaining
	 */
	create(input: ChannelInput): Channel {
		this.tx.moveCall({
			target: `${config.packageId}::channel::new`,
			arguments: [
				this.tx.pure.string(input.username),
				this.tx.pure.string(input.bio),
				this.tx.pure.string(input.coverPhoto),
				this.tx.pure.string(input.profilePhoto),
			],
		});
		return this;
	}

	/**
	 * Sets the username for a channel
	 * @returns this for method chaining
	 */
	setUsername(
		channelId: string,
		channelCapId: string,
		newUsername: string,
	): Channel {
		this.tx.moveCall({
			target: `${config.packageId}::channel::set_username`,
			arguments: [
				this.tx.object(channelId),
				this.tx.object(channelCapId),
				this.tx.pure.string(newUsername),
			],
		});
		return this;
	}

	/**
	 * Sets the bio for a channel
	 * @returns this for method chaining
	 */
	setBio(channelId: string, channelCapId: string, newBio: string): Channel {
		this.tx.moveCall({
			target: `${config.packageId}::channel::set_bio`,
			arguments: [
				this.tx.object(channelId),
				this.tx.object(channelCapId),
				this.tx.pure.string(newBio),
			],
		});
		return this;
	}

	/**
	 * Sets the cover photo for a channel
	 * @returns this for method chaining
	 */
	setCoverPhoto(
		channelId: string,
		channelCapId: string,
		newCoverPhoto: string,
	): Channel {
		this.tx.moveCall({
			target: `${config.packageId}::channel::set_coverPhoto`,
			arguments: [
				this.tx.object(channelId),
				this.tx.object(channelCapId),
				this.tx.pure.string(newCoverPhoto),
			],
		});
		return this;
	}

	/**
	 * Sets the profile photo for a channel
	 * @returns this for method chaining
	 */
	setProfilePhoto(
		channelId: string,
		channelCapId: string,
		newProfilePhoto: string,
	): Channel {
		this.tx.moveCall({
			target: `${config.packageId}::channel::set_profilePhoto`,
			arguments: [
				this.tx.object(channelId),
				this.tx.object(channelCapId),
				this.tx.pure.string(newProfilePhoto),
			],
		});
		return this;
	}

	/**
	 * Sets the subscription price for a channel
	 * @returns this for method chaining
	 */
	setSubscriptionPrice(
		channelId: string,
		channelCapId: string,
		newPrice: number,
	): Channel {
		this.tx.moveCall({
			target: `${config.packageId}::channel::set_subscrption_price`,
			arguments: [
				this.tx.object(channelId),
				this.tx.object(channelCapId),
				this.tx.pure.u64(newPrice),
			],
		});
		return this;
	}

	/**
	 * Sets the subscription duration for a channel
	 * @returns this for method chaining
	 */
	setSubscriptionDuration(
		channelId: string,
		channelCapId: string,
		newDuration: number,
	): Channel {
		this.tx.moveCall({
			target: `${config.packageId}::channel::set_subscrption_duration`,
			arguments: [
				this.tx.object(channelId),
				this.tx.object(channelCapId),
				this.tx.pure.u64(newDuration),
			],
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
