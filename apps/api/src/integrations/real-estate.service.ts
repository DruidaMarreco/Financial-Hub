import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface Property {
  id: string;
  address: string;
  zipCode: string;
  propertyType: 'residential' | 'commercial' | 'land';
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  estimatedValue: number;
  purchasePrice?: number;
  purchaseDate?: Date;
  mortgageBalance?: number;
  mortgageRate?: number;
  mortgageMonths?: number;
  rentalIncome?: number;
  expenses?: number;
  lastUpdated: Date;
}

interface RealEstatePortfolio {
  properties: Property[];
  totalValue: number;
  totalEquity: number;
  totalDebt: number;
  totalNetWorth: number;
  rentalIncome: number;
  expenses: number;
  netRentalIncome: number;
}

@Injectable()
export class RealEstateService {
  private readonly ZILLOW_API = 'https://api.zillow.com'; // Requires API key
  private readonly REALTOR_API = 'https://api.realtor.com'; // Requires API key

  /**
   * Get property valuation estimate from Zillow
   */
  async getPropertyEstimate(
    address: string,
    zipCode: string,
    zillowApiKey?: string,
  ): Promise<{ estimate: number; confidence: number }> {
    try {
      // Note: Zillow API requires authentication
      // This is a simplified structure for demonstration
      if (!zillowApiKey) {
        return {
          estimate: 0,
          confidence: 0,
        };
      }

      // Would make actual API call with authentication
      const response = await axios.get(`${this.ZILLOW_API}/GetSearchResults.htm`, {
        params: {
          address,
          citystatezip: zipCode,
          'zws-id': zillowApiKey,
        },
      });

      // Parse Zillow response
      const zestimate = parseFloat(response.data.searchresults?.result?.[0]?.zestimate?.amount) || 0;

      return {
        estimate: zestimate,
        confidence: 0.75, // Zillow estimates typically have 75% confidence
      };
    } catch (error) {
      console.error(`Failed to get property estimate:`, error);
      return {
        estimate: 0,
        confidence: 0,
      };
    }
  }

  /**
   * Calculate property equity
   */
  calculateEquity(property: Property): number {
    if (!property.mortgageBalance) {
      return property.estimatedValue;
    }
    return Math.max(0, property.estimatedValue - property.mortgageBalance);
  }

  /**
   * Calculate mortgage details
   */
  calculateMortgage(
    loanAmount: number,
    interestRate: number,
    months: number,
  ): {
    monthlyPayment: number;
    totalPaid: number;
    totalInterest: number;
  } {
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
      (Math.pow(1 + monthlyRate, months) - 1);

    const totalPaid = monthlyPayment * months;
    const totalInterest = totalPaid - loanAmount;

    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
    };
  }

  /**
   * Build real estate portfolio summary
   */
  buildPortfolio(properties: Property[]): RealEstatePortfolio {
    const totalValue = properties.reduce((sum, p) => sum + p.estimatedValue, 0);
    const totalDebt = properties.reduce((sum, p) => sum + (p.mortgageBalance || 0), 0);
    const totalEquity = totalValue - totalDebt;
    const rentalIncome = properties.reduce((sum, p) => sum + (p.rentalIncome || 0), 0);
    const expenses = properties.reduce((sum, p) => sum + (p.expenses || 0), 0);
    const netRentalIncome = rentalIncome - expenses;

    return {
      properties,
      totalValue,
      totalEquity,
      totalDebt,
      totalNetWorth: totalEquity,
      rentalIncome,
      expenses,
      netRentalIncome,
    };
  }

  /**
   * Calculate property ROI
   */
  calculateROI(property: Property): {
    cashOnCash: number;
    capRate: number;
    roi: number;
  } {
    const equity = this.calculateEquity(property);
    const annualRentalIncome = (property.rentalIncome || 0) * 12;
    const annualExpenses = (property.expenses || 0) * 12;
    const netOperatingIncome = annualRentalIncome - annualExpenses;

    // Cash-on-cash return
    const cashOnCash = equity > 0 ? (netOperatingIncome / equity) * 100 : 0;

    // Cap rate (property-level metric)
    const capRate = property.estimatedValue > 0 ? (netOperatingIncome / property.estimatedValue) * 100 : 0;

    // Overall ROI (appreciation + rental income)
    const appreciation = 0; // Would be calculated from historical values
    const totalReturn = appreciation + netOperatingIncome;
    const roi = equity > 0 ? (totalReturn / equity) * 100 : 0;

    return {
      cashOnCash,
      capRate,
      roi,
    };
  }

  /**
   * Analyze property diversification
   */
  analyzeDiversification(properties: Property[]): {
    byType: Record<string, number>;
    byLocation: Record<string, number>;
    concentration: string;
  } {
    const totalValue = properties.reduce((sum, p) => sum + p.estimatedValue, 0);

    // By property type
    const byType: Record<string, number> = {};
    for (const property of properties) {
      const type = property.propertyType;
      byType[type] = (byType[type] || 0) + property.estimatedValue;
    }

    // By location
    const byLocation: Record<string, number> = {};
    for (const property of properties) {
      const zip = property.zipCode;
      byLocation[zip] = (byLocation[zip] || 0) + property.estimatedValue;
    }

    // Convert to percentages
    const typePercent: Record<string, number> = {};
    for (const [type, value] of Object.entries(byType)) {
      typePercent[type] = (value / totalValue) * 100;
    }

    const locationPercent: Record<string, number> = {};
    for (const [zip, value] of Object.entries(byLocation)) {
      locationPercent[zip] = (value / totalValue) * 100;
    }

    // Assess concentration
    let concentration = 'well-diversified';
    const maxLocation = Math.max(...Object.values(locationPercent));
    if (maxLocation > 75) {
      concentration = 'highly-concentrated';
    } else if (maxLocation > 50) {
      concentration = 'moderately-concentrated';
    }

    return {
      byType: typePercent,
      byLocation: locationPercent,
      concentration,
    };
  }

  /**
   * Tax planning insights
   */
  getTaxInsights(properties: Property[]): {
    depreciationDeduction: number;
    interestDeduction: number;
    propertyTaxDeduction: number;
    totalDeductions: number;
  } {
    let depreciationDeduction = 0;
    let interestDeduction = 0;
    let propertyTaxDeduction = 0;

    for (const property of properties) {
      // Depreciation (residential: 27.5 years, commercial: 39 years)
      if (property.propertyType === 'residential' && property.estimatedValue) {
        const depreciableValue = property.estimatedValue * 0.8; // 80% of value
        depreciationDeduction += depreciableValue / 27.5 / 12; // Monthly
      }

      // Mortgage interest
      if (property.mortgageBalance && property.mortgageRate) {
        interestDeduction += (property.mortgageBalance * property.mortgageRate) / 100 / 12; // Monthly
      }

      // Property taxes (estimated at 0.8% of value)
      propertyTaxDeduction += property.estimatedValue * 0.008 / 12; // Monthly
    }

    return {
      depreciationDeduction: Math.round(depreciationDeduction * 100) / 100,
      interestDeduction: Math.round(interestDeduction * 100) / 100,
      propertyTaxDeduction: Math.round(propertyTaxDeduction * 100) / 100,
      totalDeductions:
        Math.round((depreciationDeduction + interestDeduction + propertyTaxDeduction) * 100) / 100,
    };
  }
}
