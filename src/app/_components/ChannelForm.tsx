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
  addChannelTier: (tier: Omit<Channel['tiers'][0], 'id'>) => void;
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
      <h2 className="text-2xl font-bold mb-6">Channel Settings</h2>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          saveChannel();
        }}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Channel Name
          </label>
          <input
            type="text"
            value={channel.name}
            onChange={(e) => updateChannel({ name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Your channel name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Cover Image
          </label>
          <div className="mt-1 flex items-center">
            <div className="h-32 w-full bg-gray-100 rounded flex items-center justify-center">
              {channel.coverImage ? (
                <img
                  src={channel.coverImage}
                  alt="Channel cover"
                  className="h-full w-full object-cover rounded"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) uploadChannelCover(file);
                    };
                    input.click();
                  }}
                  className="text-blue-500"
                >
                  Upload Image
                </button>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Profile Image
          </label>
          <div className="mt-1 flex items-center">
            <div className="h-32 w-full bg-gray-100 rounded flex items-center justify-center">
              {channel.profileImage ? (
                <img
                  src={channel.profileImage}
                  alt="Channel cover"
                  className="h-full w-full object-cover rounded"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) uploadChannelProfile(file);
                    };
                    input.click();
                  }}
                  className="text-blue-500"
                >
                  Upload Image
                </button>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Bio</label>
          <textarea
            value={channel.bio}
            onChange={(e) => updateChannel({ bio: e.target.value })}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Tell your audience about your channel..."
          />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-4">Channel Tiers</h3>
          <div className="space-y-4">
            {channel.tiers.map((tier) => (
              <div key={tier.id} className="border p-4 rounded">
                <h4>{tier.name}</h4>
                <p>${tier.price}</p>
                <p>{tier.description}</p>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                addChannelTier({
                  name: 'New Tier',
                  price: 5,
                  description: 'My sample tier',
                  benefits: ["Quick"],
                })
              }
              className="w-full border-2 border-dashed border-gray-300 p-4 rounded text-center"
            >
              + Add New Tier
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default ChannelForm;
