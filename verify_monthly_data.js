// 월별 데이터 검증 스크립트
const fs = require('fs');
const path = require('path');

// Load the aggregated JSON data
const monthlyData = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/agg_data/monthly_aggregated_original.json'), 'utf8'));

console.log('=== 월별 데이터 검증 ===\n');

// 태양광 발전소 검증
console.log('태양광 발전소:');
for (const [plantName, plantData] of Object.entries(monthlyData.solar)) {
  if (plantName === 'total') continue;
  const months = Object.keys(plantData);
  console.log(`  ${plantName}: ${months.length}개월 데이터`);
  if (months.length !== 12) {
    console.log(`    ⚠️ 경고: 12개월이 아닌 ${months.length}개월만 있음`);
    console.log(`    존재하는 월: ${months.join(', ')}`);
  } else {
    const totalProduction = Object.values(plantData).reduce((sum, val) => sum + val, 0);
    console.log(`    ✓ 연간 총 발전량: ${totalProduction.toFixed(2)} GWh`);
  }
}

console.log('\n풍력 발전소:');
for (const [plantName, plantData] of Object.entries(monthlyData.wind)) {
  if (plantName === 'total') continue;
  const months = Object.keys(plantData);
  console.log(`  ${plantName}: ${months.length}개월 데이터`);
  if (months.length !== 12) {
    console.log(`    ⚠️ 경고: 12개월이 아닌 ${months.length}개월만 있음`);
    console.log(`    존재하는 월: ${months.join(', ')}`);
  } else {
    const totalProduction = Object.values(plantData).reduce((sum, val) => sum + val, 0);
    console.log(`    ✓ 연간 총 발전량: ${totalProduction.toFixed(2)} GWh`);
  }
}

// 월별 합계 검증
console.log('\n월별 합계 데이터:');
const allMonths = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', 
                   '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'];

for (const month of allMonths) {
  const solarTotal = monthlyData.solar.total[month] || 0;
  const windTotal = monthlyData.wind.total[month] || 0;
  const demand = monthlyData.demand[month] || 0;
  const totalSupply = solarTotal + windTotal;
  const re100Rate = (totalSupply / demand * 100).toFixed(1);
  
  console.log(`  ${month}: 태양광=${solarTotal.toFixed(1)}GWh, 풍력=${windTotal.toFixed(1)}GWh, 수요=${demand.toFixed(1)}GWh, RE100=${re100Rate}%`);
}

// 연간 합계
const annualSolar = Object.values(monthlyData.solar.total).reduce((sum, val) => sum + val, 0);
const annualWind = Object.values(monthlyData.wind.total).reduce((sum, val) => sum + val, 0);
const annualDemand = Object.values(monthlyData.demand).reduce((sum, val) => sum + val, 0);
const annualRE100 = ((annualSolar + annualWind) / annualDemand * 100).toFixed(1);

console.log('\n=== 연간 합계 ===');
console.log(`태양광: ${annualSolar.toFixed(2)} GWh`);
console.log(`풍력: ${annualWind.toFixed(2)} GWh`);
console.log(`총 공급: ${(annualSolar + annualWind).toFixed(2)} GWh`);
console.log(`총 수요: ${annualDemand.toFixed(2)} GWh`);
console.log(`연간 RE100 달성률: ${annualRE100}%`);