"use client";

import { useFeedbackStats, useOrderStats } from "@/client-lib/api-client";
import { StaffAuthGate } from "@/components/StaffAuthGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquare, ThumbsUp, TrendingUp } from "lucide-react";

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin === 1) return "1 min ago";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return "1 hour ago";
  return `${diffHours} hours ago`;
}

export default function FeedbackPage() {
  return (
    <StaffAuthGate>
      <FeedbackDashboard />
    </StaffAuthGate>
  );
}

function FeedbackDashboard() {
  const { data: stats, isLoading: statsLoading } = useFeedbackStats();
  const { data: orderStats, isLoading: orderStatsLoading } = useOrderStats();

  const isLoading = statsLoading || orderStatsLoading;

  const totalDelivered = orderStats?.orders_by_status?.delivered ?? 0;
  const totalFeedback = stats?.total_feedback ?? 0;
  const responseRate = totalDelivered > 0 ? Math.round((totalFeedback / totalDelivered) * 100) : 0;
  const fiveStarCount = stats?.rating_distribution?.[5] ?? 0;

  const maxDistCount = stats
    ? Math.max(...Object.values(stats.rating_distribution), 1)
    : 1;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-8 w-8 text-amber-600" />
        <div>
          <h1 className="text-2xl font-bold">Feedback Dashboard 📊</h1>
          <p className="text-sm text-muted-foreground">
            Resident satisfaction and comments
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-amber-100">
                  <MessageSquare className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold">{totalFeedback}</p>
              <p className="text-xs text-muted-foreground">Total Feedback</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Star className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{stats?.average_rating ?? 0}</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= Math.round(stats?.average_rating ?? 0)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Average Rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-green-100">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold">{fiveStarCount}</p>
              <p className="text-xs text-muted-foreground">5-Star Reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-blue-100">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold">{responseRate}%</p>
              <p className="text-xs text-muted-foreground">Response Rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Distribution */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-6 rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats?.rating_distribution?.[star] ?? 0;
                const percentage = totalFeedback > 0 ? Math.round((count / totalFeedback) * 100) : 0;
                const barWidth = maxDistCount > 0 ? (count / maxDistCount) * 100 : 0;

                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16 shrink-0">
                      <span className="text-sm font-medium">{star}</span>
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                    </div>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                        role="progressbar"
                        aria-valuenow={count}
                        aria-valuemin={0}
                        aria-valuemax={maxDistCount}
                        aria-label={`${star} star: ${count} reviews`}
                      />
                    </div>
                    <div className="w-16 text-right shrink-0">
                      <span className="text-sm text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Comments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Comments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : !stats || stats.recent_feedback.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No feedback yet today</p>
              <p className="text-sm text-muted-foreground mt-1">
                Feedback will appear here once residents rate their orders.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recent_feedback.map((fb) => (
                <div
                  key={fb.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-sm">{fb.resident_name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${
                              star <= fb.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300"
                            }`}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(fb.created_at)}
                    </span>
                  </div>
                  {fb.items && (
                    <p className="text-xs text-muted-foreground mb-1">
                      Ordered: {fb.items}
                    </p>
                  )}
                  {fb.comment && (
                    <p className="text-sm text-foreground mt-1">
                      &ldquo;{fb.comment}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
