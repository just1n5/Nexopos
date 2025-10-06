// Test script for inventory calculations and string concatenation issues
// Run with: node test-inventory-calc.js

console.log('=== Testing Inventory Calculations and String Issues ===\n');

// Test 1: String Concatenation vs Mathematical Operations
console.log('Test 1: String Concatenation Problem');
console.log('-------------------------------------');

function demonstrateProblem() {
  // Simulating database values (strings)
  const stockQuantity = "0.000";  // String from database
  const saleQuantity = -1;        // Number from request
  
  console.log('Without conversion:');
  console.log(`stockQuantity: "${stockQuantity}" (type: ${typeof stockQuantity})`);
  console.log(`saleQuantity: ${saleQuantity} (type: ${typeof saleQuantity})`);
  console.log(`Result: stockQuantity + saleQuantity = "${stockQuantity + saleQuantity}"`);
  console.log('❌ This creates "0.000-1" which PostgreSQL rejects!\n');
  
  console.log('With proper conversion:');
  const correctStock = Number(stockQuantity) || 0;
  const correctResult = correctStock + saleQuantity;
  console.log(`Number(stockQuantity): ${correctStock} (type: ${typeof correctStock})`);
  console.log(`Result: ${correctStock} + ${saleQuantity} = ${correctResult}`);
  console.log('✅ This creates -1 which PostgreSQL accepts!');
}

demonstrateProblem();
console.log();

// Test 2: Safe Number Conversion Function
console.log('Test 2: Safe Number Conversion');
console.log('-------------------------------');

function toNumber(value, defaultValue = 0) {
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? defaultValue : num;
}

const testValues = [
  "0.000",
  "10.500",
  "-5.250",
  0,
  null,
  undefined,
  "",
  "invalid",
  Infinity,
  NaN
];

console.log('Testing various input values:');
testValues.forEach(val => {
  const result = toNumber(val, 0);
  console.log(`toNumber(${JSON.stringify(val)}) = ${result}`);
});
console.log();

// Test 3: Average Cost Calculation with Strings
console.log('Test 3: Average Cost Calculation');
console.log('---------------------------------');

function calculateAverageCost(quantityBefore, averageCostBefore, newQuantity, newUnitCost) {
  // Convert all to numbers first
  const qtyBefore = Number(quantityBefore) || 0;
  const avgCostBefore = Number(averageCostBefore) || 0;
  const qtyNew = Number(newQuantity) || 0;
  const unitCost = Number(newUnitCost) || 0;
  
  const totalCurrentValue = qtyBefore * avgCostBefore;
  const totalNewValue = Math.abs(qtyNew) * unitCost;
  const quantityAfter = qtyBefore + qtyNew;
  
  const averageCost = quantityAfter > 0 ? 
    (totalCurrentValue + totalNewValue) / quantityAfter : 
    unitCost;
    
  return {
    quantityBefore: qtyBefore,
    quantityAfter,
    averageCostBefore: avgCostBefore,
    newUnitCost: unitCost,
    averageCostAfter: averageCost,
    totalValue: quantityAfter * averageCost
  };
}

// Test with string values (simulating database)
console.log('With string inputs (from database):');
let result = calculateAverageCost("100.000", "50.00", "50", "60.00");
console.log(result);
console.log(`Expected average: (100*50 + 50*60) / 150 = 53.33`);
console.log();

// Test 4: Stock Movement Validation
console.log('Test 4: Stock Movement with Database Values');
console.log('--------------------------------------------');

function validateStockMovement(currentStock, quantity) {
  // Convert to numbers
  const stock = Number(currentStock) || 0;
  const qty = Number(quantity) || 0;
  const newStock = stock + qty;
  
  if (qty < 0 && newStock < 0) {
    return {
      valid: false,
      error: `Insufficient stock. Available: ${stock}, Requested: ${Math.abs(qty)}`
    };
  }
  
  return {
    valid: true,
    before: stock,
    after: newStock,
    status: newStock <= 0 ? 'OUT_OF_STOCK' : 
            newStock <= 10 ? 'LOW_STOCK' : 'IN_STOCK'
  };
}

console.log('Database stock: "5.000" (string)');
console.log('Selling 3 units:', validateStockMovement("5.000", -3));
console.log('Selling 10 units:', validateStockMovement("5.000", -10));
console.log('Adding 20 units:', validateStockMovement("5.000", 20));
console.log();

// Test 5: Product Price Calculation with Variants
console.log('Test 5: Product Variant Price with Strings');
console.log('-------------------------------------------');

function calculateVariantPrice(basePrice, priceDelta) {
  const base = Number(basePrice) || 0;
  const delta = Number(priceDelta) || 0;
  const price = base + delta;
  
  if (isNaN(price) || !isFinite(price)) {
    return 0;
  }
  
  return price;
}

console.log('Base price: "50000.00" (string from DB)');
console.log('Variant S (delta: "0"): $' + calculateVariantPrice("50000.00", "0"));
console.log('Variant XXL (delta: "5000"): $' + calculateVariantPrice("50000.00", "5000"));
console.log('Variant with discount (delta: "-2000"): $' + calculateVariantPrice("50000.00", "-2000"));
console.log();

// Test 6: Edge Cases and Error Scenarios
console.log('Test 6: Edge Cases');
console.log('------------------');

function testEdgeCase(description, value1, value2, operation) {
  const v1 = value1;
  const v2 = value2;
  const wrongResult = operation === '+' ? v1 + v2 : v1 - v2;
  
  const n1 = Number(v1) || 0;
  const n2 = Number(v2) || 0;
  const correctResult = operation === '+' ? n1 + n2 : n1 - n2;
  
  console.log(`${description}:`);
  console.log(`  Without conversion: ${JSON.stringify(v1)} ${operation} ${JSON.stringify(v2)} = ${JSON.stringify(wrongResult)}`);
  console.log(`  With conversion: ${n1} ${operation} ${n2} = ${correctResult}`);
}

testEdgeCase('Decimal strings', "10.500", "5.250", '-');
testEdgeCase('Mixed types', "0.000", -1, '+');
testEdgeCase('Null values', null, 10, '+');
testEdgeCase('Undefined values', undefined, "5", '+');
testEdgeCase('Empty string', "", 100, '+');

console.log('\n=== All Tests Completed ===');
console.log('\n✅ Key Takeaway: Always use Number() conversion for database numeric values!');
