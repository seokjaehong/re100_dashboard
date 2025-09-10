// Test script to verify chart data structure
const fs = require('fs');
const path = require('path');

// Load the aggregated JSON data
const monthlyData = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/agg_data/monthly_aggregated_original.json'), 'utf8'));
const hourlyData = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/agg_data/plant_hourly_aggregated_original.json'), 'utf8'));
const companyData = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/agg_data/company_monthly_aggregated_original.json'), 'utf8'));

console.log('=== PlantChart Monthly Data Structure ===');
console.log('Solar plants:', Object.keys(monthlyData.solar));
console.log('Wind plants:', Object.keys(monthlyData.wind));

// Check if data exists for each month
const solarPlant1 = monthlyData.solar['육상태양광'];
if (solarPlant1) {
  console.log('\n육상태양광 monthly data:', Object.keys(solarPlant1).length, 'months');
  console.log('Sample:', Object.entries(solarPlant1).slice(0, 3));
}

console.log('\n=== PlantChart Hourly Data Structure ===');
console.log('Solar plants:', Object.keys(hourlyData.solar));
console.log('Wind plants:', Object.keys(hourlyData.wind));

// Check if data exists for each hour
const solarPlant1Hourly = hourlyData.solar['육상태양광'];
if (solarPlant1Hourly) {
  console.log('\n육상태양광 hourly data:', Object.keys(solarPlant1Hourly).length, 'hours');
  console.log('Sample hours 6-12:', Object.entries(solarPlant1Hourly).slice(6, 13));
}

console.log('\n=== CompanyDemandChart Data Structure ===');
const companies = Object.keys(companyData).filter(k => k !== 'total');
console.log('Number of companies:', companies.length);
console.log('First 5 companies:', companies.slice(0, 5));

// Check company data structure
if (companies.length > 0) {
  const firstCompany = companyData[companies[0]];
  console.log('\nFirst company months:', Object.keys(firstCompany).length);
  console.log('Sample data:', Object.entries(firstCompany).slice(0, 3));
}

// Verify data transformation for PlantChart
console.log('\n=== Simulating PlantChart Data Transformation ===');
const daysInMonth = {
  '1월': 31, '2월': 29, '3월': 31, '4월': 30, '5월': 31, '6월': 30,
  '7월': 31, '8월': 31, '9월': 30, '10월': 31, '11월': 30, '12월': 31
};

const monthlyChartData = [];
const monthLabels = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

for (const monthNum of ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']) {
  const monthLabel = parseInt(monthNum) + '월';
  const monthKey = '2024-' + monthNum;
  const monthData = { period: monthLabel };
  
  // Add solar plants
  if (monthlyData.solar) {
    Object.entries(monthlyData.solar).forEach(([plantName, plantData]) => {
      if (plantName !== 'total' && plantData[monthKey] !== undefined) {
        const days = daysInMonth[monthLabel] || 30;
        monthData[plantName] = plantData[monthKey] / (days * 24); // Average GW
      }
    });
  }
  
  // Add wind plants
  if (monthlyData.wind) {
    Object.entries(monthlyData.wind).forEach(([plantName, plantData]) => {
      if (plantName !== 'total' && plantData[monthKey] !== undefined) {
        const days = daysInMonth[monthLabel] || 30;
        monthData[plantName] = plantData[monthKey] / (days * 24); // Average GW
      }
    });
  }
  
  if (Object.keys(monthData).length > 1) { // Has data beyond 'period'
    monthlyChartData.push(monthData);
  }
}

console.log('Transformed monthly data entries:', monthlyChartData.length);
console.log('First entry keys:', Object.keys(monthlyChartData[0]));
console.log('Sample data (Jan):', monthlyChartData[0]);

// Verify hourly transformation
console.log('\n=== Simulating PlantChart Hourly Transformation ===');
const hourlyChartData = [];
for (let hour = 0; hour < 24; hour++) {
  const hourKey = hour.toString();
  const periodKey = hour.toString().padStart(2, '0') + ':00';
  const hourData = { period: periodKey };
  
  // Add solar plants
  if (hourlyData.solar) {
    Object.entries(hourlyData.solar).forEach(([plantName, plantData]) => {
      hourData[plantName] = (plantData[hourKey] || 0) / 1000; // GWh to GW
    });
  }
  
  // Add wind plants
  if (hourlyData.wind) {
    Object.entries(hourlyData.wind).forEach(([plantName, plantData]) => {
      hourData[plantName] = (plantData[hourKey] || 0) / 1000; // GWh to GW
    });
  }
  
  hourlyChartData.push(hourData);
}

console.log('Transformed hourly data entries:', hourlyChartData.length);
console.log('First entry keys:', Object.keys(hourlyChartData[0]));
console.log('Sample data (00:00):', hourlyChartData[0]);
console.log('Sample data (12:00):', hourlyChartData[12]);