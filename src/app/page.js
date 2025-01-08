'use client'

import React, { useState } from 'react';
// Import the JSON file
import shapValues from '@/data/shap_values.json';

const findClosestCombination = (input) => {
  const switches = Math.min(parseInt(input.n_biologic_switches), 10);
  
  // Find the matching combination in our SHAP values
  const matchingCombo = shapValues.combinations.find(combo => 
    combo.input.early_onset === input.early_onset &&
    combo.input.ana_result === input.ana_result &&
    combo.input.jia_form === input.jia_form &&
    combo.input.ever_biologic === (switches > 0 ? "Yes" : "No") &&
    parseInt(combo.input.n_biologic_switches) === switches
  );
  
  return matchingCombo.shap_values;
};

// Generate explanation using actual SHAP values
const generateExplanation = (data, result, shapValues) => {
  const explanation = [];
  
  // Clinical feature names for better readability
  const clinicalNames = {
    'jia_form': 'Juvenile Idiopathic Arthritis (JIA) Form',
    'ana_result': 'ANA Status',
    'early_onset': 'Early Disease Onset',
    'n_biologic_switches': 'Number of Biologic Switches',
    'ever_biologic': 'History of Biologic Treatment'
  };
  
  // Create explanation for each feature
  Object.entries(shapValues).forEach(([feature, impact]) => {
    // Skip ever_biologic as it's derived from n_biologic_switches
    if (feature === 'ever_biologic') return;
    
    let value = data[feature];
    // Format the value for display
    if (feature === 'n_biologic_switches') {
      value = parseInt(value) > 10 ? '10+' : value;
    }
    
    explanation.push({
      feature: clinicalNames[feature],
      value: value,
      impact_type: impact > 0 ? "Increases" : "Decreases",
      impact_value: Math.abs(impact) * 100
    });
  });
  
  // Sort by absolute impact value
  return explanation.sort((a, b) => b.impact_value - a.impact_value);
};

const predictRisk = (data) => {
  const { jia_form, ana_result, early_onset, n_biologic_switches } = data;
  
  // Convert inputs to match the model's expected format
  const isOligo = jia_form === "Extended Oligo" || jia_form === "Persistent Oligo";
  const isANAPositive = ana_result === "Positive";
  const isEarlyOnset = early_onset === "Yes";
  const numSwitches = Math.min(parseInt(n_biologic_switches), 10); // Cap at 10
  
  let probability = 0;
  
  // Implementation of decision tree logic
  if (!isOligo) {
    if (numSwitches > 2.5) {
      if (isEarlyOnset) {
        probability = 1.0; // High risk
      } else {
        probability = 0.0; // Low risk
      }
    } else {
      probability = isANAPositive ? 0.193 : 0.0; // Low risk
    }
  } else {
    if (!isANAPositive) {
      probability = isEarlyOnset ? 0.635 : 0.156; // Moderate/Low risk
    } else {
      probability = numSwitches > 0.5 ? 0.955 : 0.686; // High/Moderate risk
    }
  }
  
  return {
    probability,
    riskLevel: probability > 0.7 ? "High" : probability > 0.3 ? "Moderate" : "Low"
  };
};


export default function UveitisPredictor() {
  const [formData, setFormData] = useState({
    early_onset: "",
    ana_result: "",
    jia_form: "",
    ever_biologic: "",
    n_biologic_switches: "0"
  });

  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [error, setError] = useState("");

  const predictRisk = (data) => {
    const { jia_form, ana_result, early_onset, n_biologic_switches } = data;
    
    // Convert inputs to match the model's expected format
    const isOligo = jia_form === "Extended Oligo" || jia_form === "Persistent Oligo";
    const isANAPositive = ana_result === "Positive";
    const isEarlyOnset = early_onset === "Yes";
    const numSwitches = parseInt(n_biologic_switches);
    
    let probability = 0;
    
    // Implementation of decision tree logic
    if (!isOligo) {
      if (numSwitches > 2.5) {
        if (isEarlyOnset) {
          probability = 1.0; // High risk
        } else {
          probability = 0.0; // Low risk
        }
      } else {
        probability = isANAPositive ? 0.193 : 0.0; // Low risk
      }
    } else {
      if (!isANAPositive) {
        probability = isEarlyOnset ? 0.635 : 0.156; // Moderate/Low risk
      } else {
        probability = numSwitches > 0.5 ? 0.955 : 0.686; // High/Moderate risk
      }
    }
    
    const riskLevel = probability > 0.7 ? "High" : probability > 0.3 ? "Moderate" : "Low";
    
    return { probability, riskLevel };
  };

  const renderDecisionTree = () => {
    const dotString = `digraph {
      rankdir=TB
      node [style="rounded,filled" fontname="Arial"]
      
      // Style the decision nodes (diamonds)
      0 [label="Is JIA form Persistent or Extended Oligoarthritis?" shape=rectangle fillcolor="#E5F3FF" color="#3B82F6"]
      "0L" [label="Number of biologic switches > 2.5?" shape=rectangle fillcolor="#E5F3FF" color="#3B82F6"]
      "0LL" [label="Is ANA positive?" shape=rectangle fillcolor="#E5F3FF" color="#3B82F6"]
      "0LR" [label="Disease onset ≤ 6 years?" shape=rectangle fillcolor="#E5F3FF" color="#3B82F6"]
      "0R" [label="Is ANA positive?" shape=rectangle fillcolor="#E5F3FF" color="#3B82F6"]
      "0RL" [label="Disease onset ≤ 6 years?" shape=rectangle fillcolor="#E5F3FF" color="#3B82F6"]
      "0RR" [label="Number of biologic switches > 0.5?" shape=rectangle fillcolor="#E5F3FF" color="#3B82F6"]
      
      // Style the end nodes (boxes) using the same colors as risk prediction
      "0LLL" [label="Low Risk\\nProbability: 0.0%" shape=box fillcolor="#DEF7EC" color="#046C4E" style=filled]
      "0LLR" [label="Low Risk\\nProbability: 19.3%" shape=box fillcolor="#DEF7EC" color="#046C4E" style=filled]
      "0LRL" [label="Low Risk\\nProbability: 0.0%" shape=box fillcolor="#DEF7EC" color="#046C4E" style=filled]
      "0LRR" [label="High Risk\\nProbability: 100.0%" shape=box fillcolor="#FDE8E8" color="#9B1C1C" style=filled]
      "0RLL" [label="Low Risk\\nProbability: 15.6%" shape=box fillcolor="#DEF7EC" color="#046C4E" style=filled]
      "0RLR" [label="Moderate Risk\\nProbability: 63.5%" shape=box fillcolor="#FDF6B2" color="#723B13" style=filled]
      "0RRL" [label="Moderate Risk\\nProbability: 68.6%" shape=box fillcolor="#FDF6B2" color="#723B13" style=filled]
      "0RRR" [label="High Risk\\nProbability: 95.5%" shape=box fillcolor="#FDE8E8" color="#9B1C1C" style=filled]
  
      // Connections
      "0LL" -> "0LLL" [label="No"]
      "0LL" -> "0LLR" [label="Yes"]
      "0LR" -> "0LRL" [label="No"]
      "0LR" -> "0LRR" [label="Yes"]
      "0L" -> "0LL" [label="No"]
      "0L" -> "0LR" [label="Yes"]
      "0RL" -> "0RLL" [label="No"]
      "0RL" -> "0RLR" [label="Yes"]
      "0RR" -> "0RRL" [label="No"]
      "0RR" -> "0RRR" [label="Yes"]
      "0R" -> "0RL" [label="No"]
      "0R" -> "0RR" [label="Yes"]
      0 -> "0L" [label="No"]
      0 -> "0R" [label="Yes"]
  
      // Edge styling
      edge [color="#64748B"]
    }`;
  
    // Use d3-graphviz to render the tree
    if (typeof window !== 'undefined') {  // Check if we're in the browser
      const viz = new Viz();
      viz.renderSVGElement(dotString)
        .then(element => {
          const container = document.getElementById('decisionTreeVisualization');
          if (container) {
            container.innerHTML = '';
            container.appendChild(element);
          }
        })
        .catch(error => {
          console.error('Error rendering decision tree:', error);
        });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const prediction = predictRisk(formData);
      const patientShapValues = findClosestCombination(formData);
      const explanationData = generateExplanation(formData, prediction, patientShapValues);
      
      setResult(prediction);
      setExplanation(explanationData);
      setError("");
      
      // Add slight delay to ensure DOM is ready
      setTimeout(renderDecisionTree, 100);
    } catch (err) {
      setError(err.message);
      setResult(null);
      setExplanation(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset biologic switches if ever_biologic is set to No
      ...(name === 'ever_biologic' && value === 'No' ? { n_biologic_switches: "0" } : {})
    }));
  };

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-center mb-6" style={{ color: '#0047AB' }}>
          Chronic Uveitis Probability Prediction in JIA Patients
        </h1>
        <div className="flex justify-center space-x-4 text-sm">
        <a 
          href="https://github.com/d-vinha/chronic-uveitis-predictor" 
          className="text-blue-600 hover:text-blue-800 underline"
          target="_blank"
          rel="noopener noreferrer">
                Link to GitHub Repository
        </a>      
      </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Early Onset */}
            <div className="form-group">
              <label className="block text-gray-700 font-bold mb-2">
                Early Disease Onset (≤6 years)
              </label>
              <select
                name="early_onset"
                value={formData.early_onset}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
              >
                <option value="" className="text-black">Select</option>
                <option value="Yes" className="text-black">Yes</option>
                <option value="No" className="text-black">No</option>
              </select>
            </div>
  
            {/* ANA Result */}
            <div className="form-group">
              <label className="block text-gray-700 font-bold mb-2">
                ANA Result
              </label>
              <select
                name="ana_result"
                value={formData.ana_result}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
              >
                <option value="" className="text-black">Select</option>
                <option value="Positive" className="text-black">Positive</option>
                <option value="Negative" className="text-black">Negative</option>
              </select>
            </div>
  
            {/* JIA Form */}
            <div className="form-group">
              <label className="block text-gray-700 font-bold mb-2">
                Juvenile Idiopathic Arthritis (JIA) Form
              </label>
              <select
                name="jia_form"
                value={formData.jia_form}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
              >
                <option value="" className="text-black">Select</option>
                <option value="Persistent Oligo" className="text-black">Persistent Oligoarthritis</option>
                <option value="Extended Oligo" className="text-black">Extended Oligoarthritis</option>
                <option value="Other" className="text-black">Other (RF+ Poly, RF- Poly, PsA, ERA, Systemic, Undifferentiated)</option>
              </select>
            </div>
  
            {/* Biologic Treatment */}
            <div className="form-group">
              <label className="block text-gray-700 font-bold mb-2">
                History of Biologic Treatment
              </label>
              <select
                name="ever_biologic"
                value={formData.ever_biologic}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
              >
                <option value="" className="text-black">Select</option>
                <option value="Yes" className="text-black">Yes</option>
                <option value="No" className="text-black">No</option>
              </select>
            </div>
  
            {/* Biologic Switches (Conditional) */}
            {formData.ever_biologic === 'Yes' && (
              <div className="form-group">
                <label className="block text-gray-700 font-bold mb-2">
                  Number of Biologic Switches (max 10)
                </label>
                <input
                  type="number"
                  name="n_biologic_switches"
                  value={formData.n_biologic_switches}
                  onChange={(e) => {
                    const value = Math.min(parseInt(e.target.value) || 0, 10);
                    handleChange({
                      target: {
                        name: 'n_biologic_switches',
                        value: value.toString()
                      }
                    });
                  }}
                  min="0"
                  max="10"
                  required
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                />
                {parseInt(formData.n_biologic_switches) === 10 && (
                  <p className="mt-1 text-sm text-gray-600">
                    Note: Values above 10 are capped at 10 for analysis - risk does not increase further above that
                  </p>
                )}
              </div>
            )}
  
            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-300"
            >
              Predict Probability
            </button>
          </form>
          {/* Results Section */}
          {result && (
            <div className="mt-6">
              <div className={`p-4 rounded-md text-center font-semibold ${
                result.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                result.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                <p>Probability Level: {result.riskLevel}</p>
                <p>Probability: {(result.probability * 100).toFixed(1)}%</p>
              </div>
            {/* Explanation Section */}
            {explanation && explanation.length > 0 && (
              <div className="mt-6 bg-white p-4 rounded-md shadow-md">
                <h2 className="text-xl font-bold mb-2 text-gray-800">
                  Clinical Factor Explanation
                </h2>
                <div className="space-y-2">
                  {explanation.map((factor, index) => (
                    <div key={index} className="p-2 bg-gray-100 rounded-md">
                      <p className="font-semibold text-gray-800">
                        {factor.feature}: {factor.value}
                      </p>
                      <p className={factor.impact_type === 'Increases' ? 'text-red-600' : 'text-green-600'}>
                        {factor.impact_type} risk by {factor.impact_value.toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Decision Tree Section */}
            {result && (
              <div className="mt-6 bg-white p-4 rounded-md shadow-md">
                <h2 className="text-xl font-bold mb-2 text-gray-800">
                  Decision Tree Visualization
                </h2>
                <div className="w-full overflow-auto">
                  <div id="decisionTreeVisualization" className="h-96">
                    {/* Tree will be rendered here */}
                  </div>
                </div>
                <div className="flex space-x-4 mt-4">
                  <button 
                    onClick={() => {
                      const svg = document.querySelector('#decisionTreeVisualization svg');
                      if (svg) {
                        const currentScale = svg.style.transform.match(/scale\((.*?)\)/) ?? ['', '1'];
                        const newScale = parseFloat(currentScale[1]) * 1.2;
                        svg.style.transform = `scale(${newScale})`;
                      }
                    }}
                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
                  >
                    Zoom In
                  </button>
                  <button 
                    onClick={() => {
                      const svg = document.querySelector('#decisionTreeVisualization svg');
                      if (svg) {
                        const currentScale = svg.style.transform.match(/scale\((.*?)\)/) ?? ['', '1'];
                        const newScale = parseFloat(currentScale[1]) * 0.8;
                        svg.style.transform = `scale(${newScale})`;
                      }
                    }}
                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
                  >
                    Zoom Out
                  </button>
                  <button 
                    onClick={() => {
                      const svg = document.querySelector('#decisionTreeVisualization svg');
                      if (svg) {
                        svg.style.transform = 'scale(1)';
                      }
                    }}
                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
                  >
                    Reset Zoom
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  );}
