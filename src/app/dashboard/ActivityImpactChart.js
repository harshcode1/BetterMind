'use client';

import { useEffect, useRef, useState } from 'react';

const ActivityImpactChart = ({ moodData }) => {
  const canvasRef = useRef(null);
  const [activityStats, setActivityStats] = useState([]);
  const [sortBy, setSortBy] = useState('impact'); // 'impact', 'frequency', 'alphabetical'
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!moodData || moodData.length === 0) return;

    // Calculate activity statistics
    const stats = calculateActivityStats(moodData);
    setActivityStats(stats);
    
    // Render chart
    renderChart(stats, sortBy);
  }, [moodData, sortBy]);

  // Calculate statistics for each activity
  const calculateActivityStats = (data) => {
    // Count activities and calculate average mood
    const activityMap = {};
    const overallAvgMood = data.reduce((sum, entry) => sum + entry.mood, 0) / data.length;
    
    data.forEach(entry => {
      if (entry.activities && entry.activities.length > 0) {
        entry.activities.forEach(activity => {
          if (!activityMap[activity]) {
            activityMap[activity] = {
              name: activity,
              count: 0,
              moodSum: 0,
              moods: []
            };
          }
          
          activityMap[activity].count++;
          activityMap[activity].moodSum += entry.mood;
          activityMap[activity].moods.push(entry.mood);
        });
      }
    });
    
    // Convert to array and calculate averages and impact
    const activityStats = Object.values(activityMap)
      .filter(activity => activity.count >= 2) // Only include activities with at least 2 entries
      .map(activity => {
        const avgMood = activity.moodSum / activity.count;
        const impact = avgMood - overallAvgMood;
        
        // Calculate standard deviation
        const mean = avgMood;
        const variance = activity.moods.reduce((sum, mood) => sum + Math.pow(mood - mean, 2), 0) / activity.moods.length;
        const stdDev = Math.sqrt(variance);
        
        return {
          name: activity.name,
          count: activity.count,
          avgMood,
          impact,
          stdDev,
          moods: activity.moods
        };
      });
    
    return activityStats;
  };

  // Render the bar chart
  const renderChart = (stats, sortType) => {
    if (!canvasRef.current || stats.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Sort activities based on selected sort type
    let sortedStats = [...stats];
    if (sortType === 'impact') {
      sortedStats.sort((a, b) => b.impact - a.impact);
    } else if (sortType === 'frequency') {
      sortedStats.sort((a, b) => b.count - a.count);
    } else if (sortType === 'alphabetical') {
      sortedStats.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Limit to top 15 activities for readability
    sortedStats = sortedStats.slice(0, 15);

    // Calculate chart dimensions
    const padding = { top: 40, right: 30, bottom: 100, left: 150 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Calculate bar dimensions
    const barCount = sortedStats.length;
    const barHeight = Math.min(30, chartHeight / barCount);
    const barSpacing = Math.min(10, (chartHeight - barHeight * barCount) / (barCount - 1 || 1));
    const totalBarSpace = barCount * barHeight + (barCount - 1) * barSpacing;
    const startY = padding.top + (chartHeight - totalBarSpace) / 2;
    
    // Find max impact value for scaling
    const maxImpact = Math.max(
      Math.max(...sortedStats.map(s => Math.abs(s.impact))),
      1 // Minimum scale
    );
    
    // Draw zero line
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb'; // Light gray
    ctx.lineWidth = 2;
    const zeroX = padding.left + chartWidth / 2;
    ctx.moveTo(zeroX, padding.top - 10);
    ctx.lineTo(zeroX, height - padding.bottom + 10);
    ctx.stroke();
    
    // Draw zero line label
    ctx.font = '12px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.fillText('Neutral', zeroX, height - padding.bottom + 25);

    // Draw impact scale
    ctx.font = '10px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    
    // Negative impact label
    ctx.fillText('Negative Impact', padding.left + chartWidth / 4, height - padding.bottom + 25);
    
    // Positive impact label
    ctx.fillText('Positive Impact', padding.left + (chartWidth * 3) / 4, height - padding.bottom + 25);

    // Draw bars
    sortedStats.forEach((activity, index) => {
      const y = startY + index * (barHeight + barSpacing);
      
      // Calculate bar width based on impact
      const barWidth = Math.abs(activity.impact) * (chartWidth / 2) / maxImpact;
      
      // Determine bar position and color based on impact
      let barX;
      let barColor;
      
      if (activity.impact >= 0) {
        // Positive impact
        barX = zeroX;
        barColor = '#10b981'; // Green
      } else {
        // Negative impact
        barX = zeroX - barWidth;
        barColor = '#ef4444'; // Red
      }
      
      // Draw bar
      ctx.fillStyle = barColor;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(barX, y, barWidth, barHeight);
      ctx.globalAlpha = 1.0;
      
      // Draw bar border
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, y, barWidth, barHeight);
      
      // Draw activity name
      ctx.font = '12px Arial';
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'right';
      ctx.fillText(activity.name, padding.left - 10, y + barHeight / 2 + 4);
      
      // Draw frequency count
      ctx.font = '10px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`(${activity.count}×)`, padding.left - 15, y + barHeight / 2 + 4);
      
      // Draw impact value
      ctx.font = '11px Arial';
      ctx.fillStyle = '#111827';
      ctx.textAlign = activity.impact >= 0 ? 'left' : 'right';
      ctx.fillText(
        activity.impact.toFixed(1), 
        activity.impact >= 0 ? barX + barWidth + 5 : barX - 5, 
        y + barHeight / 2 + 4
      );
      
      // Store bar coordinates for hover detection
      activity._chartX = barX;
      activity._chartY = y;
      activity._chartWidth = barWidth;
      activity._chartHeight = barHeight;
    });

    // Draw title
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.fillText('Activity Impact on Mood', width / 2, 20);
  };

  // Handle mouse move for tooltips
  const handleMouseMove = (e) => {
    if (!canvasRef.current || activityStats.length === 0) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if mouse is over any bar
    let found = false;
    for (let i = 0; i < activityStats.length; i++) {
      const activity = activityStats[i];
      if (
        activity._chartX && 
        activity._chartY && 
        x >= activity._chartX && 
        x <= activity._chartX + activity._chartWidth &&
        y >= activity._chartY &&
        y <= activity._chartY + activity._chartHeight
      ) {
        setHoveredBar(activity);
        setTooltipPosition({ 
          x: activity.impact >= 0 ? activity._chartX + activity._chartWidth / 2 : activity._chartX + activity._chartWidth / 2,
          y: activity._chartY + activity._chartHeight / 2
        });
        found = true;
        break;
      }
    }
    
    if (!found) {
      setHoveredBar(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
  };

  return (
    <div className="w-full h-full">
      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              sortBy === 'impact'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            } rounded-l-lg`}
            onClick={() => setSortBy('impact')}
          >
            Impact
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              sortBy === 'frequency'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setSortBy('frequency')}
          >
            Frequency
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              sortBy === 'alphabetical'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            } rounded-r-lg`}
            onClick={() => setSortBy('alphabetical')}
          >
            A-Z
          </button>
        </div>
      </div>
      
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={500}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        
        {hoveredBar && (
          <div 
            className={`absolute bg-white p-2 rounded shadow-md text-sm z-10 pointer-events-none ${
              hoveredBar.impact >= 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
            }`}
            style={{ 
              left: tooltipPosition.x + 10, 
              top: tooltipPosition.y - 70,
              transform: 'translateX(-50%)'
            }}
          >
            <p className="font-medium">{hoveredBar.name}</p>
            <p className="text-gray-700">
              Average Mood: <span className="font-medium">{hoveredBar.avgMood.toFixed(1)}</span>/10
            </p>
            <p className={hoveredBar.impact >= 0 ? 'text-green-600' : 'text-red-600'}>
              Impact: <span className="font-medium">{hoveredBar.impact.toFixed(2)}</span>
            </p>
            <p className="text-gray-600 text-xs">
              Recorded {hoveredBar.count} times
            </p>
            <p className="text-gray-600 text-xs">
              Consistency: {hoveredBar.stdDev.toFixed(1)} (lower is more consistent)
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>
          This chart shows how different activities correlate with your mood levels.
          Positive values indicate activities associated with higher mood, while negative values
          indicate activities associated with lower mood.
        </p>
        {activityStats.length > 0 ? (
          <p className="mt-2">
            {activityStats.filter(a => a.impact > 0.5).length > 0 ? (
              <>
                Activities with the most positive impact: {' '}
                <span className="font-medium text-green-600">
                  {activityStats
                    .filter(a => a.impact > 0.5)
                    .sort((a, b) => b.impact - a.impact)
                    .slice(0, 3)
                    .map(a => a.name)
                    .join(', ')}
                </span>
              </>
            ) : (
              'No activities with strong positive impact identified yet.'
            )}
          </p>
        ) : (
          <p className="mt-2">
            Record more activities with your mood entries to see their impact.
          </p>
        )}
      </div>
    </div>
  );
};

export default ActivityImpactChart;