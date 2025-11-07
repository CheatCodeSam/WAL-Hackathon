import { type Metrics, type Podcast } from "~/hooks/useCreatorDashboard";

interface MatrixTabProps {
  podcasts?: Podcast[],
  metrics: Metrics,
}

export default function MaxtrixTab({ metrics }: MatrixTabProps) {
  return (
    <div>
            <h2 className="text-2xl font-bold mb-6">Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="text-lg font-medium">Total Subscribers</h3>
                <p className="text-3xl font-bold">{metrics.totalSubscribers}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="text-lg font-medium">Total Episodes</h3>
                <p className="text-3xl font-bold">{metrics.totalEpisodes}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="text-lg font-medium">Monthly Revenue</h3>
                <p className="text-3xl font-bold">
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
  )
}
