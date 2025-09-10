const fs = require('fs');
const path = require('path');

// Load monthly aggregated data
const monthlyData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'public/agg_data/monthly_aggregated_original.json'), 'utf8')
);

console.log('=== 연간 발전량 계산 ===\n');

// 태양광 발전소별 연간 총 발전량
console.log('태양광 발전소:');
const solarTotal = {};
for (const [plantName, plantData] of Object.entries(monthlyData.solar)) {
  if (plantName === 'total') continue;
  const annualGeneration = Object.values(plantData).reduce((sum, val) => sum + val, 0);
  solarTotal[plantName] = annualGeneration;
  console.log(`  ${plantName}: ${annualGeneration.toFixed(2)} GWh`);
}

console.log('\n풍력 발전소:');
const windTotal = {};
for (const [plantName, plantData] of Object.entries(monthlyData.wind)) {
  if (plantName === 'total') continue;
  const annualGeneration = Object.values(plantData).reduce((sum, val) => sum + val, 0);
  windTotal[plantName] = annualGeneration;
  console.log(`  ${plantName}: ${annualGeneration.toFixed(2)} GWh`);
}

// 현재 plant_capacity.json 로드
const currentCapacity = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'public/agg_data/plant_capacity.json'), 'utf8')
);

// 업데이트된 plant_capacity.json 생성
const updatedCapacity = {
  solar: {
    "육상태양광": {
      "capacity_gw": currentCapacity.solar["육상태양광"].capacity_gw,
      "generation_gwh": parseFloat(solarTotal["육상태양광"].toFixed(2))
    },
    "수상태양광1": {
      "capacity_gw": currentCapacity.solar["수상태양광1"].capacity_gw,
      "generation_gwh": parseFloat(solarTotal["수상태양광1"].toFixed(2))
    },
    "수상태양광2": {
      "capacity_gw": currentCapacity.solar["수상태양광2"].capacity_gw,
      "generation_gwh": parseFloat(solarTotal["수상태양광2"].toFixed(2))
    }
  },
  wind: {
    "군산해상풍력": {
      "capacity_gw": currentCapacity.wind["군산해상풍력"].capacity_gw,
      "generation_gwh": parseFloat(windTotal["군산해상풍력"].toFixed(2))
    },
    "새만금해상풍력": {
      "capacity_gw": currentCapacity.wind["새만금해상풍력"].capacity_gw,
      "generation_gwh": parseFloat(windTotal["새만금해상풍력"].toFixed(2))
    },
    "서남해해상풍력": {
      "capacity_gw": currentCapacity.wind["서남해해상풍력"].capacity_gw,
      "generation_gwh": parseFloat(windTotal["서남해해상풍력"].toFixed(2))
    }
  }
};

// 파일 저장
fs.writeFileSync(
  path.join(__dirname, 'public/agg_data/plant_capacity.json'),
  JSON.stringify(updatedCapacity, null, 2),
  'utf8'
);

console.log('\n=== plant_capacity.json 업데이트 완료 ===');
console.log('\n변경 사항:');
console.log('태양광:');
for (const plant in updatedCapacity.solar) {
  const old = currentCapacity.solar[plant].generation_gwh;
  const newVal = updatedCapacity.solar[plant].generation_gwh;
  console.log(`  ${plant}: ${old} GWh → ${newVal} GWh`);
}
console.log('\n풍력:');
for (const plant in updatedCapacity.wind) {
  const old = currentCapacity.wind[plant].generation_gwh;
  const newVal = updatedCapacity.wind[plant].generation_gwh;
  console.log(`  ${plant}: ${old} GWh → ${newVal} GWh`);
}

// 합계
const totalSolar = Object.values(solarTotal).reduce((sum, val) => sum + val, 0);
const totalWind = Object.values(windTotal).reduce((sum, val) => sum + val, 0);
console.log('\n총 발전량:');
console.log(`  태양광 합계: ${totalSolar.toFixed(2)} GWh`);
console.log(`  풍력 합계: ${totalWind.toFixed(2)} GWh`);
console.log(`  전체 합계: ${(totalSolar + totalWind).toFixed(2)} GWh`);