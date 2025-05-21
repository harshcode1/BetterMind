'use client';

import { useEffect, useRef, useState } from 'react';

const AssessmentTrendsChart = ({ assessmentData, detailed = false }) => {
  const canvasRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipType, setTooltipType] = useState(''); // 'phq9' or 'gad7'

  useEffect(() => {
    if (!assessmentData || assessmentData.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Sort data by date
    const sortedData = [...assessmentData].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate x and y scales
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const xScale = chartWidth / (sortedData.length > 1 ? sortedData.length - 1 : 1);
    
    // Find max values for scaling
    const maxPhq9 = 27; // PHQ-9 max score
    const maxGad7 = 21; // GAD-7 max score
    const maxValue = Math.max(maxPhq9, maxGad7);
    
    const yScale = chartHeight / maxValue;

    // Draw background grid
    ctx.beginPath();
    ctx.strokeStyle = '#f3f4f6'; // Very light gray
    ctx.lineWidth = 1;
    
    // Horizontal grid lines - draw at clinically significant thresholds
    const thresholds = [5, 10, 15, 20, 27]; // Important thresholds for PHQ-9 and GAD-7
    thresholds.forEach(threshold => {
      if (threshold <= maxValue) {
        const y = height - padding - threshold * yScale;
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
      }
    });
    
    // Vertical grid lines
    const verticalLines = detailed ? sortedData.length : Math.min(7, sortedData.length);
    for (let i = 0; i < verticalLines; i++) {
      const step = sortedData.length / (verticalLines - 1);
      const index = Math.round(i * step);
      const x = padding + (index * xScale);
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
    thresholds.forEach(threshold => {
      if (threshold <= maxValue) {
        const y = height - padding - threshold * yScale;
        ctx.moveTo(padding - 5, y);
        ctx.lineTo(padding, y);
        
        ctx.font = '12px Arial';
        ctx.fillStyle = '#6b7280'; // Gray
        ctx.textAlign = 'right';
        ctx.fillText(threshold, padding - 10, y + 4);
      }
    });
    
    // Add severity labels on the right side
    if (detailed) {
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      
      // PHQ-9 severity labels
      ctx.fillStyle = '#9061f9'; // Purple
      ctx.fillText('Minimal (0-4)', width - padding + 10, height - padding - 2 * yScale);
      ctx.fillText('Mild (5-9)', width - padding + 10, height - padding - 7 * yScale);
      ctx.fillText('Moderate (10-14)', width - padding + 10, height - padding - 12 * yScale);
      ctx.fillText('Mod. Severe (15-19)', width - padding + 10, height - padding - 17 * yScale);
      ctx.fillText('Severe (20-27)', width - padding + 10, height - padding - 24 * yScale);
      
      // Draw colored bands for severity levels
      const severityLevels = [
        { min: 0, max: 4, color: 'rgba(237, 233, 254, 0.2)' }, // Minimal - very light purple
        { min: 5, max: 9, color: 'rgba(221, 214, 254, 0.2)' }, // Mild - light purple
        { min: 10, max: 14, color: 'rgba(196, 181, 253, 0.2)' }, // Moderate - medium purple
        { min: 15, max: 19, color: 'rgba(167, 139, 250, 0.2)' }, // Moderately severe - darker purple
        { min: 20, max: 27, color: 'rgba(139, 92, 246, 0.2)' }  // Severe - darkest purple
      ];
      
      severityLevels.forEach(level => {
        const yTop = height - padding - level.max * yScale;
        const yBottom = height - padding - level.min * yScale;
        const bandHeight = yBottom - yTop;
        
        ctx.fillStyle = level.color;
        ctx.fillRect(padding, yTop, chartWidth, bandHeight);
      });
    }
    
    // X-axis labels (dates)
    if (sortedData.length > 1) {
      ctx.font = '10px Arial';
      ctx.fillStyle = '#6b7280'; // Gray
      ctx.textAlign = 'center';
      
      const dateLabels = detailed ? sortedData.length : Math.min(7, sortedData.length);
      for (let i = 0; i < dateLabels; i++) {
        const step = sortedData.length / (dateLabels - 1);
        const index = Math.round(i * step);
        
        // Make sure index is valid and within bounds
        if (index >= 0 && index < sortedData.length && sortedData[index] && sortedData[index].date) {
          const x = padding + (index * xScale);
          const date = new Date(sortedData[index].date);
          const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;
          ctx.fillText(dateLabel, x, height - padding + 15);
        }
      }
    }
    
    ctx.stroke();

    // Draw PHQ-9 line (Depression)
    if (sortedData.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#9061f9'; // Purple
      ctx.lineWidth = 3;
      
      // Move to first point
      const firstX = padding;
      const firstY = height - padding - sortedData[0].phq9Score * yScale;
      ctx.moveTo(firstX, firstY);
      
      // Draw lines to each point
      sortedData.forEach((data, index) => {
        if (index === 0) return; // Skip first point as we've already moved to it
        
        const x = padding + index * xScale;
        const y = height - padding - data.phq9Score * yScale;
        ctx.lineTo(x, y);
      });
      
      ctx.stroke();
      
      // Draw PHQ-9 points
      sortedData.forEach((data, index) => {
        const x = padding + index * xScale;
        const y = height - padding - data.phq9Score * yScale;
        
        // Draw point background (white circle)
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw point border
        ctx.beginPath();
        ctx.strokeStyle = '#9061f9'; // Purple
        ctx.lineWidth = 2;
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Fill point
        ctx.beginPath();
        ctx.fillStyle = '#9061f9'; // Purple
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Store point coordinates for hover detection
        data._phq9X = x;
        data._phq9Y = y;
      });
      
      // Draw GAD-7 line (Anxiety)
      ctx.beginPath();
      ctx.strokeStyle = '#60a5fa'; // Blue
      ctx.lineWidth = 3;
      
      // Move to first point
      const firstGadX = padding;
      const firstGadY = height - padding - sortedData[0].gad7Score * yScale;
      ctx.moveTo(firstGadX, firstGadY);
      
      // Draw lines to each point
      sortedData.forEach((data, index) => {
        if (index === 0) return; // Skip first point as we've already moved to it
        
        const x = padding + index * xScale;
        const y = height - padding - data.gad7Score * yScale;
        ctx.lineTo(x, y);
      });
      
      ctx.stroke();
      
      // Draw GAD-7 points
      sortedData.forEach((data, index) => {
        const x = padding + index * xScale;
        const y = height - padding - data.gad7Score * yScale;
        
        // Draw point background (white circle)
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw point border
        ctx.beginPath();
        ctx.strokeStyle = '#60a5fa'; // Blue
        ctx.lineWidth = 2;
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Fill point
        ctx.beginPath();
        ctx.fillStyle = '#60a5fa'; // Blue
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Store point coordinates for hover detection
        data._gad7X = x;
        data._gad7Y = y;
      });
      
      // Add legend
      const legendX = width - padding - 150;
      const legendY = padding + 20;
      
      // Draw legend box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(legendX, legendY, 150, 50);
      ctx.strokeStyle = '#e5e7eb';
      ctx.strokeRect(legendX, legendY, 150, 50);
      
      // Draw legend items
      // PHQ-9 line
      ctx.beginPath();
      ctx.strokeStyle = '#9061f9'; // Purple
      ctx.lineWidth = 3;
      ctx.moveTo(legendX + 10, legendY + 15);
      ctx.lineTo(legendX + 40, legendY + 15);
      ctx.stroke();
      
      ctx.fillStyle = '#9061f9'; // Purple
      ctx.beginPath();
      ctx.arc(legendX + 25, legendY + 15, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Depression (PHQ-9)', legendX + 45, legendY + 18);
      
      // GAD-7 line
      ctx.beginPath();
      ctx.strokeStyle = '#60a5fa'; // Blue
      ctx.lineWidth = 3;
      ctx.moveTo(legendX + 10, legendY + 35);
      ctx.lineTo(legendX + 40, legendY + 35);
      ctx.stroke();
      
      ctx.fillStyle = '#60a5fa'; // Blue
      ctx.beginPath();
      ctx.arc(legendX + 25, legendY + 35, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#374151';
      ctx.fillText('Anxiety (GAD-7)', legendX + 45, legendY + 38);
    }

    // Add title
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#111827'; // Dark gray
    ctx.textAlign = 'center';
    ctx.fillText('Assessment Score Trends', width / 2, 20);

    // Add y-axis title
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.fillText('Score', 0, 0);
    ctx.restore();

  }, [assessmentData, detailed]);

  // Handle mouse move for tooltips
  const handleMouseMove = (e) => {
    if (!assessmentData || assessmentData.length === 0 || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if mouse is over any data point
    const sortedData = [...assessmentData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let found = false;
    // Check PHQ-9 points first
    for (let i = 0; i < sortedData.length; i++) {
      const data = sortedData[i];
      if (data._phq9X && data._phq9Y) {
        const distance = Math.sqrt(Math.pow(x - data._phq9X, 2) + Math.pow(y - data._phq9Y, 2));
        if (distance <= 10) {
          setHoveredPoint(data);
          setTooltipPosition({ x: data._phq9X, y: data._phq9Y });
          setTooltipType('phq9');
          found = true;
          break;
        }
      }
    }
    
    // If not found, check GAD-7 points
    if (!found) {
      for (let i = 0; i < sortedData.length; i++) {
        const data = sortedData[i];
        if (data._gad7X && data._gad7Y) {
          const distance = Math.sqrt(Math.pow(x - data._gad7X, 2) + Math.pow(y - data._gad7Y, 2));
          if (distance <= 10) {
            setHoveredPoint(data);
            setTooltipPosition({ x: data._gad7X, y: data._gad7Y });
            setTooltipType('gad7');
            found = true;
            break;
          }
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
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get severity text based on score
  const getPhq9Severity = (score) => {
    if (score >= 0 && score <= 4) return "Minimal";
    if (score >= 5 && score <= 9) return "Mild";
    if (score >= 10 && score <= 14) return "Moderate";
    if (score >= 15 && score <= 19) return "Moderately Severe";
    return "Severe";
  };

  const getGad7Severity = (score) => {
    if (score >= 0 && score <= 4) return "Minimal";
    if (score >= 5 && score <= 9) return "Mild";
    if (score >= 10 && score <= 14) return "Moderate";
    return "Severe";
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
          className={`absolute bg-white p-2 rounded shadow-md text-sm z-10 pointer-events-none ${
            tooltipType === 'phq9' ? 'border-l-4 border-purple-500' : 'border-l-4 border-blue-500'
          }`}
          style={{ 
            left: tooltipPosition.x + 10, 
            top: tooltipPosition.y - 80,
            transform: 'translateX(-50%)'
          }}
        >
          <p className="font-medium">
            {tooltipType === 'phq9' ? 'Depression (PHQ-9)' : 'Anxiety (GAD-7)'}
          </p>
          <p className={tooltipType === 'phq9' ? 'text-purple-600 font-medium' : 'text-blue-600 font-medium'}>
            Score: {tooltipType === 'phq9' ? hoveredPoint.phq9Score : hoveredPoint.gad7Score}
            /
            {tooltipType === 'phq9' ? '27' : '21'}
          </p>
          <p className="text-gray-700">
            Severity: {tooltipType === 'phq9' 
              ? getPhq9Severity(hoveredPoint.phq9Score) 
              : getGad7Severity(hoveredPoint.gad7Score)
            }
          </p>
          <p className="text-gray-600">{formatDate(hoveredPoint.date)}</p>
        </div>
      )}
    </div>
  );
};

export default AssessmentTrendsChart;