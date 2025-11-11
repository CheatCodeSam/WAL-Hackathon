interface Channel {
	name: string;
	bio: string;
	coverImage: string;
	profileImage: string;
	tiers: {
		id: string;
		name: string;
		price: number;
		description: string;
		benefits: string[];
	}[];
}

interface ChannelFormProps {
	channel: Channel;
	updateChannel: (updates: Partial<Channel>) => void;
	uploadChannelCover: (file: File) => void;
	uploadChannelProfile: (file: File) => void;
	saveChannel: () => void;
	addChannelTier: (tier: Omit<Channel["tiers"][0], "id">) => void;
}

const ChannelForm = ({
	channel,
	updateChannel,
	uploadChannelCover,
	uploadChannelProfile,
	saveChannel,
	addChannelTier,
}: ChannelFormProps) => {
	return (
		<div>
			<h2 className="mb-6 font-bold text-2xl">Channel Settings</h2>
			<form
				className="space-y-6"
				onSubmit={(e) => {
					e.preventDefault();
					saveChannel();
				}}
			>
				<div>
					<label className="block font-medium text-gray-700 text-sm">
						Channel Name
					</label>
					<input
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
						onChange={(e) => updateChannel({ name: e.target.value })}
						placeholder="Your channel name"
						type="text"
						value={channel.name}
					/>
				</div>
				<div>
					<label className="block font-medium text-gray-700 text-sm">
						Cover Image
					</label>
					<div className="mt-1 flex items-center">
						<div className="flex h-32 w-full items-center justify-center rounded bg-gray-100">
							{channel.coverImage ? (
								<img
									alt="Channel cover"
									className="h-full w-full rounded object-cover"
									src={channel.coverImage}
								/>
							) : (
								<button
									className="text-blue-500"
									onClick={() => {
										const input = document.createElement("input");
										input.type = "file";
										input.accept = "image/*";
										input.onchange = (e) => {
											const file = (e.target as HTMLInputElement).files?.[0];
											if (file) uploadChannelCover(file);
										};
										input.click();
									}}
									type="button"
								>
									Upload Image
								</button>
							)}
						</div>
					</div>
				</div>
				<div>
					<label className="block font-medium text-gray-700 text-sm">
						Profile Image
					</label>
					<div className="mt-1 flex items-center">
						<div className="flex h-32 w-full items-center justify-center rounded bg-gray-100">
							{channel.profileImage ? (
								<img
									alt="Channel cover"
									className="h-full w-full rounded object-cover"
									src={channel.profileImage}
								/>
							) : (
								<button
									className="text-blue-500"
									onClick={() => {
										const input = document.createElement("input");
										input.type = "file";
										input.accept = "image/*";
										input.onchange = (e) => {
											const file = (e.target as HTMLInputElement).files?.[0];
											if (file) uploadChannelProfile(file);
										};
										input.click();
									}}
									type="button"
								>
									Upload Image
								</button>
							)}
						</div>
					</div>
				</div>
				<div>
					<label className="block font-medium text-gray-700 text-sm">Bio</label>
					<textarea
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
						onChange={(e) => updateChannel({ bio: e.target.value })}
						placeholder="Tell your audience about your channel..."
						rows={4}
						value={channel.bio}
					/>
				</div>
				<div>
					<h3 className="mb-4 font-medium text-lg">Channel Tiers</h3>
					<div className="space-y-4">
						{channel.tiers.map((tier) => (
							<div className="rounded border p-4" key={tier.id}>
								<h4>{tier.name}</h4>
								<p>${tier.price}</p>
								<p>{tier.description}</p>
							</div>
						))}
						<button
							className="w-full rounded border-2 border-gray-300 border-dashed p-4 text-center"
							onClick={() =>
								addChannelTier({
									name: "New Tier",
									price: 5,
									description: "My sample tier",
									benefits: ["Quick"],
								})
							}
							type="button"
						>
							+ Add New Tier
						</button>
					</div>
				</div>
				<button
					className="rounded bg-blue-500 px-4 py-2 text-white"
					type="submit"
				>
					Save Changes
				</button>
			</form>
		</div>
	);
};

export default ChannelForm;
