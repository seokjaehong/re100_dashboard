const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/agg_data/plant_monthly_aggregated.json'), 'utf8'));

console.log('=== Plant Monthly Aggregated Data ===\n');

console.log('Solar plants:');
Object.keys(data.solar).forEach(plant => {
  const months = Object.keys(data.solar[plant]);
  const total = Object.values(data.solar[plant]).reduce((a, b) => a + b, 0);
  console.log(`  ${plant}: ${months.length} months, Total: ${total.toFixed(2)} GWh`);
  if (months.length === 12) {
    console.log(`    Months: All 12 months present ✓`);
  } else {
    console.log(`    Months: ${months.join(', ')}`);
  }
});

console.log('\nWind plants:');
Object.keys(data.wind).forEach(plant => {
  const months = Object.keys(data.wind[plant]);
  const total = Object.values(data.wind[plant]).reduce((a, b) => a + b, 0);
  console.log(`  ${plant}: ${months.length} months, Total: ${total.toFixed(2)} GWh`);
  if (months.length === 12) {
    console.log(`    Months: All 12 months present ✓`);
  } else {
    console.log(`    Months: ${months.join(', ')}`);
  }
});

// 총계
const solarTotal = Object.values(data.solar).reduce((sum, plant) => 
  sum + Object.values(plant).reduce((a, b) => a + b, 0), 0);
const windTotal = Object.values(data.wind).reduce((sum, plant) => 
  sum + Object.values(plant).reduce((a, b) => a + b, 0), 0);

console.log('\n=== Annual Totals ===');
console.log(`Solar Total: ${solarTotal.toFixed(2)} GWh`);
console.log(`Wind Total: ${windTotal.toFixed(2)} GWh`);
console.log(`Grand Total: ${(solarTotal + windTotal).toFixed(2)} GWh`);