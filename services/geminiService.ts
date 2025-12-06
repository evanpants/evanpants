import { GoogleGenAI } from "@google/genai";
import { PropertyData, CompListing } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to parse JSON from a potential markdown block
const extractJSON = (text: string): any => {
  try {
    // Attempt direct parse
    return JSON.parse(text);
  } catch (e) {
    // Attempt to find markdown code block
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        console.error("Failed to parse extracted JSON block", e2);
      }
    }
    // Attempt to find just the first { and last }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(text.substring(start, end + 1));
      } catch (e3) {
        console.error("Failed to parse JSON substring", e3);
      }
    }
    throw new Error("Could not parse JSON response from model");
  }
};

export const analyzeProperty = async (address: string): Promise<PropertyData> => {
  const ai = getClient();

  const prompt = `
    I need a real estate investment analysis for the property at: "${address}".
    
    Please perform the following steps using Google Search:
    1. Find the current estimated market value or list price of this property.
    2. Estimate the number of units and bedrooms/bathrooms.
    3. Find current RENTAL listings (comps) for similar properties in the same neighborhood (look for data from StreetEasy, Zillow, Redfin, etc.). 
    4. Estimate the monthly market rent for the units in this property based on those comps.
    5. Estimate the annual property tax and annual homeowner's insurance cost.
    
    Return the data strictly as a JSON object with the following structure. Do not return any other text.
    {
      "listPrice": number (estimated value in USD),
      "numUnits": number (default to 1 if unknown),
      "estimatedRentPerUnit": number (monthly rent in USD),
      "propertyTaxAnnual": number (annual tax in USD),
      "insuranceAnnual": number (annual insurance in USD),
      "hoaMonthly": number (monthly HOA dues if applicable, else 0),
      "description": string (short summary of property details found),
      "comps": [
        {
          "address": string,
          "price": number (rent price),
          "type": "RENT",
          "bedrooms": number,
          "bathrooms": number,
          "source": string (e.g. "Zillow", "StreetEasy")
        }
      ]
    }
    
    If exact numbers are not found, make a highly educated estimate based on the local market data found in your search.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Using pro for better reasoning/search capability
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Note: responseMimeType is not allowed with googleSearch, so we parse manually
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = extractJSON(text);
    
    // Process units and rents
    const numUnits = data.numUnits || 1;
    const estimatedRent = data.estimatedRentPerUnit || 0;
    
    // Create initial rent array, defaulting all units to the estimated average
    const unitRents = new Array(numUnits).fill(estimatedRent);

    // Validate and fill defaults if necessary
    return {
      address: address,
      listPrice: data.listPrice || 0,
      numUnits: numUnits,
      estimatedRentPerUnit: estimatedRent,
      unitRents: unitRents,
      propertyTaxAnnual: data.propertyTaxAnnual || 0,
      insuranceAnnual: data.insuranceAnnual || 0,
      hoaMonthly: data.hoaMonthly || 0,
      maintenanceRate: 5, // Default 5%
      vacancyRate: 5,     // Default 5%
      description: data.description || "No description available.",
      comps: Array.isArray(data.comps) ? data.comps : [],
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
