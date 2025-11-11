import type { Metrics, Podcast } from "~/hooks/useCreatorDashboard";

interface MatrixTabProps {
	podcasts?: Podcast[];
	metrics: Metrics;
}

export default function MaxtrixTab({ metrics }: MatrixTabProps) {
	return (
		<div>
			<h2 className="mb-6 font-bold text-2xl">Metrics</h2>
			<div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
				<div className="rounded bg-gray-50 p-4">
					<h3 className="font-medium text-lg">Total Subscribers</h3>
					<p className="font-bold text-3xl">{metrics.totalSubscribers}</p>
				</div>
				<div className="rounded bg-gray-50 p-4">
					<h3 className="font-medium text-lg">Total Episodes</h3>
					<p className="font-bold text-3xl">{metrics.totalEpisodes}</p>
				</div>
				<div className="rounded bg-gray-50 p-4">
					<h3 className="font-medium text-lg">Monthly Revenue</h3>
					<p className="font-bold text-3xl">
						${metrics.monthlyRevenue.toFixed(2)}
					</p>
				</div>
			</div>

			{/* {podcasts.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4">Podcast Performance</h3>
                <div className="space-y-4">
                  {podcasts.map((podcast) => (
                    <div key={podcast.id} className="border rounded p-4">
                      <h4 className="font-medium">{podcast.title}</h4>
                      <p>
                        Total Listens: {metrics.podcastListens[podcast.id] || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )} */}
		</div>
	);
}
