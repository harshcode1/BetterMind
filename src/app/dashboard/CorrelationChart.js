'use client';

import { useEffect, useRef, useState } from 'react';

const CorrelationChart = ({ moodData, assessmentData }) => {
  const canvasRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [correlationType, setCorrelationType] = useState('phq9'); // 'phq9' or 'gad7'
  const [correlationStrength, setCorrelationStrength] = useState({ phq9: 0, gad7: 0 });

  useEffect(() => {
    if (!moodData || !assessmentData || moodData.length === 0 || assessmentData.length === 0 || !canvasRef.current) return;

    // Prepare data for correlation analysis
    const correlationData = prepareCorrelationData(moodData, assessmentData);
    if (correlationData.length === 0) return;

    // Calculate correlation coefficients
    const phq9Correlation = calculateCorrelation(
      correlationData.map(d => d.mood),
      correlationData.map(d => d.phq9Score)
    );
    
    const gad7Correlation = calculateCorrelation(
      correlationData.map(d => d.mood),
      correlationData.map(d => d.gad7Score)
    );
    
    setCorrelationStrength({
      phq9: phq9Correlation,
      gad7: gad7Correlation
    });

    // Render the chart
    renderChart(correlationData, correlationType);
  }, [moodData, assessmentData, correlationType]);

  // Prepare data by matching mood entries with assessment entries by date
  const prepareCorrelationData = (moods, assessments) => {
    const result = [];
    
    // For each assessment, find the closest mood entry within 3 days
    assessments.forEach(assessment => {
      const assessmentDate = new Date(assessment.date);
      
      // Find closest mood entry
      let closestMood = null;
      let minDiff = Infinity;
      
      moods.forEach(mood => {
        const moodDate = new Date(mood.createdAt);
        const diffDays = Math.abs((assessmentDate - moodDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 3 && diffDays < minDiff) {
          closestMood = mood;
          minDiff = diffDays;
        }
      });
      
      if (closestMood) {
        result.push({
          date: assessment.date,
          mood: closestMood.mood,
          phq9Score: assessment.phq9Score,
          gad7Score: assessment.gad7Score,
          moodDate: closestMood.createdAt
        });
      }
    });
    
    return result;
  };

  // Calculate Pearson correlation coefficient
  const calculateCorrelation = (x, y) => {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    
    // Calculate means
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate covariance and variances
    let covariance = 0;
    let xVariance = 0;
    let yVariance = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      covariance += xDiff * yDiff;
      xVariance += xDiff * xDiff;
      yVariance += yDiff * yDiff;
    }
    
    // Calculate correlation coefficient
    if (xVariance === 0 || yVariance === 0) return 0;
    return covariance / Math.sqrt(xVariance * yVariance);
  };

  // Render the scatter plot
  const renderChart = (data, type) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate x and y scales
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // X-axis is mood (1-10)
    const xScale = chartWidth / 9; // Mood ranges from 1-10, so 9 steps
    
    // Y-axis is assessment score
    const maxScore = type === 'phq9' ? 27 : 21;
    const yScale = chartHeight / maxScore;

    // Draw background grid
    ctx.beginPath();
    ctx.strokeStyle = '#f3f4f6'; // Very light gray
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= maxScore; i += 3) {
      const y = height - padding - i * yScale;
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
    }
    
    // Vertical grid lines
    for (let i = 1; i <= 10; i++) {
      const x = padding + (i - 1) * xScale;
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
    for (let i = 0; i <= maxScore; i += 3) {
      const y = height - padding - i * yScale;
      ctx.moveTo(padding - 5, y);
      ctx.lineTo(padding, y);
      
      ctx.font = '12px Arial';
      ctx.fillStyle = '#6b7280'; // Gray
      ctx.textAlign = 'right';
      ctx.fillText(i, padding - 10, y + 4);
    }
    
    // X-axis ticks and labels
    for (let i = 1; i <= 10; i++) {
      const x = padding + (i - 1) * xScale;
      ctx.moveTo(x, height - padding);
      ctx.lineTo(x, height - padding + 5);
      
      ctx.font = '12px Arial';
      ctx.fillStyle = '#6b7280'; // Gray
      ctx.textAlign = 'center';
      ctx.fillText(i, x, height - padding + 20);
    }
    
    ctx.stroke();

    // Draw scatter plot points
    data.forEach((point, index) => {
      const x = padding + (point.mood - 1) * xScale;
      const y = height - padding - (type === 'phq9' ? point.phq9Score : point.gad7Score) * yScale;
      
      // Draw point
      ctx.beginPath();
      ctx.fillStyle = type === 'phq9' ? '#9061f9' : '#60a5fa'; // Purple for PHQ-9, Blue for GAD-7
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Store point coordinates for hover detection
      point._x = x;
      point._y = y;
    });

    // Calculate and draw trend line (linear regression)
    if (data.length > 1) {
      const xValues = data.map(d => d.mood);
      const yValues = data.map(d => type === 'phq9' ? d.phq9Score : d.gad7Score);
      
      // Calculate linear regression
      const n = data.length;
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // Draw trend line
      ctx.beginPath();
      ctx.strokeStyle = type === 'phq9' ? 'rgba(144, 97, 249, 0.7)' : 'rgba(96, 165, 250, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]); // Dashed line
      
      // Start point (x=1)
      const startX = padding;
      const startY = height - padding - (intercept + slope * 1) * yScale;
      ctx.moveTo(startX, startY);
      
      // End point (x=10)
      const endX = padding + 9 * xScale;
      const endY = height - padding - (intercept + slope * 10) * yScale;
      ctx.lineTo(endX, endY);
      
      ctx.stroke();
      ctx.setLineDash([]); // Reset to solid line
    }

    // Add title
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#111827'; // Dark gray
    ctx.textAlign = 'center';
    ctx.fillText(
      type === 'phq9' ? 'Mood vs. Depression (PHQ-9) Correlation' : 'Mood vs. Anxiety (GAD-7) Correlation', 
      width / 2, 
      20
    );

    // Add axis titles
    // X-axis title
    ctx.font = '12px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.fillText('Mood Level', width / 2, height - 10);
    
    // Y-axis title
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(type === 'phq9' ? 'Depression Score (PHQ-9)' : 'Anxiety Score (GAD-7)', 0, 0);
    ctx.restore();

    // Add correlation coefficient
    const correlation = type === 'phq9' ? correlationStrength.phq9 : correlationStrength.gad7;
    const correlationText = `Correlation: ${correlation.toFixed(2)}`;
    const correlationDesc = getCorrelationDescription(correlation);
    
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'left';
    ctx.fillText(correlationText, padding, padding - 10);
    
    ctx.font = '12px Arial';
    ctx.fillText(correlationDesc, padding, padding + 10);
  };

  // Get description of correlation strength
  const getCorrelationDescription = (correlation) => {
    const absCorrelation = Math.abs(correlation);
    
    if (absCorrelation < 0.1) return 'No correlation';
    if (absCorrelation < 0.3) return 'Weak correlation';
    if (absCorrelation < 0.5) return 'Moderate correlation';
    if (absCorrelation < 0.7) return 'Strong correlation';
    return 'Very strong correlation';
  };

  // Handle mouse move for tooltips
  const handleMouseMove = (e) => {
    if (!moodData || !assessmentData || moodData.length === 0 || assessmentData.length === 0 || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Prepare correlation data
    const correlationData = prepareCorrelationData(moodData, assessmentData);
    
    // Check if mouse is over any data point
    let found = false;
    for (let i = 0; i < correlationData.length; i++) {
      const point = correlationData[i];
      if (point._x && point._y) {
        const distance = Math.sqrt(Math.pow(x - point._x, 2) + Math.pow(y - point._y, 2));
        if (distance <= 10) {
          setHoveredPoint(point);
          setTooltipPosition({ x: point._x, y: point._y });
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
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="w-full h-full">
      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              correlationType === 'phq9'
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setCorrelationType('phq9')}
          >
            Depression (PHQ-9)
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              correlationType === 'gad7'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setCorrelationType('gad7')}
          >
            Anxiety (GAD-7)
          </button>
        </div>
      </div>
      
      <div className="relative">
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
              correlationType === 'phq9' ? 'border-l-4 border-purple-500' : 'border-l-4 border-blue-500'
            }`}
            style={{ 
              left: tooltipPosition.x + 10, 
              top: tooltipPosition.y - 100,
              transform: 'translateX(-50%)'
            }}
          >
            <p className="font-medium">
              {correlationType === 'phq9' ? 'Depression (PHQ-9)' : 'Anxiety (GAD-7)'}
            </p>
            <p className={correlationType === 'phq9' ? 'text-purple-600 font-medium' : 'text-blue-600 font-medium'}>
              Score: {correlationType === 'phq9' ? hoveredPoint.phq9Score : hoveredPoint.gad7Score}
              /
              {correlationType === 'phq9' ? '27' : '21'}
            </p>
            <p className="text-blue-600 font-medium">
              Mood: {hoveredPoint.mood}/10
            </p>
            <p className="text-gray-600 text-xs">
              Assessment: {formatDate(hoveredPoint.date)}
            </p>
            <p className="text-gray-600 text-xs">
              Mood: {formatDate(hoveredPoint.moodDate)}
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>
          This chart shows the relationship between your mood levels and 
          {correlationType === 'phq9' ? ' depression ' : ' anxiety '} 
          scores.
        </p>
        <p>
          {Math.abs(correlationStrength[correlationType]) > 0.3 ? (
            correlationStrength[correlationType] < 0 ? (
              <span>Higher mood levels tend to correlate with lower {correlationType === 'phq9' ? 'depression' : 'anxiety'} scores.</span>
            ) : (
              <span>There appears to be a positive correlation between mood and {correlationType === 'phq9' ? 'depression' : 'anxiety'} scores, which is unusual and may require more data.</span>
            )
          ) : (
            <span>There is no strong correlation visible yet. Continue tracking to reveal patterns.</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default CorrelationChart;