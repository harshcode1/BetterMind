'use client';

import { useEffect, useRef } from 'react';

const MoodChart = ({ moodData }) => {
  const canvasRef = useRef(null);

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
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const xScale = chartWidth / (sortedData.length > 1 ? sortedData.length - 1 : 1);
    const yScale = chartHeight / 9; // Mood ranges from 1-10, so 9 steps

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb'; // Light gray
    ctx.lineWidth = 1;
    
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
      
      ctx.font = '10px Arial';
      ctx.fillStyle = '#6b7280'; // Gray
      ctx.textAlign = 'right';
      ctx.fillText(i + 1, padding - 10, y + 3);
    }
    
    ctx.stroke();

    // Draw data points and line
    if (sortedData.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6'; // Blue
      ctx.lineWidth = 2;
      
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
        
        ctx.beginPath();
        ctx.fillStyle = '#3b82f6'; // Blue
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Add tooltip on hover (would require event listeners in a real implementation)
        ctx.beginPath();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; // Light blue
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Add date labels for first and last points
      if (sortedData.length > 1) {
        ctx.font = '10px Arial';
        ctx.fillStyle = '#6b7280'; // Gray
        ctx.textAlign = 'center';
        
        // First date
        const firstDate = new Date(sortedData[0].createdAt).toLocaleDateString();
        ctx.fillText(firstDate, padding, height - padding + 15);
        
        // Last date
        const lastDate = new Date(sortedData[sortedData.length - 1].createdAt).toLocaleDateString();
        ctx.fillText(lastDate, padding + (sortedData.length - 1) * xScale, height - padding + 15);
      }
    }

    // Add title
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#111827'; // Dark gray
    ctx.textAlign = 'center';
    ctx.fillText('Mood Trends', width / 2, 15);

  }, [moodData]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      {moodData && moodData.length > 0 ? (
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={300}
          className="w-full h-full"
        />
      ) : (
        <div className="text-gray-500">No mood data available</div>
      )}
    </div>
  );
};

export default MoodChart;