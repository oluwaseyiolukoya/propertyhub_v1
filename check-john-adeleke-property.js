// Script to check John Adeleke property data
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkProperty() {
  try {
    // Find property by name
    const property = await prisma.properties.findFirst({
      where: {
        name: {
          contains: "John Adeleke",
          mode: "insensitive",
        },
      },
      include: {
        units: {
          select: {
            id: true,
            name: true,
            monthlyRent: true,
            features: true,
            status: true,
          },
        },
        _count: {
          select: {
            units: true,
          },
        },
      },
    });

    if (!property) {
      console.log('❌ Property "John Adeleke" not found');
      return;
    }

    console.log("\n📊 PROPERTY DATA:");
    console.log("==================");
    console.log("ID:", property.id);
    console.log("Name:", property.name);
    console.log("Features:", JSON.stringify(property.features, null, 2));

    // Check property-level rent frequency
    let propertyRentFrequency = "not set";
    if (property.features) {
      const features =
        typeof property.features === "string"
          ? JSON.parse(property.features)
          : property.features;

      propertyRentFrequency =
        features?.nigeria?.rentFrequency ||
        features?.rentFrequency ||
        property.rentFrequency ||
        "not set";
    }

    console.log("\n🏠 PROPERTY RENT FREQUENCY:", propertyRentFrequency);
    console.log("Property.rentFrequency field:", property.rentFrequency);

    console.log("\n🏘️  UNITS DATA:");
    console.log("================");
    property.units.forEach((unit, index) => {
      console.log(`\nUnit ${index + 1}:`);
      console.log("  ID:", unit.id);
      console.log("  Name:", unit.name);
      console.log("  Monthly Rent:", unit.monthlyRent);
      console.log("  Status:", unit.status);

      let unitRentFrequency = "not set";
      if (unit.features) {
        const unitFeatures =
          typeof unit.features === "string"
            ? JSON.parse(unit.features)
            : unit.features;

        unitRentFrequency =
          unitFeatures?.nigeria?.rentFrequency ||
          unitFeatures?.rentFrequency ||
          "not set";
      }
      console.log("  Rent Frequency:", unitRentFrequency);
      console.log("  Features:", JSON.stringify(unit.features, null, 2));
    });

    // Calculate what totalMonthlyIncome would be
    console.log("\n💰 CALCULATIONS:");
    console.log("================");
    const occupiedUnits = property.units.filter((u) => u.status === "occupied");
    console.log("Occupied Units:", occupiedUnits.length);

    let totalMonthlyIncome = 0;
    occupiedUnits.forEach((unit) => {
      let unitFeatures = unit.features;
      if (typeof unitFeatures === "string") {
        try {
          unitFeatures = JSON.parse(unitFeatures);
        } catch {
          unitFeatures = {};
        }
      }

      const rentFreq =
        unitFeatures?.nigeria?.rentFrequency ||
        unitFeatures?.rentFrequency ||
        "monthly";

      const monthlyRent = unit.monthlyRent || 0;

      if (rentFreq === "annual" || rentFreq === "yearly") {
        totalMonthlyIncome += monthlyRent / 12;
        console.log(
          `  Unit ${unit.name}: ${monthlyRent} (annual) → ${
            monthlyRent / 12
          } monthly equivalent`
        );
      } else {
        totalMonthlyIncome += monthlyRent;
        console.log(`  Unit ${unit.name}: ${monthlyRent} (monthly)`);
      }
    });

    console.log("\nTotal Monthly Income (from backend):", totalMonthlyIncome);

    // Calculate Gross Rent based on property frequency
    let grossRent;
    if (propertyRentFrequency === "annual") {
      grossRent = totalMonthlyIncome * 12;
      console.log(
        "Gross Rent (Annual):",
        grossRent,
        "(calculated as monthly × 12)"
      );
    } else {
      grossRent = totalMonthlyIncome;
      console.log("Gross Rent (Monthly):", grossRent);
    }

    // Calculate Cash Flow
    console.log("\n💵 CASH FLOW CALCULATION:");
    console.log("=========================");
    console.log("Gross Rent:", grossRent);
    console.log("Property Rent Frequency:", propertyRentFrequency);

    // Assuming no expenses for now
    const expenses = 0;
    const netIncome = grossRent - expenses;
    console.log("Net Income:", netIncome, `(${propertyRentFrequency})`);

    let monthlyCashFlow;
    if (propertyRentFrequency === "annual") {
      monthlyCashFlow = (netIncome * 0.6) / 12;
      console.log(
        "Monthly Cash Flow:",
        monthlyCashFlow,
        "= (",
        netIncome,
        "× 0.6) / 12"
      );
    } else {
      monthlyCashFlow = netIncome * 0.6;
      console.log(
        "Monthly Cash Flow:",
        monthlyCashFlow,
        "=",
        netIncome,
        "× 0.6"
      );
    }

    console.log("\n✅ CORRECT CASH FLOW:", monthlyCashFlow);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProperty();
