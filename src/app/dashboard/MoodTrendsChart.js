'use client';

import { useEffect, useRef, useState } from 'react';

const MoodTrendsChart = ({ moodData, detailed = false }) => {
  const canvasRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!moodData || moodData.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Sort data by date
    const sortedData = [...moodData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Calculate x and y scales
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const xScale = chartWidth / (sortedData.length > 1 ? sortedData.length - 1 : 1);
    const yScale = chartHeight / 9; // Mood ranges from 1-10, so 9 steps

    // Draw background grid
    ctx.beginPath();
    ctx.strokeStyle = '#f3f4f6'; // Very light gray
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 9; i++) {
      const y = height - padding - i * yScale;
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
    }
    
    // Vertical grid lines
    const verticalLines = detailed ? sortedData.length : Math.min(7, sortedData.length);
    if (verticalLines > 1) {
      for (let i = 0; i < verticalLines; i++) {
        const step = sortedData.length > 1 ? (sortedData.length - 1) / (verticalLines - 1) : 0;
        // Ensure index is within bounds (0 to sortedData.length - 1)
        const index = Math.min(Math.round(i * step), sortedData.length - 1);
        const x = padding + (index * xScale);
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
      }
    } else if (verticalLines === 1) {
      // If there's only one data point, draw a single vertical line
      const x = padding;
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
    }
    
    ctx.stroke();

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb'; // Light gray
    ctx.lineWidth = 2;
    
    // Y-axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    
    // X-axis
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    
    // Y-axis ticks and labels
    for (let i = 0; i <= 9; i += 3) {
      const y = height - padding - i * yScale;
      ctx.moveTo(padding - 5, y);
      ctx.lineTo(padding, y);
      
      ctx.font = '12px Arial';
      ctx.fillStyle = '#6b7280'; // Gray
      ctx.textAlign = 'right';
      ctx.fillText(i + 1, padding - 10, y + 4);
    }
    
    // X-axis labels (dates)
    if (sortedData.length > 1) {
      ctx.font = '10px Arial';
      ctx.fillStyle = '#6b7280'; // Gray
      ctx.textAlign = 'center';
      
      const dateLabels = detailed ? sortedData.length : Math.min(7, sortedData.length);
      for (let i = 0; i < dateLabels; i++) {
        const step = sortedData.length > 1 ? (sortedData.length - 1) / (dateLabels - 1) : 0;
        // Ensure index is within bounds (0 to sortedData.length - 1)
        const index = Math.min(Math.round(i * step), sortedData.length - 1);
        const x = padding + (index * xScale);
        const date = new Date(sortedData[index].createdAt);
        const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;
        ctx.fillText(dateLabel, x, height - padding + 15);
      }
    }
    
    ctx.stroke();

    // Calculate 7-day moving average if detailed view and enough data
    let movingAverages = [];
    if (detailed && sortedData.length >= 7) {
      for (let i = 6; i < sortedData.length; i++) {
        const window = sortedData.slice(i - 6, i + 1);
        const avg = window.reduce((sum, entry) => sum + entry.mood, 0) / window.length;
        movingAverages.push({
          index: i,
          value: avg
        });
      }
    }

    // Draw data points and line
    if (sortedData.length > 0) {
      // Draw moving average line first (if available)
      if (movingAverages.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(79, 70, 229, 0.6)'; // Indigo with transparency
        ctx.lineWidth = 2;
        
        const firstAvg = movingAverages[0];
        const firstX = padding + firstAvg.index * xScale;
        const firstY = height - padding - (firstAvg.value - 1) * yScale;
        ctx.moveTo(firstX, firstY);
        
        movingAverages.forEach((avg, i) => {
          if (i === 0) return; // Skip first point
          const x = padding + avg.index * xScale;
          const y = height - padding - (avg.value - 1) * yScale;
          ctx.lineTo(x, y);
        });
        
        ctx.stroke();
      }
      
      // Draw main mood line
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6'; // Blue
      ctx.lineWidth = 3;
      
      // Move to first point
      const firstX = padding;
      const firstY = height - padding - (sortedData[0].mood - 1) * yScale;
      ctx.moveTo(firstX, firstY);
      
      // Draw lines to each point
      sortedData.forEach((data, index) => {
        if (index === 0) return; // Skip first point as we've already moved to it
        
        const x = padding + index * xScale;
        const y = height - padding - (data.mood - 1) * yScale;
        ctx.lineTo(x, y);
      });
      
      ctx.stroke();
      
      // Draw points
      sortedData.forEach((data, index) => {
        const x = padding + index * xScale;
        const y = height - padding - (data.mood - 1) * yScale;
        
        // Draw point background (white circle)
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw point border
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Fill point
        ctx.beginPath();
        ctx.fillStyle = '#3b82f6';
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Store point coordinates for hover detection
        data._chartX = x;
        data._chartY = y;
      });
      
      // Add legend if showing moving average
      if (movingAverages.length > 0) {
        const legendX = width - padding - 150;
        const legendY = padding + 20;
        
        // Draw legend box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(legendX, legendY, 150, 40);
        ctx.strokeStyle = '#e5e7eb';
        ctx.strokeRect(legendX, legendY, 150, 40);
        
        // Draw legend items
        // Mood line
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.moveTo(legendX + 10, legendY + 15);
        ctx.lineTo(legendX + 40, legendY + 15);
        ctx.stroke();
        
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(legendX + 25, legendY + 15, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Daily Mood', legendX + 45, legendY + 18);
        
        // Moving average line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(79, 70, 229, 0.6)';
        ctx.lineWidth = 2;
        ctx.moveTo(legendX + 10, legendY + 35);
        ctx.lineTo(legendX + 40, legendY + 35);
        ctx.stroke();
        
        ctx.fillStyle = '#374151';
        ctx.fillText('7-Day Average', legendX + 45, legendY + 38);
      }
    }

    // Add title
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#111827'; // Dark gray
    ctx.textAlign = 'center';
    ctx.fillText('Mood Trends Over Time', width / 2, 20);

    // Add y-axis title
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.fillText('Mood Level', 0, 0);
    ctx.restore();

  }, [moodData, detailed]);

  // Handle mouse move for tooltips
  const handleMouseMove = (e) => {
    if (!moodData || moodData.length === 0 || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if mouse is over any data point
    const sortedData = [...moodData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    let found = false;
    for (let i = 0; i < sortedData.length; i++) {
      const data = sortedData[i];
      if (data._chartX && data._chartY) {
        const distance = Math.sqrt(Math.pow(x - data._chartX, 2) + Math.pow(y - data._chartY, 2));
        if (distance <= 10) {
          setHoveredPoint(data);
          setTooltipPosition({ x: data._chartX, y: data._chartY });
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="w-full h-full relative">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={400}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {hoveredPoint && (
        <div 
          className="absolute bg-white p-2 rounded shadow-md text-sm z-10 pointer-events-none"
          style={{ 
            left: tooltipPosition.x + 10, 
            top: tooltipPosition.y - 70,
            transform: 'translateX(-50%)'
          }}
        >
          <p className="font-medium">Mood: {hoveredPoint.mood}/10</p>
          <p className="text-gray-600">{formatDate(hoveredPoint.createdAt)}</p>
          {hoveredPoint.activities && hoveredPoint.activities.length > 0 && (
            <p className="text-gray-600 text-xs">
              Activities: {hoveredPoint.activities.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MoodTrendsChart;