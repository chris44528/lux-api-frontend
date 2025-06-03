import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

interface RecentSite {
  site_id: number;
  site_name: string;
  address: string;
  postcode: string;
  visited_at: string;
  status?: string;
  status_color?: string;
  time_ago?: string;
  communication_status?: string;
  days_offline?: number;
}

interface RecentVisitedSitesResponse {
  recent_sites: RecentSite[];
  count: number;
}

export function RecentVisitedSitesWidget() {
  const navigate = useNavigate();
  const [sites, setSites] = useState<RecentSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentSites();
    // Refresh every 5 minutes
    const interval = setInterval(fetchRecentSites, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentSites = async () => {
    try {
      setLoading(true);
      const response = await api.get<RecentVisitedSitesResponse>('/recent-sites/');
      setSites(response.data.recent_sites);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch recent sites:', err);
      setError('Failed to load recent sites');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (site: RecentSite) => {
    if (site.status_color) return site.status_color;
    
    if (site.communication_status === 'no_coms' || site.days_offline > 0) {
      return '#F44336'; // Red
    } else if (site.communication_status === 'zero_readings') {
      return '#FFC107'; // Amber
    }
    return '#4CAF50'; // Green
  };

  const getStatusText = (site: RecentSite) => {
    if (site.communication_status === 'no_coms' || site.days_offline > 0) {
      return `Offline ${site.days_offline || 0} days`;
    } else if (site.communication_status === 'zero_readings') {
      return 'Zero readings';
    }
    return 'Healthy';
  };

  const formatTimeAgo = (visitedAt: string) => {
    const date = new Date(visitedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  };

  const handleSiteClick = (siteId: number) => {
    navigate(`/sites/${siteId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No recently visited sites</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {sites.map((site) => (
        <Card
          key={site.site_id}
          className={cn(
            "cursor-pointer hover:shadow-md transition-all duration-200",
            "border-l-4"
          )}
          style={{ borderLeftColor: getStatusColor(site) }}
          onClick={() => handleSiteClick(site.site_id)}
        >
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{site.site_name}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {site.address}, {site.postcode}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {site.time_ago || formatTimeAgo(site.visited_at)}
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-xs shrink-0"
                style={{
                  borderColor: getStatusColor(site),
                  color: getStatusColor(site)
                }}
              >
                {getStatusText(site)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}